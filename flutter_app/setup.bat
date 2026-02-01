@echo off
echo Tamil Nadu Election Commission - Flutter Setup
echo =============================================

echo.
echo 1. Checking Flutter installation...
flutter --version
if %errorlevel% neq 0 (
    echo ERROR: Flutter not found. Please install Flutter first.
    pause
    exit /b 1
)

echo.
echo 2. Getting dependencies...
flutter pub get
if %errorlevel% neq 0 (
    echo ERROR: Failed to get dependencies.
    pause
    exit /b 1
)

echo.
echo 3. Checking for voter CSV file...
if not exist "assets\data\voter_list_final.csv" (
    echo WARNING: voter_list_final.csv not found in assets\data\
    echo Please copy the CSV file to assets\data\ directory
)

echo.
echo 4. Setup complete!
echo.
echo Next steps:
echo - Copy voter_list_final.csv to assets\data\
echo - Update Supabase credentials in lib\services\supabase_service.dart
echo - Run: flutter run
echo.
pause