type Env = {
  DB: D1Database
  ASSETS: Fetcher
}

type UserRow = { username: string; role: 'admin' | 'kasir'; name: string; token?: string }

const apiHeaders = (request: Request) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': request.headers.get('Origin') ?? '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Vary': 'Origin',
})

const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: apiHeaders(request) })

async function hashPassword(value: string) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, name TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL)'),
    db.prepare('CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL)'),
  ])
  const count = await db.prepare('SELECT COUNT(*) AS count FROM users').first<{ count: number }>()
  if (!count?.count) {
    const passwordHash = await hashPassword('kopiwaras')
    await db.batch([
      db.prepare('INSERT INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)').bind('user-admin', 'admin', passwordHash, 'admin', 'Administrator'),
      db.prepare('INSERT INTO users (id, username, password_hash, role, name) VALUES (?, ?, ?, ?, ?)').bind('user-kasir', 'kasir', passwordHash, 'kasir', 'Kasir Toko'),
    ])
  }
}

async function authenticate(request: Request, db: D1Database) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  return db.prepare('SELECT users.username, users.role, users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ?').bind(token, new Date().toISOString()).first<UserRow>()
}

async function handleApi(request: Request, env: Env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: apiHeaders(request) })
  const db = env.DB
  await ensureSchema(db)
  const path = new URL(request.url).pathname.replace(/^\/api\/?/, '')

  if (path === 'health' && request.method === 'GET') return json(request, { ok: true, service: 'kopi-waras-api' })

  if (path === 'auth/login' && request.method === 'POST') {
    const body = await request.json() as { username?: string; password?: string }
    const passwordHash = await hashPassword(body.password ?? '')
    const user = await db.prepare('SELECT id, username, role, name FROM users WHERE username = ? AND password_hash = ?').bind((body.username ?? '').toLowerCase(), passwordHash).first<{ id: string; username: string; role: 'admin' | 'kasir'; name: string }>()
    if (!user) return json(request, { error: 'Username atau password belum sesuai.' }, 401)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
    await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expiresAt).run()
    return json(request, { user: { username: user.username, role: user.role, name: user.name, token } })
  }

  if (path === 'state' && (request.method === 'GET' || request.method === 'PUT')) {
    const user = await authenticate(request, db)
    if (!user) return json(request, { error: 'Sesi tidak valid.' }, 401)
    if (request.method === 'GET') {
      const row = await db.prepare('SELECT payload, updated_at FROM app_state WHERE id = 1').first<{ payload: string; updated_at: string }>()
      return json(request, { state: row ? JSON.parse(row.payload) : null, updatedAt: row?.updated_at ?? null, role: user.role })
    }
    const body = await request.json() as { state?: unknown }
    if (!body.state || typeof body.state !== 'object') return json(request, { error: 'Payload state tidak valid.' }, 400)
    const now = new Date().toISOString()
    await db.prepare('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(JSON.stringify(body.state), now).run()
    return json(request, { ok: true, updatedAt: now })
  }

  return json(request, { error: 'Endpoint tidak ditemukan.' }, 404)
}

export default {
  async fetch(request: Request, env: Env) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request, env)
    return env.ASSETS.fetch(request)
  },
}

