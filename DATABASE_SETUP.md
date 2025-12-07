# Database Setup - Rajawali Backend

## 📋 Quick Setup

### 1. Create Database

```sql
CREATE DATABASE rajawali CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

### 2. Import Database Schema & Data

**Opsi A - Menggunakan MySQL Command Line:**
```bash
mysql -u root -p rajawali < database.sql
```

**Opsi B - Menggunakan phpMyAdmin:**
1. Buka phpMyAdmin
2. Pilih database `rajawali`
3. Klik tab "Import"
4. Choose File → pilih `database.sql`
5. Klik "Go"

### 3. Update Tipe Absensi (Fitur Terbaru)

Setelah import database.sql, jalankan migration untuk fitur Absen Latihan & Pulang:

```bash
mysql -u root -p rajawali < add_tipe_absensi.sql
```

Atau import manual melalui phpMyAdmin.

## 📊 Database Schema

### Tables:
- **users** - User accounts (admin & taruna)
- **calon_taruna** - Pendaftaran taruna (profile & documents)
- **absensi** - Attendance records (dengan tipe_absensi)
- **notifications** (if exists)

### Default Admin Account:
```
Username: admin
Password: Juara!
```

⚠️ **PENTING:** Ubah password admin setelah login pertama kali!

## 🔄 Migration Files

1. **database.sql** - Schema lengkap + sample data (583 baris)
2. **add_tipe_absensi.sql** - Menambahkan kolom tipe_absensi (datang/pulang)
3. **update_absensi.sql** - Legacy migration (optional)
4. **update_absensi_table.sql** - Legacy migration (optional)

## 🔧 Troubleshooting

### Error: "Database already exists"
```sql
DROP DATABASE IF EXISTS rajawali;
CREATE DATABASE rajawali;
```

### Error: "Access denied"
Pastikan user MySQL memiliki privileges:
```sql
GRANT ALL PRIVILEGES ON rajawali.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Reset Database (Fresh Install)
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS rajawali; CREATE DATABASE rajawali;"
mysql -u root -p rajawali < database.sql
mysql -u root -p rajawali < add_tipe_absensi.sql
```

## 📱 Features in Database

### Absensi Table Structure:
- `id` - Primary key
- `user_id` - Foreign key to users
- `username` - Username
- `kampus` - Kampus 1 / Kampus 2
- `status_absensi` - hadir / izin / sakit
- `tipe_absensi` - **datang** (Absen Latihan) / **pulang** (Absen Pulang)
- `tanggal_absensi` - Date
- `waktu_absensi` - Time (HH:MM:SS)
- `foto_absensi` - Photo filename
- `keterangan` - Notes (untuk izin/sakit)
- `created_at` - Timestamp

### Sample Data:
✅ 305 absensi records (historical data)
✅ Multiple user accounts
✅ Complete taruna profiles

## 🚀 Deployment Notes

### Production Setup:
1. Backup database secara berkala
2. Gunakan `.env.production` untuk credentials
3. Set proper MySQL user privileges (bukan root)
4. Enable MySQL slow query log untuk monitoring

### Backup Command:
```bash
mysqldump -u root -p rajawali > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Backup:
```bash
mysql -u root -p rajawali < backup_20251207_120000.sql
```

---

**Last Updated:** December 7, 2025
**Database Version:** v2.0 (dengan tipe_absensi)
