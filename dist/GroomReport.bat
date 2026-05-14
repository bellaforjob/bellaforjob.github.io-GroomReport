@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765

where py >nul 2>nul
if not errorlevel 1 (
  start "GroomReport" /D "%cd%" cmd /k "py -3 -m http.server %PORT% --bind 127.0.0.1"
  goto :started
)
where python >nul 2>nul
if not errorlevel 1 (
  start "GroomReport" /D "%cd%" cmd /k "python -m http.server %PORT% --bind 127.0.0.1"
  goto :started
)
echo 未找到 Python。请安装 Python 3 并勾选 Add to PATH。
pause
exit /b 1

:started
timeout /t 3 /nobreak >nul
start http://127.0.0.1:%PORT%/
echo 若仍无法打开，请在浏览器手动访问: http://127.0.0.1:%PORT%/
echo 关闭标题为 GroomReport 的窗口可停止服务。
pause
