@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Memasang dependensi...
  call npm install --no-fund --no-audit
)

netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo.
  echo MySQL belum menyala.
  echo Double-click MULAI.bat di C:\Users\ASUS\mysql-local lebih dulu.
  echo.
  pause
  exit /b 1
)

echo ================================================
echo  MAPAN API - http://127.0.0.1:4000/api
echo  Tutup jendela ini untuk menghentikan server.
echo ================================================
echo.
node src/server.js

pause
