@echo off
title MySQL MAPAN - biarkan jendela ini terbuka saat coding
if not exist "C:\Users\ASUS\mysql-mapan\data" (
  echo [GAGAL] Folder data MySQL tidak ditemukan di C:\Users\ASUS\mysql-mapan\data
  pause
  exit /b 1
)
"C:\Users\ASUS\mysql-mapan\mysql-8.4.3-winx64\bin\mysqld.exe" --datadir="C:\Users\ASUS\mysql-mapan\data" --port=3306 --bind-address=0.0.0.0 --console
pause
