# POS Dual-Screen Launcher Scripts

Two Windows scripts to launch the POS system with dual monitors in fullscreen kiosk mode.

## Files

- **`launch-pos-dual-screen.bat`** — Simple batch file (fixed 1920x1080 screens)
- **`launch-pos-dual-screen.ps1`** — PowerShell script (auto-detects screen resolution & position)

## Usage

### Option 1: Batch File (Simple)

1. Edit `launch-pos-dual-screen.bat`
2. Update the URLs:
   ```batch
   SET URL_CASHIER=http://localhost:3000/pos/cashier
   SET URL_CUSTOMER=http://localhost:3000/pos/customer?session=xxx
   ```
3. Double-click to run

**Note:** Assumes 1920x1080 monitors. If your screens are different, adjust `SCREEN_WIDTH` and `SCREEN_HEIGHT`.

### Option 2: PowerShell (Auto-detect)

1. Edit `launch-pos-dual-screen.ps1`
2. Update the URLs:
   ```powershell
   $URL_CASHIER = "http://localhost:3000/pos/cashier"
   $URL_CUSTOMER = "http://localhost:3000/pos/customer?session=xxx"
   ```
3. Right-click → **Run with PowerShell**

**Recommended:** Use this version — it auto-detects screen positions and resolutions.

### First-time PowerShell Setup

If you get an execution policy error:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Then run the script again.

## How It Works

1. Opens Chrome in kiosk mode (no browser UI, fullscreen)
2. Positions cashier window on primary monitor
3. Positions customer display on secondary monitor
4. Both windows run independently

## Closing the POS

- **Close Chrome windows:** Alt+F4 on each window
- **Kill all Chrome:** Task Manager → End Chrome processes

## Customization

### Change Chrome Path

If Chrome is installed elsewhere, edit the `CHROME` variable:

**Batch:**
```batch
SET CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
```

**PowerShell:**
```powershell
$CHROME = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
```

### Session ID

Replace `demo-session` with a real session ID or make it dynamic:

**PowerShell (generate random session):**
```powershell
$sessionId = "pos-" + (Get-Date -Format "yyyyMMddHHmmss")
$URL_CUSTOMER = "http://localhost:3000/pos/customer?session=$sessionId"
```

### Add Startup

To auto-launch on Windows boot:

1. Press `Win+R`, type `shell:startup`, press Enter
2. Create a shortcut to the `.bat` or `.ps1` file
3. Restart to test

## Troubleshooting

**Chrome doesn't open:**
- Check Chrome installation path
- Try opening Chrome manually first

**Both windows on same screen:**
- Check if Windows recognizes both monitors (Display Settings)
- Use PowerShell version (auto-detects)
- Manually set screen positions in batch file

**Fullscreen not working:**
- Kiosk mode should override everything
- Check if another app is blocking fullscreen
- Try `F11` manually after launch

## License

Free to use for your POS system.
