# Telegram Linking And n8n Setup

File workflow yang sudah disesuaikan untuk sistem multi-user ada di:

- `n8n/telegram-expense-workflow.one-to-many.json`
- `n8n/telegram-link-workflow.one-to-many.json`

## Cara kerja

1. User login ke aplikasi.
2. User buka `Profile > Telegram`.
3. User klik `Generate Token`.
4. User scan QR atau kirim ke bot Telegram: `/start TOKEN`
5. Workflow linking memanggil Supabase Edge Function `telegram-link` dengan action `consume_token`.
6. Setelah koneksi terverifikasi, workflow transaksi akan mengirim data ke `telegram-expense-ingest`.
7. Function tersebut mencari `telegram_chat_id` yang terhubung lalu menyimpan expense ke `user_id` yang benar.

## Pemisahan workflow

Gunakan 2 workflow terpisah:

1. `telegram-link-workflow.one-to-many.json`
   Khusus untuk command `/start TOKEN`
   Jangan lewat AI parser

2. `telegram-expense-workflow.one-to-many.json`
   Khusus untuk pesan transaksi biasa
   Sudah ada guard agar payload kosong tidak dikirim ke Supabase

## Endpoint yang dipakai

- Linking: `https://tnmosbaqgmxtcajblodu.supabase.co/functions/v1/telegram-link`
- Ingest expense: `https://tnmosbaqgmxtcajblodu.supabase.co/functions/v1/telegram-expense-ingest`

## QR code di aplikasi

Supaya user tinggal scan tanpa mengetik token manual, set username bot di frontend:

```env
VITE_TELEGRAM_BOT_USERNAME=nama_bot_telegram_anda
```

Kalau env ini terisi, aplikasi akan membuat QR deep link dengan format:

```text
https://t.me/<bot_username>?start=<token>
```

Saat QR di-scan, user akan langsung dibawa ke bot Telegram dengan payload token linking.

## Payload utama untuk ingest

```json
{
  "telegram_chat_id": 123456789,
  "telegram_user_id": 123456789,
  "name": "Bayar listrik",
  "amount": 450000,
  "account": "Bank Jago",
  "category": "Needs",
  "is_paid": true,
  "date": "Apr 24, 2026",
  "budget_month": "2026-04"
}
```

## Catatan penting

- Untuk private chat, `telegram_user_id` juga diverifikasi agar chat milik user yang benar.
- Satu user bisa punya banyak koneksi Telegram.
- Salah satu koneksi bisa dijadikan `primary` dari aplikasi.
- Workflow transaksi sekarang menahan request jika `name`, `amount`, `account`, atau `category` belum valid.
