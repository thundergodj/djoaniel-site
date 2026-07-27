@echo off
REM ====================================================================
REM  Preview djoaniel-site-v2 locally.  Double-click, or:  serve.bat 8080
REM
REM  The npx branch that used to be here was a recursion bug: "npx serve"
REM  resolved to THIS FILE (serve.bat sits on the local path and Windows
REM  PATHEXT includes .BAT) rather than the npm package, so the script
REM  invoked itself, passing "-l" in as the port. Never shell out to a
REM  bare command that shares a name with the script doing the shelling.
REM
REM  Now: the Python launcher if it exists, otherwise serve.ps1, which is
REM  a static server in plain PowerShell and needs no runtime at all.
REM  "python" is deliberately never tried - on this machine it resolves
REM  to the Microsoft Store stub, which prints an ad instead of serving.
REM ====================================================================
setlocal
cd /d "%~dp0"

set PORT=%1
if "%PORT%"=="" set PORT=8000

REM a port must be digits - stops a stray flag ever being read as one
echo %PORT%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
  echo.
  echo   "%PORT%" is not a port number.  Usage:  serve.bat [port]
  echo.
  exit /b 1
)

where py >nul 2>&1
if not errorlevel 1 (
  echo.
  echo   Serving on http://localhost:%PORT%/   [py]
  echo.
  py -3 -m http.server %PORT%
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%
