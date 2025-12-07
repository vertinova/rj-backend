# Backend API - Paskibra Rajawali

Backend API menggunakan Express.js dan MySQL untuk sistem manajemen Paskibra Rajawali MAN 1 Kabupaten Bogor.

## 📋 Prerequisites

- Node.js v18+ 
- MySQL Database
- npm atau yarn

## 🚀 Installation

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` menjadi `.env`:
```bash
copy .env.example .env
```

3. Konfigurasi file `.env`:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=rajawali

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:5173
```

4. Import database schema (lihat file `database.sql`)

5. Jalankan server:
```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Struktur Folder

```
backend/
├── src/
│   ├── config/          # Konfigurasi database & logger
│   ├── controllers/     # Business logic
│   ├── middleware/      # Auth, upload, validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── uploads/             # File uploads
├── logs/                # Application logs
├── .env                 # Environment variables
└── package.json
```

## 🛣️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register user baru
- `POST /login` - Login user
- `GET /profile` - Get user profile (protected)
- `PUT /change-password` - Ubah password (protected)

### Taruna (`/api/taruna`)
- `POST /pendaftaran` - Submit pendaftaran
- `GET /pendaftaran/status` - Cek status pendaftaran
- `POST /absensi` - Submit absensi
- `GET /absensi/history` - Riwayat absensi

### Admin (`/api/admin`)
- `GET /dashboard/stats` - Statistik dashboard
- `GET /pendaftar` - List semua pendaftar
- `GET /pendaftar/:id` - Detail pendaftar
- `PUT /pendaftar/:id/status` - Update status pendaftar
- `POST /pendaftar/:id/generate-kta` - Generate nomor KTA
- `DELETE /pendaftar/:id` - Hapus pendaftar
- `GET /users` - List semua user
- `DELETE /users/:id` - Hapus user
- `PUT /users/:id/reset-password` - Reset password user
- `GET /absensi` - List semua absensi

## 🔒 Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi. Setiap request ke endpoint yang protected harus menyertakan token di header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Response Format

Success Response:
```json
{
  "success": true,
  "message": "Pesan sukses",
  "data": {}
}
```

Error Response:
```json
{
  "success": false,
  "message": "Pesan error"
}
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 5000 |
| DB_HOST | Database host | localhost |
| DB_USER | Database user | root |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | rajawali |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRE | JWT expiration | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:5173 |

## 📦 Dependencies

- **express** - Web framework
- **mysql2** - MySQL client
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File upload
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - CORS handling
- **winston** - Logging
- **morgan** - HTTP logging

## 🐛 Debugging

Logs tersimpan di folder `logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

## 📄 License

MIT
