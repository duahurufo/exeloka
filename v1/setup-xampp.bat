@echo off
echo ====================================
echo EXELOKA v1 - XAMPP Setup Script
echo ====================================
echo.

echo 1. Checking XAMPP installation...
if exist "C:\xampp\xampp-control.exe" (
    echo    ✓ XAMPP found at C:\xampp\
) else (
    echo    ✗ XAMPP not found! Please install XAMPP first.
    echo    Download from: https://www.apachefriends.org/
    pause
    exit /b 1
)

echo.
echo 2. Creating project directory in XAMPP...
if not exist "C:\xampp\htdocs\exeloka" (
    mkdir "C:\xampp\htdocs\exeloka"
    echo    ✓ Created exeloka directory
) else (
    echo    ✓ Exeloka directory already exists
)

echo.
echo 3. Copying project files...
xcopy "%~dp0*" "C:\xampp\htdocs\exeloka\v1\" /E /I /Y /Q
if %errorlevel% equ 0 (
    echo    ✓ Project files copied successfully
) else (
    echo    ✗ Failed to copy project files
    pause
    exit /b 1
)

echo.
echo 4. Creating required directories...
mkdir "C:\xampp\htdocs\exeloka\v1\logs" 2>nul
mkdir "C:\xampp\htdocs\exeloka\v1\uploads" 2>nul
mkdir "C:\xampp\htdocs\exeloka\v1\temp" 2>nul
mkdir "C:\xampp\htdocs\exeloka\v1\cache" 2>nul
mkdir "C:\xampp\htdocs\exeloka\v1\backups" 2>nul
echo    ✓ Working directories created

echo.
echo 5. Starting XAMPP services...
start "" "C:\xampp\xampp-control.exe"
echo    ✓ XAMPP Control Panel launched

echo.
echo ====================================
echo SETUP COMPLETE!
echo ====================================
echo.
echo Next steps:
echo 1. In XAMPP Control Panel, start Apache and MySQL
echo 2. Open http://localhost/phpmyadmin
echo 3. Create database 'exeloka'
echo 4. Import database/schema.sql
echo 5. Access your site at: http://localhost/exeloka/v1/
echo.
echo Test accounts (password: test123):
echo - admin@sampang.id
echo - user@company.com
echo - cultural@expert.id
echo.
pause