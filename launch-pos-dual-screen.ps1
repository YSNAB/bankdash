# ========================================
# POS Dual-Screen Launcher (PowerShell)
# ========================================
# Opens two Chrome windows in kiosk mode:
#   Screen 1: Cashier interface
#   Screen 2: Customer display
# ========================================

# === CONFIGURATION ===
# Set your session ID (unique per POS terminal)
$SESSION_ID = "kassa-1"

# Base URL (change localhost:3000 to your deployed URL)
$BASE_URL = "http://192.168.1.74:3000"

# Build full URLs with session ID
$URL_CASHIER = "$BASE_URL/pos/cashier?session=$SESSION_ID"
$URL_CUSTOMER = "$BASE_URL/pos/customer?session=$SESSION_ID"

# Chrome executable path
$CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Check if Chrome exists
if (-not (Test-Path $CHROME)) {
    Write-Host "Chrome not found at: $CHROME" -ForegroundColor Red
    Write-Host "Please update the CHROME variable in this script." -ForegroundColor Yellow
    pause
    exit 1
}

# Auto-detect screen positions
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "POS Dual-Screen Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Session ID: $SESSION_ID" -ForegroundColor Green
Write-Host "Detected screens: $($screens.Count)" -ForegroundColor Yellow
Write-Host ""

if ($screens.Count -lt 2) {
    Write-Warning "Only 1 monitor detected!"
    Write-Host "Both windows will open on the same screen." -ForegroundColor Yellow
    Write-Host "Please connect a second monitor and restart." -ForegroundColor Yellow
    Write-Host ""
    
    $screen1 = $screens[0]
    $screen2 = $screens[0]
} else {
    # Primary monitor (usually left/main)
    $screen1 = $screens | Where-Object { $_.Primary -eq $true } | Select-Object -First 1
    
    # Secondary monitor (first non-primary)
    $screen2 = $screens | Where-Object { $_.Primary -eq $false } | Select-Object -First 1
    
    Write-Host "✓ Screen 1 (Primary): $($screen1.DeviceName)" -ForegroundColor Green
    Write-Host "  Bounds: $($screen1.Bounds.X),$($screen1.Bounds.Y) | ${screen1.Bounds.Width}x${screen1.Bounds.Height}" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✓ Screen 2 (Secondary): $($screen2.DeviceName)" -ForegroundColor Green
    Write-Host "  Bounds: $($screen2.Bounds.X),$($screen2.Bounds.Y) | ${screen2.Bounds.Width}x${screen2.Bounds.Height}" -ForegroundColor Gray
    Write-Host ""
}

# Screen 1 (Cashier) position and size
$screen1_x = $screen1.Bounds.X
$screen1_y = $screen1.Bounds.Y
$screen1_width = $screen1.Bounds.Width
$screen1_height = $screen1.Bounds.Height

# Screen 2 (Customer) position and size
$screen2_x = $screen2.Bounds.X
$screen2_y = $screen2.Bounds.Y
$screen2_width = $screen2.Bounds.Width
$screen2_height = $screen2.Bounds.Height

# === LAUNCH ===
Write-Host "Launching cashier screen..." -ForegroundColor Cyan

# Kill existing Chrome kiosk instances (optional - uncomment to auto-restart)
# Get-Process chrome -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*pos*" } | Stop-Process -Force

# Create temporary Chrome user data directories (separate profiles = separate windows)
$tempDir = $env:TEMP
$cashierProfile = "$tempDir\chrome-pos-cashier-$SESSION_ID"
$customerProfile = "$tempDir\chrome-pos-customer-$SESSION_ID"

# Launch cashier on primary monitor
$cashier_args = @(
    "--kiosk"
    "--user-data-dir=$cashierProfile"
    "--window-position=$screen1_x,$screen1_y"
    "--window-size=$screen1_width,$screen1_height"
    "--new-window"
    "--noerrdialogs"
    "--disable-infobars"
    $URL_CASHIER
)

$cashierProcess = Start-Process -FilePath $CHROME -ArgumentList $cashier_args -PassThru
Write-Host "✓ Cashier launched (PID: $($cashierProcess.Id))" -ForegroundColor Green

# Wait for first window to fully load
Write-Host "Waiting 3 seconds before launching customer screen..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Launching customer screen..." -ForegroundColor Cyan

# Launch customer display on secondary monitor
$customer_args = @(
    "--kiosk"
    "--user-data-dir=$customerProfile"
    "--window-position=$screen2_x,$screen2_y"
    "--window-size=$screen2_width,$screen2_height"
    "--new-window"
    "--noerrdialogs"
    "--disable-infobars"
    $URL_CUSTOMER
)

$customerProcess = Start-Process -FilePath $CHROME -ArgumentList $customer_args -PassThru
Write-Host "✓ Customer display launched (PID: $($customerProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Both screens launched successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To close POS:" -ForegroundColor Yellow
Write-Host "  1. Press Alt+F4 on each Chrome window" -ForegroundColor Gray
Write-Host "  2. Or close from Task Manager" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this launcher window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
