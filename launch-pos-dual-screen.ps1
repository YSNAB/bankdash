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
$BASE_URL = "http://localhost:3000"

# Build full URLs with session ID
$URL_CASHIER = "$BASE_URL/pos/cashier?session=$SESSION_ID"
$URL_CUSTOMER = "$BASE_URL/pos/customer?session=$SESSION_ID"

# Chrome executable path
$CHROME = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Auto-detect screen positions
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens

if ($screens.Count -lt 2) {
    Write-Warning "Only 1 monitor detected. Both windows will open on the same screen."
    $screen1 = $screens[0]
    $screen2 = $screens[0]
} else {
    # Primary monitor (usually left)
    $screen1 = $screens | Where-Object { $_.Primary -eq $true } | Select-Object -First 1
    
    # Secondary monitor (first non-primary)
    $screen2 = $screens | Where-Object { $_.Primary -eq $false } | Select-Object -First 1
}

# Screen 1 (Cashier) position
$screen1_x = $screen1.Bounds.X
$screen1_y = $screen1.Bounds.Y
$screen1_width = $screen1.Bounds.Width
$screen1_height = $screen1.Bounds.Height

# Screen 2 (Customer) position
$screen2_x = $screen2.Bounds.X
$screen2_y = $screen2.Bounds.Y
$screen2_width = $screen2.Bounds.Width
$screen2_height = $screen2.Bounds.Height

# === LAUNCH ===
Write-Host "Starting POS dual-screen mode..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Screen 1 (Cashier): $URL_CASHIER" -ForegroundColor Green
Write-Host "  Position: $screen1_x,$screen1_y | Size: ${screen1_width}x${screen1_height}"
Write-Host ""
Write-Host "Screen 2 (Customer): $URL_CUSTOMER" -ForegroundColor Yellow
Write-Host "  Position: $screen2_x,$screen2_y | Size: ${screen2_width}x${screen2_height}"
Write-Host ""

# Launch cashier on primary monitor
$cashier_args = @(
    "--kiosk"
    "--window-position=$screen1_x,$screen1_y"
    "--window-size=$screen1_width,$screen1_height"
    "--new-window"
    $URL_CASHIER
)
Start-Process -FilePath $CHROME -ArgumentList $cashier_args

# Wait before launching second window
Start-Sleep -Seconds 2

# Launch customer display on secondary monitor
$customer_args = @(
    "--kiosk"
    "--window-position=$screen2_x,$screen2_y"
    "--window-size=$screen2_width,$screen2_height"
    "--new-window"
    $URL_CUSTOMER
)
Start-Process -FilePath $CHROME -ArgumentList $customer_args

Write-Host ""
Write-Host "Both screens launched!" -ForegroundColor Green
Write-Host "To close: Press Ctrl+C or close this window (Chrome windows will stay open)"
Write-Host ""
