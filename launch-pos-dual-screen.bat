@echo off
REM ========================================
REM POS Dual-Screen Launcher (Windows 10)
REM ========================================
REM This .bat file simply launches the PowerShell script
REM with the correct execution policy so it doesn't get blocked.
REM Double-click THIS file to start the POS.
REM ========================================

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch-pos-dual-screen.ps1"
