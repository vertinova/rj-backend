# Script PowerShell untuk deploy backend ke VPS
# Jalankan dari PowerShell atau Git Bash

Write-Host "🚀 Deploying Rajawali Backend to VPS..." -ForegroundColor Cyan

# Configuration
$VPS_IP = "72.61.140.193"
$VPS_USER = "root"  # Ganti dengan username VPS Anda jika berbeda
$VPS_PATH = "/var/www/rajawali-backend"
$APP_NAME = "rajawali-api"

# Cek apakah rsync tersedia (butuh Git Bash atau WSL)
$rsyncPath = Get-Command rsync -ErrorAction SilentlyContinue
if (-not $rsyncPath) {
    Write-Host "❌ rsync tidak ditemukan!" -ForegroundColor Red
    Write-Host "Silakan install Git untuk Windows (https://git-scm.com/download/win)" -ForegroundColor Yellow
    Write-Host "atau gunakan WSL untuk menjalankan script ini." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📦 Step 1: Membersihkan node_modules lokal..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ node_modules dihapus" -ForegroundColor Green
}

Write-Host "`n📤 Step 2: Upload files ke VPS..." -ForegroundColor Yellow
Write-Host "Server: ${VPS_USER}@${VPS_IP}" -ForegroundColor Cyan

$rsyncCommand = @"
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs/*.log' \
  --exclude 'uploads/*' \
  --exclude '.env.local' \
  ./ ${VPS_USER}@${VPS_IP}:${VPS_PATH}/
"@

bash -c $rsyncCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files berhasil di-upload" -ForegroundColor Green
} else {
    Write-Host "❌ Upload gagal!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔄 Step 3: Install dependencies dan restart aplikasi..." -ForegroundColor Yellow

$sshCommands = @"
cd /var/www/rajawali-backend && \
echo '📦 Installing dependencies...' && \
npm install --production && \
echo '🔄 Restarting PM2 application...' && \
pm2 restart rajawali-api || pm2 start src/server.js --name rajawali-api && \
pm2 save && \
echo '' && \
echo '✅ Backend berhasil di-restart!' && \
echo '' && \
echo '📊 Status aplikasi:' && \
pm2 status rajawali-api
"@

ssh "${VPS_USER}@${VPS_IP}" $sshCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ Deployment selesai!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`n📋 Perintah berguna:" -ForegroundColor Yellow
    Write-Host "Lihat logs   : ssh ${VPS_USER}@${VPS_IP} 'pm2 logs rajawali-api'" -ForegroundColor Cyan
    Write-Host "Lihat status : ssh ${VPS_USER}@${VPS_IP} 'pm2 status'" -ForegroundColor Cyan
    Write-Host "Restart app  : ssh ${VPS_USER}@${VPS_IP} 'pm2 restart rajawali-api'" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment gagal!" -ForegroundColor Red
    exit 1
}
