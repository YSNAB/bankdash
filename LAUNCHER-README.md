# POS Dual-Screen Launcher Scripts

Two Windows scripts to launch the POS system with dual monitors in fullscreen kiosk mode.

## 🚀 Quick Start

### Recommended: PowerShell Script (Auto-detect)

1. Edit `launch-pos-dual-screen.ps1`
2. Set your session ID and URL:
   ```powershell
   $SESSION_ID = "kassa-1"          # Unique ID per terminal
   $BASE_URL = "http://localhost:3000"  # Or your deployed URL
   ```
3. Right-click → **Run with PowerShell**

The script will:
- Auto-detect both monitors
- Show screen positions
- Launch cashier on primary screen
- Launch customer display on secondary screen

### Alternative: Batch File

1. Edit `launch-pos-dual-screen.bat`
2. Configure session ID, URL, and **screen positions**:
   ```batch
   SET SESSION_ID=kassa-1
   SET BASE_URL=http://localhost:3000
   
   REM Adjust these for your monitor setup:
   SET SCREEN2_X=1920  # X position of second monitor
   SET SCREEN2_Y=0     # Y position of second monitor
   ```
3. Double-click to run

## 🖥️ Finding Your Screen Positions

### Method 1: Windows Display Settings
1. Right-click Desktop → **Display Settings**
2. Look at monitor arrangement diagram
3. Identify positions:
   - **Side-by-side (horizontal):**
     - Secondary right of primary: `X=1920, Y=0` (for 1920px width)
     - Secondary left of primary: `X=-1920, Y=0`
   - **Stacked (vertical):**
     - Secondary below primary: `X=0, Y=1080` (for 1080px height)
     - Secondary above primary: `X=0, Y=-1080`

### Method 2: Use PowerShell Script
Run the PowerShell script once — it will show detected positions:
```
✓ Screen 1 (Primary): \\.\DISPLAY1
  Bounds: 0,0 | 1920x1080

✓ Screen 2 (Secondary): \\.\DISPLAY2
  Bounds: 1920,0 | 1920x1080
```

Use these values in the batch file if needed.

## 🔧 Key Improvements (Latest Version)

### ✅ Separate Chrome Profiles
Each screen uses its own Chrome user profile:
```
--user-data-dir=%TEMP%\chrome-pos-cashier-kassa-1
--user-data-dir=%TEMP%\chrome-pos-customer-kassa-1
```

**Why this matters:**
- Chrome treats them as completely separate windows
- Better window positioning control
- No profile conflicts

### ✅ PowerShell Auto-Detection
- Uses `System.Windows.Forms.Screen` API
- Detects actual monitor bounds
- No manual configuration needed
- Shows warnings if only 1 monitor detected

### ✅ Better Chrome Flags
```
--kiosk              # Fullscreen, no browser UI
--noerrdialogs       # Suppress error popups
--disable-infobars   # Hide info bars
--new-window         # Force new window
```

## 📝 Configuration Reference

### Session ID
```powershell
$SESSION_ID = "kassa-1"  # Unique per terminal
```

**Multi-terminal setup:**
- Terminal 1: `kassa-1`
- Terminal 2: `kassa-2`
- Terminal 3: `kassa-3`

Each session is isolated — BroadcastChannel only syncs within same session ID.

### Base URL

**Development (local):**
```powershell
$BASE_URL = "http://localhost:3000"
```

**Production (deployed):**
```powershell
$BASE_URL = "https://yourdomain.com"
```

### Chrome Path

