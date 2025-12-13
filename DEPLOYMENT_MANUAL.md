# Panduan Manual Deploy ke VPS 72.61.140.193

## Opsi 1: Menggunakan Script Otomatis (Recommended)

### Dari Git Bash:
```bash
cd /c/laragon/www/rajawali/rj-backend
bash deploy-to-vps.sh
```

### Dari PowerShell:
```powershell
cd C:\laragon\www\rajawali\rj-backend
.\deploy-to-vps.ps1
```

---

## Opsi 2: Deploy Manual Step-by-Step

### 1. SSH ke VPS
```bash
ssh root@72.61.140.193
```

### 2. Cek lokasi project rajawali yang sudah ada
```bash
find / -name "rajawali*" -type d 2>/dev/null
# atau
ls -la /var/www/
# atau
pm2 list
```

### 3. Masuk ke direktori backend
```bash
cd /var/www/rajawali-backend
# atau sesuai hasil pencarian di step 2
```

### 4. Backup dulu (opsional tapi recommended)
```bash
cp -r /var/www/rajawali-backend /var/www/rajawali-backend.backup-$(date +%Y%m%d)
```

### 5. Upload file yang diupdate dari local

**Dari komputer lokal (PowerShell baru):**

#### Upload controller yang sudah diupdate:
```powershell
scp C:\laragon\www\rajawali\rj-backend\src\controllers\lakarajaController.js root@72.61.140.193:/var/www/rajawali-backend/src/controllers/
```

#### Upload routes yang sudah diupdate:
```powershell
scp C:\laragon\www\rajawali\rj-backend\src\routes\lakarajaRoutes.js root@72.61.140.193:/var/www/rajawali-backend/src/routes/
```

### 6. Kembali ke SSH VPS dan restart aplikasi
```bash
# Lihat daftar aplikasi PM2
pm2 list

# Restart aplikasi (nama mungkin berbeda, sesuaikan)
pm2 restart rajawali-api
# atau
pm2 restart all

# Lihat logs untuk memastikan tidak ada error
pm2 logs rajawali-api --lines 50

# Lihat status
pm2 status
```

### 7. Test endpoint baru
```bash
# Dari VPS, test endpoint delete
curl -X DELETE http://localhost:5000/api/lakaraja/panitia/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Opsi 3: Upload Semua File dengan ZIP

### Dari Local (PowerShell):
```powershell
# 1. Masuk ke folder backend
cd C:\laragon\www\rajawali\rj-backend

# 2. Compress file (exclude node_modules)
# Gunakan 7zip atau WinRAR, exclude: node_modules, .git, logs, uploads

# 3. Upload zip ke VPS
scp rajawali-backend.zip root@72.61.140.193:/tmp/
```

### Di VPS:
```bash
# 1. Extract
cd /var/www/rajawali-backend
unzip -o /tmp/rajawali-backend.zip

# 2. Install dependencies
npm install --production

# 3. Restart
pm2 restart rajawali-api

# 4. Check
pm2 logs rajawali-api
```

---

## Quick Commands Reference

```bash
# SSH ke VPS
ssh root@72.61.140.193

# Cek status aplikasi
pm2 status

# Restart aplikasi
pm2 restart rajawali-api

# Lihat logs
pm2 logs rajawali-api

# Lihat logs error saja
pm2 logs rajawali-api --err

# Stop aplikasi
pm2 stop rajawali-api

# Start aplikasi
pm2 start rajawali-api

# Reload aplikasi (zero-downtime)
pm2 reload rajawali-api

# Monitor real-time
pm2 monit
```

---

## Troubleshooting

### Jika PM2 tidak ditemukan:
```bash
npm install -g pm2
```

### Jika port sudah digunakan:
```bash
# Cari process yang menggunakan port 5000
lsof -i :5000
# atau
netstat -tulpn | grep 5000

# Kill process
kill -9 [PID]
```

### Jika ada error database:
```bash
# Edit .env
nano /var/www/rajawali-backend/.env

# Cek koneksi database
mysql -u username -p -h localhost database_name
```

### Reset semua dan mulai dari awal:
```bash
cd /var/www/rajawali-backend
pm2 delete rajawali-api
rm -rf node_modules
npm install --production
pm2 start src/server.js --name rajawali-api
pm2 save
```
