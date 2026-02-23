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

REM Screen positions (assumes 1920x1080 per monitor)
SET SCREEN1_X=0
SET SCREEN1_Y=0
SET SCREEN2_X=1920
SET SCREEN2_Y=0
SET SCREEN_WIDTH=1920
SET SCREEN_HEIGHT=1080

REM === LAUNCH ===
echo Starting POS dual-screen mode...
echo Session ID: %SESSION_ID%
echo.
echo Screen 1 (Cashier): %URL_CASHIER%
echo Screen 2 (Customer): %URL_CUSTOMER%
echo.

REM Launch cashier on primary monitor (left)
start "" %CHROME% --kiosk --window-position=%SCREEN1_X%,%SCREEN1_Y% --window-size=%SCREEN_WIDTH%,%SCREEN_HEIGHT% --new-window %URL_CASHIER%

REM Wait a moment before launching second window
timeout /t 2 /nobreak >nul

REM Launch customer display on secondary monitor (right)
start "" %CHROME% --kiosk --window-position=%SCREEN2_X%,%SCREEN2_Y% --window-size=%SCREEN_WIDTH%,%SCREEN_HEIGHT% --new-window %URL_CUSTOMER%

echo.
echo Both screens launched!
echo Press any key to close this window (Chrome windows will stay open)
pause >nul