**Default:**
```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

**If Chrome is elsewhere:**
```batch
SET CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
```

**Chromium/Edge:**
```powershell
$CHROME = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
```

## 🛠️ Troubleshooting

### Both windows open on same screen

**PowerShell script:**
- Check output — does it detect 2 screens?
- If only 1 detected: verify Windows recognizes both monitors (Display Settings)

**Batch script:**
- Adjust `SCREEN2_X` and `SCREEN2_Y` values
- Use values from Display Settings or PowerShell script output

### Windows open but not fullscreen

Chrome kiosk mode should force fullscreen. If not:
- Try pressing `F11` manually on each window
- Check if another app is blocking fullscreen (task bar always visible, etc.)

### Chrome doesn't open

1. Check Chrome path:
   ```powershell
   Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe"
   ```
2. Try opening Chrome manually first
3. Check if Chrome is already running — close all instances first

### "Execution Policy" error (PowerShell)

**Quick fix:**
```powershell
powershell -ExecutionPolicy Bypass -File .\launch-pos-dual-screen.ps1
```

**Permanent fix (as Administrator):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Screens swap/wrong positions

**PowerShell:** Should handle this automatically

**Batch:** Swap the X/Y values:
```batch
REM If customer screen appears on primary:
SET SCREEN1_X=1920  # Swap these
SET SCREEN2_X=0     # Swap these
```

## 🚀 Auto-Start on Windows Boot

### Method 1: Startup Folder
1. Press `Win+R`, type `shell:startup`, press Enter
2. Create shortcut to `.bat` or `.ps1` file
3. Restart Windows to test

### Method 2: Task Scheduler
1. Open **Task Scheduler**
2. Create Basic Task → **When computer starts**
3. Action: **Start a program**
4. Program: `powershell.exe`
5. Arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\path\to\launch-pos-dual-screen.ps1"`

## 📊 How It Works

### Architecture
```
┌─────────────────────┐         ┌─────────────────────┐
│   Screen 1          │         │   Screen 2          │
│   (Primary)         │         │   (Secondary)       │
│                     │         │                     │
│  ┌───────────────┐  │         │  ┌───────────────┐  │
│  │   Cashier     │  │         │  │   Customer    │  │
│  │   Interface   │◄─┼─────────┼─►│   Display     │  │
│  │               │  │  Sync   │  │               │  │
│  │ ?session=     │  │  via    │  │ ?session=     │  │
│  │   kassa-1     │  │Channel  │  │   kassa-1     │  │
│  └───────────────┘  │         │  └───────────────┘  │
└─────────────────────┘         └─────────────────────┘
         ▲                                ▲
         │         BroadcastChannel       │
         └────────────────────────────────┘
              (pos-kassa-1)
```

### Session Flow
1. Both URLs include `?session=kassa-1`
2. Each page connects to BroadcastChannel `pos-kassa-1`
3. Cashier updates cart → broadcasts via channel
4. Customer screen receives update → displays in real-time
5. No server-side sync needed (client-to-client)

## 🔒 Security Notes

- BroadcastChannel is **same-origin only** (secure)
- Session ID in URL is **not sensitive** (just a pairing key)
- No authentication needed for POS display screens
- For production: consider HTTPS for deployed URL

## 📚 Further Customization

### Add third screen (kitchen display, etc.)
Create another URL:
```powershell
$URL_KITCHEN = "$BASE_URL/pos/kitchen?session=$SESSION_ID"
```

Launch with:
```powershell
Start-Process -FilePath $CHROME -ArgumentList @(
    "--kiosk"
    "--user-data-dir=$tempDir\chrome-pos-kitchen-$SESSION_ID"
    "--window-position=$screen3_x,$screen3_y"
    $URL_KITCHEN
)
```

### Change screen resolution
Adjust in batch file:
```batch
SET SCREEN_WIDTH=1366
SET SCREEN_HEIGHT=768
```

PowerShell auto-detects this.

## 📄 License

Free to use for your POS system. No warranty provided.

## 🆘 Support

Issues with the launcher? Check:
1. Chrome is installed and path is correct
2. Both monitors are connected and recognized by Windows
3. URLs are accessible (test in browser first)
4. No firewall blocking localhost (if using local dev server)

For app-specific issues (cart sync, UI bugs), check the main bankdash repo.
