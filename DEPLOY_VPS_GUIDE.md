# 🚀 Panduan Deploy Backend ke VPS

## Informasi VPS
- **IP Address:** 72.61.140.193
- **User:** root
- **Path:** /var/www/rajawali-backend
- **PM2 App Name:** rajawali-api

## Persiapan (Hanya Sekali)

### 1. Pastikan SSH Key Sudah Setup
Jika belum punya SSH key, buat dulu:
```bash
ssh-keygen -t rsa -b 4096
```

Copy SSH key ke VPS:
```bash
ssh-copy-id root@72.61.140.193
```

### 2. Setup VPS (Jalankan di VPS via SSH)
```bash
# Login ke VPS
ssh root@72.61.140.193

# Update system
apt update && apt upgrade -y

# Install Node.js (jika belum ada)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install MySQL (jika belum ada)
apt install -y mysql-server

# Buat database
mysql -u root -p
CREATE DATABASE rajawali;
exit

# Buat folder aplikasi
mkdir -p /var/www/rajawali-backend
cd /var/www/rajawali-backend

# Buat file .env
nano .env
```

### 3. Isi File .env di VPS
```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rajawali
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=https://your-domain.com
# Atau jika pakai IP: http://72.61.140.193:3000

# File Upload
MAX_FILE_SIZE=5242880

# API Configuration
API_VERSION=v1
```

## Deployment

### Cara 1: Menggunakan Script Deploy (Recommended)
```bash
# Dari folder rj-backend di komputer lokal
# Jalankan di Git Bash atau WSL

cd c:/laragon/www/rajawali/rj-backend
bash deploy-to-vps.sh
```

### Cara 2: Manual Deploy
```bash
# 1. Upload files
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs/*.log' \
  --exclude 'uploads/*' \
  ./ root@72.61.140.193:/var/www/rajawali-backend/

# 2. Login ke VPS dan install
ssh root@72.61.140.193

cd /var/www/rajawali-backend
npm install --production
node src/database/migrate.js

# 3. Start aplikasi
pm2 start src/server.js --name rajawali-api
pm2 save
pm2 startup
```

## Monitoring & Maintenance

### Melihat Status Aplikasi
```bash
ssh root@72.61.140.193 'pm2 status'
```

### Melihat Logs
```bash
# Real-time logs
ssh root@72.61.140.193 'pm2 logs rajawali-api'

# 50 baris terakhir
ssh root@72.61.140.193 'pm2 logs rajawali-api --lines 50'
```

### Restart Aplikasi
```bash
ssh root@72.61.140.193 'pm2 restart rajawali-api'
```

### Stop Aplikasi
```bash
ssh root@72.61.140.193 'pm2 stop rajawali-api'
```

### Jalankan Migration
```bash
ssh root@72.61.140.193 'cd /var/www/rajawali-backend && node src/database/migrate.js'
```

## Nginx Configuration (Optional)

Jika ingin pakai Nginx sebagai reverse proxy:

```bash
# Install Nginx
apt install -y nginx

# Buat config
nano /etc/nginx/sites-available/rajawali-api
```

Isi file config:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Ganti dengan domain Anda

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /uploads {
        alias /var/www/rajawali-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Aktifkan config:
```bash
ln -s /etc/nginx/sites-available/rajawali-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## SSL Certificate (Optional)

Install Certbot untuk SSL gratis:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

## Troubleshooting

### Aplikasi tidak jalan
```bash
ssh root@72.61.140.193
pm2 logs rajawali-api --err
```

### Database error
```bash
# Cek apakah database sudah dibuat
ssh root@72.61.140.193 'mysql -u root -p -e "SHOW DATABASES;"'

# Jalankan migration
ssh root@72.61.140.193 'cd /var/www/rajawali-backend && node src/database/migrate.js'
```

### Port sudah digunakan
```bash
# Cek process yang menggunakan port 5000
ssh root@72.61.140.193 'lsof -i :5000'

# Kill process jika perlu
ssh root@72.61.140.193 'kill -9 PID'
```

### Permission error pada uploads
```bash
ssh root@72.61.140.193 'chmod -R 755 /var/www/rajawali-backend/uploads'
```

## Checklist Deployment

- [ ] SSH key sudah setup
- [ ] Node.js terinstall di VPS
- [ ] PM2 terinstall di VPS
- [ ] MySQL terinstall dan database dibuat
- [ ] File .env sudah dikonfigurasi
- [ ] Deploy script berhasil dijalankan
- [ ] Migration berhasil
- [ ] PM2 aplikasi running
- [ ] API bisa diakses (test: http://72.61.140.193:5000/api/health)
- [ ] Upload folder writable
- [ ] CORS dikonfigurasi untuk frontend

## Testing

Setelah deploy, test endpoint:
```bash
# Health check
curl http://72.61.140.193:5000/api/health

# Test API
curl http://72.61.140.193:5000/api/lakaraja/kuota
```

## Update Kode

Setiap kali ada perubahan kode:
```bash
cd c:/laragon/www/rajawali/rj-backend
bash deploy-to-vps.sh
```

Script akan otomatis:
1. Upload file terbaru
2. Install dependencies
3. Jalankan migration
4. Restart aplikasi

---
**Dibuat:** 16 Januari 2026  
**IP VPS:** 72.61.140.193  
**Path:** /var/www/rajawali-backend
