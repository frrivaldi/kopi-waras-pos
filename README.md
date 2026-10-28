# Kopi Waras POS

POS untuk Kopi Waras dengan dashboard penjualan, resep bahan baku, stok otomatis, konfirmasi pembayaran, login Admin/Kasir, dan koneksi printer Bluetooth BLE ESC/POS.

## Akses demo lokal

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `kopiwaras` |
| Kasir | `kasir` | `kopiwaras` |

Pada deployment Cloudflare, login dan state toko disimpan melalui Pages Functions + D1. Pada preview lokal tanpa API, aplikasi tetap memakai data demo browser.

## Arsitektur publish gratis

- GitHub: source code dan GitHub Actions.
- Cloudflare Pages: hosting frontend dan Pages Functions.
- Cloudflare D1: database bersama untuk login, transaksi, resep, dan stok.

Salin `wrangler.toml.example` menjadi `wrangler.toml`, lalu isi `database_id` dari D1. Tambahkan `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` sebagai GitHub Actions secrets. Workflow `.github/workflows/deploy-cloudflare.yml` akan membangun dan menerbitkan aplikasi setiap push ke `main` atau `master`.

## Jalankan lokal

```bash
npm install
npm run dev
```

Catatan: GitHub Pages hanya hosting statis dan tidak menyediakan database bersama. Deployment produksi untuk aplikasi kasir ini menggunakan Cloudflare Pages + D1.

