@echo off
"C:\Users\ASUS\mysql-mapan\mysql-8.4.3-winx64\bin\mysqladmin.exe" -h 127.0.0.1 -u root shutdown
if errorlevel 1 (echo MySQL tidak jalan atau gagal dimatikan.) else (echo MySQL dimatikan dengan aman.)
pause
