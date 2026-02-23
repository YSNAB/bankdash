@echo off
REM ========================================
REM POS Dual-Screen Launcher (Windows)
REM ========================================
REM Opens two Chrome windows in kiosk mode:
REM   Screen 1: Cashier interface
REM   Screen 2: Customer display
REM ========================================

REM === CONFIGURATION ===
REM Set your session ID (unique per POS terminal)
SET SESSION_ID=kassa-1

REM Base URL (change localhost:3000 to your deployed URL)
SET BASE_URL=http://localhost:3000

REM Build full URLs with session ID
SET URL_CASHIER=%BASE_URL%/pos/cashier?session=%SESSION_ID%
SET URL_CUSTOMER=%BASE_URL%/pos/customer?session=%SESSION_ID%

REM Chrome executable path (adjust if needed)
SET CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"

REM Screen positions - ADJUST THESE FOR YOUR SETUP
REM Example for two 1920x1080 monitors side-by-side:
REM   Primary (left):   X=0,    Y=0
REM   Secondary (right): X=1920, Y=0
REM
REM To find your screen positions:
REM 1. Right-click Desktop > Display Settings
REM 2. Note monitor arrangement
REM 3. If secondary is RIGHT of primary: X = primary width (usually 1920)
REM 4. If secondary is LEFT of primary: X = -1920 (negative!)
REM 5. If secondary is ABOVE/BELOW: adjust Y instead

SET SCREEN1_X=0
SET SCREEN1_Y=0
SET SCREEN2_X=1920
SET SCREEN2_Y=0
SET SCREEN_WIDTH=1920
SET SCREEN_HEIGHT=1080

REM Temp directories for separate Chrome profiles
SET TEMP_DIR=%TEMP%
SET CASHIER_PROFILE=%TEMP_DIR%\chrome-pos-cashier-%SESSION_ID%
SET CUSTOMER_PROFILE=%TEMP_DIR%\chrome-pos-customer-%SESSION_ID%

REM === LAUNCH ===
echo ========================================
echo POS Dual-Screen Launcher
echo ========================================
echo.
echo Session ID: %SESSION_ID%
echo.
echo Screen 1 (Cashier): %URL_CASHIER%
echo   Position: %SCREEN1_X%,%SCREEN1_Y%
echo.
echo Screen 2 (Customer): %URL_CUSTOMER%
echo   Position: %SCREEN2_X%,%SCREEN2_Y%
echo.
echo ========================================
echo.

REM Launch cashier on primary monitor (left)
echo Launching cashier screen...
start "" %CHROME% --kiosk --user-data-dir="%CASHIER_PROFILE%" --window-position=%SCREEN1_X%,%SCREEN1_Y% --window-size=%SCREEN_WIDTH%,%SCREEN_HEIGHT% --new-window --noerrdialogs --disable-infobars %URL_CASHIER%

REM Wait before launching second window
echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

REM Launch customer display on secondary monitor (right)
echo Launching customer screen...
start "" %CHROME% --kiosk --user-data-dir="%CUSTOMER_PROFILE%" --window-position=%SCREEN2_X%,%SCREEN2_Y% --window-size=%SCREEN_WIDTH%,%SCREEN_HEIGHT% --new-window --noerrdialogs --disable-infobars %URL_CUSTOMER%

echo.
echo ========================================
echo Both screens launched!
echo ========================================
echo.
echo To close POS:
echo   1. Press Alt+F4 on each Chrome window
echo   2. Or close from Task Manager
echo.
echo Press any key to close this launcher...
pause >nul
