# ========================================
# POS Dual-Screen Launcher (PowerShell)
# ========================================
# Opens two Chrome windows in kiosk mode:
#   Screen 1 (Primary):   Cashier interface
#   Screen 2 (Secondary): Customer display
# ========================================
# Usage: Right-click -> Run with PowerShell
#   or:  powershell -ExecutionPolicy Bypass -File launch-pos-dual-screen.ps1
# ========================================

try {

# === CONFIGURATION ===
$SESSION_ID  = "kas1"
$BASE_URL    = "http://192.168.1.74:3000"

$URL_CASHIER  = "$BASE_URL/pos?sessie=$SESSION_ID"
$URL_CUSTOMER = "$BASE_URL/pos/client?sessie=$SESSION_ID"

# --- Locate Chrome ---
$CHROME = $null
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
foreach ($p in $chromePaths) {
    if (Test-Path $p) { $CHROME = $p; break }
}
if (-not $CHROME) {
    Write-Host "ERROR: Chrome not found in any default location." -ForegroundColor Red
    Write-Host "Searched:" -ForegroundColor Yellow
    foreach ($p in $chromePaths) { Write-Host "  $p" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "Chrome found: $CHROME" -ForegroundColor Green

# --- Detect screens ---
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " POS Dual-Screen Launcher"               -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Session : $SESSION_ID"                    -ForegroundColor Green
Write-Host "Screens : $($screens.Count)"              -ForegroundColor Yellow
Write-Host ""

if ($screens.Count -lt 2) {
    Write-Warning "Only 1 monitor detected! Both windows will open on the same screen."
    Write-Host "Connect a second monitor and re-run this script." -ForegroundColor Yellow
    Write-Host ""
    $screen1 = $screens[0]
    $screen2 = $screens[0]
} else {
    $screen1 = $screens | Where-Object { $_.Primary } | Select-Object -First 1
    $screen2 = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1

    $s1b = $screen1.Bounds
    $s2b = $screen2.Bounds
    Write-Host ("Screen 1 (Primary)  : {0}  {1},{2}  {3}x{4}" -f $screen1.DeviceName, $s1b.X, $s1b.Y, $s1b.Width, $s1b.Height) -ForegroundColor Green
    Write-Host ("Screen 2 (Secondary): {0}  {1},{2}  {3}x{4}" -f $screen2.DeviceName, $s2b.X, $s2b.Y, $s2b.Width, $s2b.Height) -ForegroundColor Green
    Write-Host ""
}

# --- Build positions ---
$s1 = $screen1.Bounds
$s2 = $screen2.Bounds

# --- Separate Chrome profiles so both windows can coexist ---
$cashierProfile  = Join-Path $env:TEMP "chrome-pos-cashier-$SESSION_ID"
$customerProfile = Join-Path $env:TEMP "chrome-pos-customer-$SESSION_ID"

# === LAUNCH CASHIER on Screen 1 ===
Write-Host "Launching Cashier on Screen 1..." -ForegroundColor Cyan

$cashierArgs = @(
    "--kiosk",
    "--new-window",
    "--noerrdialogs",
    "--disable-infobars",
    "--disable-session-crashed-bubble",
    "--disable-translate",
    "--no-first-run",
    "--disable-features=TranslateUI,PasswordManager",
    "--disable-save-password-bubble",
    "--password-store=basic",
    "--user-data-dir=`"$cashierProfile`"",
    "--window-position=$($s1.X),$($s1.Y)",
    "--window-size=$($s1.Width),$($s1.Height)",
    $URL_CASHIER
)

$cashierProc = Start-Process -FilePath $CHROME -ArgumentList $cashierArgs -PassThru
Write-Host "  Cashier PID: $($cashierProc.Id)" -ForegroundColor Green

# Give the first window time to grab its screen before launching the second
Start-Sleep -Seconds 4

# === LAUNCH CUSTOMER on Screen 2 ===
Write-Host "Launching Customer on Screen 2..." -ForegroundColor Cyan

$customerArgs = @(
    "--kiosk",
    "--new-window",
    "--noerrdialogs",
    "--disable-infobars",
    "--disable-session-crashed-bubble",
    "--disable-translate",
    "--no-first-run",
    "--disable-features=TranslateUI,PasswordManager",
    "--disable-save-password-bubble",
    "--password-store=basic",
    "--user-data-dir=`"$customerProfile`"",
    "--window-position=$($s2.X),$($s2.Y)",
    "--window-size=$($s2.Width),$($s2.Height)",
    $URL_CUSTOMER
)

$customerProc = Start-Process -FilePath $CHROME -ArgumentList $customerArgs -PassThru
Write-Host "  Customer PID: $($customerProc.Id)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Both screens launched!"                  -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close POS: Alt+F4 on each window, or end Chrome from Task Manager." -ForegroundColor Yellow

} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
}

Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
