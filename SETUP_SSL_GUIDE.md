# SETUP SSL UNTUK BACKEND API

## 📋 Ringkasan
- **Frontend Domain**: paskibmansabo.com (Hostinger)
- **Backend Domain**: api.paskibmansabo.com (VPS)
- **VPS IP**: 72.61.140.193
- **Backend Port**: 5005

---

## 🔧 STEP 1: Setup DNS untuk api.paskibmansabo.com

### Di Hostinger Domain Management:

1. **Login ke Hostinger**
   - Buka https://hpanel.hostinger.com
   - Pilih domain `paskibmansabo.com`

2. **Buka DNS Management**
   - Klik domain → DNS / Name Servers
   - Pilih "DNS Zone Editor" atau "Manage DNS"

3. **Tambah A Record untuk API subdomain**
   ```
   Type: A
   Name: api
   Points to: 72.61.140.193
   TTL: 3600 (atau Auto)
   ```

4. **Save/Update DNS**
   - Klik Save
   - DNS propagation: 5 menit - 24 jam (biasanya 5-30 menit)

5. **Verifikasi DNS**
   Tunggu beberapa menit, lalu test:
   ```bash
   # Di PowerShell
   nslookup api.paskibmansabo.com
   
   # Harusnya muncul:
   # Address: 72.61.140.193
   ```

   Atau buka: https://dnschecker.org
   - Masukkan: api.paskibmansabo.com
   - Cek apakah sudah resolve ke 72.61.140.193

---

## 🔐 STEP 2: Install SSL di VPS

### A. Upload Script ke VPS

**Dari PowerShell:**

```powershell
# Upload SSL setup script
scp C:\laragon\www\rajawali\rj-backend\setup-ssl.sh root@72.61.140.193:/root/
```

### B. Jalankan Script

```powershell
# SSH ke VPS
ssh root@72.61.140.193

# Masuk ke VPS, jalankan:
cd /root
chmod +x setup-ssl.sh
./setup-ssl.sh
```

**Script akan:**
1. ✅ Install Nginx
2. ✅ Install Certbot (Let's Encrypt)
3. ✅ Buat konfigurasi Nginx reverse proxy
4. ✅ Obtain SSL certificate untuk api.paskibmansabo.com
5. ✅ Setup auto-renewal
6. ✅ Konfigurasi CORS headers

### C. Jika DNS Belum Ready

Jika DNS belum propagate, script akan gagal. Tunggu DNS ready dulu:

```bash
# Test DNS dari VPS
nslookup api.paskibmansabo.com

# Harusnya resolve ke 72.61.140.193
```

---

## 🛠️ STEP 3: Manual Setup (Jika Script Gagal)

### 1. Install Nginx & Certbot

```bash
ssh root@72.61.140.193

# Update system
apt update
apt upgrade -y

# Install Nginx
apt install -y nginx

# Install Certbot
apt install -y certbot python3-certbot-nginx
```

### 2. Buat Nginx Config

```bash
nano /etc/nginx/sites-available/rajawali-api
```

Paste:

```nginx
server {
    listen 80;
    server_name api.paskibmansabo.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
    }

    location /uploads {
        alias /var/www/rajawali-backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
}
```

Save: `Ctrl+X`, `Y`, `Enter`

### 3. Enable Site

```bash
ln -s /etc/nginx/sites-available/rajawali-api /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 4. Obtain SSL Certificate

```bash
certbot --nginx -d api.paskibmansabo.com --agree-tos --email admin@paskibmansabo.com --redirect
```

Pilih `2` untuk redirect HTTP ke HTTPS

### 5. Open Firewall

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5005/tcp
ufw status
```

---

## ✅ STEP 4: Test SSL

### A. Test dari Browser

Buka: https://api.paskibmansabo.com

Harusnya muncul response dari API atau error page (tapi BUKAN "connection refused")

### B. Test API Endpoint

```bash
# Test health endpoint (jika ada)
curl https://api.paskibmansabo.com/api/health

# Test login endpoint
curl -X POST https://api.paskibmansabo.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### C. Cek SSL Certificate

Buka: https://www.ssllabs.com/ssltest/
- Masukkan: api.paskibmansabo.com
- Harusnya dapat rating A atau A+

---

## 🚀 STEP 5: Rebuild & Upload Frontend

### A. Rebuild dengan Domain Baru

```powershell
# Di local
cd C:\laragon\www\rajawali\rj-frontend

# File .env.production sudah diupdate dengan:
# VITE_API_URL=https://api.paskibmansabo.com/api
# VITE_UPLOADS_URL=https://api.paskibmansabo.com/uploads

# Build ulang
npm run build
```

### B. Upload ke Hostinger

1. Login ke Hostinger hPanel
2. File Manager → public_html
3. Upload semua file dari folder `dist/`
4. Pastikan struktur folder benar

### C. Test Website

1. Buka: https://paskibmansabo.com
2. Test login taruna
3. Cek console (F12) - harusnya TIDAK ada error SSL
4. Request harusnya ke: https://api.paskibmansabo.com/api/auth/login

---

## 🔍 Troubleshooting

### Error: DNS tidak resolve

```bash
# Cek DNS
nslookup api.paskibmansabo.com

# Flush DNS cache (Windows)
ipconfig /flushdns
```

### Error: Certificate validation failed

- Pastikan DNS sudah benar
- Port 80 dan 443 tidak terblokir firewall
- Jalankan ulang certbot

### Error: Mixed Content (browser block)

- Pastikan frontend menggunakan HTTPS URL di .env.production
- Rebuild frontend
- Clear browser cache

### Error: CORS

Tambahkan di backend server.js:

```javascript
app.use(cors({
  origin: ['https://paskibmansabo.com', 'https://www.paskibmansabo.com'],
  credentials: true
}));
```

### Cek Nginx Error Log

```bash
tail -f /var/log/nginx/error.log
```

### Cek SSL Certificate

```bash
certbot certificates
```

### Renew SSL Manual

```bash
certbot renew --dry-run
certbot renew
```

---

## 📝 Summary Checklist

- [ ] DNS A record untuk api.paskibmansabo.com → 72.61.140.193
- [ ] DNS sudah propagate (test dengan nslookup)
- [ ] Upload setup-ssl.sh ke VPS
- [ ] Jalankan setup-ssl.sh di VPS
- [ ] SSL certificate berhasil didapat
- [ ] Test https://api.paskibmansabo.com (browser)
- [ ] Update .env.production di frontend
- [ ] Rebuild frontend (npm run build)
- [ ] Upload dist/ ke Hostinger
- [ ] Test https://paskibmansabo.com
- [ ] Test login taruna - no SSL errors!

---

## 🎯 Expected Results

✅ Frontend: https://paskibmansabo.com (HTTPS)
✅ Backend: https://api.paskibmansabo.com (HTTPS)
✅ No Mixed Content errors
✅ SSL certificate valid
✅ Login taruna works!

---

## 📞 Quick Commands

```bash
# Check DNS
nslookup api.paskibmansabo.com

# SSH to VPS
ssh root@72.61.140.193

# Check Nginx status
systemctl status nginx

# Check PM2 apps
pm2 status

# Check SSL cert
certbot certificates

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Test API
curl https://api.paskibmansabo.com/api/health
```
