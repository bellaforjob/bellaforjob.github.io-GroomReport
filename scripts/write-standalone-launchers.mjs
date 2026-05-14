import { chmodSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

function readLayoutVersion() {
  const p = join(root, 'src/config/layoutVersion.js')
  const txt = readFileSync(p, 'utf8')
  const m = txt.match(/export const TEMPLATE_LAYOUT_VERSION = (\d+)/)
  return m ? m[1] : '?'
}
const layoutVersion = readLayoutVersion()

const macLauncher = `#!/bin/bash
# GroomReport: local static server — wait until port listens before opening browser.
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT" || exit 1

if command -v python3 &>/dev/null; then
  PY=python3
elif command -v python &>/dev/null; then
  PY=python
else
  osascript -e 'display dialog "未找到 Python 3。请从 https://www.python.org 安装，或安装 Xcode 命令行工具。" buttons {"好"} default button 1 with icon stop' 2>/dev/null || echo "未找到 Python 3"
  exit 1
fi

port_is_free() {
  ! lsof -nP -iTCP:"$1" -sTCP:LISTEN &>/dev/null
}

pick_port() {
  local p
  for p in {8765..8804}; do
    if port_is_free "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

wait_listen() {
  local p="$1" i
  for ((i = 0; i < 120; i++)); do
    if nc -z 127.0.0.1 "$p" 2>/dev/null; then
      return 0
    fi
    if command -v curl &>/dev/null && curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:\${p}/"; then
      return 0
    fi
    sleep 0.125
  done
  return 1
}

PORT="$(pick_port)" || {
  osascript -e 'display dialog "端口 8765–8804 均被占用。请关闭占用端口的程序后重试。" buttons {"好"} default button 1 with icon stop' 2>/dev/null
  exit 1
}

# Serve current folder (dist). No --directory: compatible with older Python 3.
"$PY" -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!
cleanup() { kill "$SERVER_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

if ! wait_listen "$PORT"; then
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  osascript -e 'display dialog "本地网页服务未在预期时间内启动。请在本终端窗口查看 Python 报错（例如权限、防火墙）。" buttons {"好"} default button 1 with icon stop' 2>/dev/null
  exit 1
fi

open "http://127.0.0.1:$PORT/"
echo ""
echo "GroomReport: http://127.0.0.1:$PORT/"
echo "若浏览器仍无法打开，请手动复制上方地址到浏览器。"
echo "按 Ctrl+C 停止服务。"
wait "$SERVER_PID"
`

const winLauncher = `@echo off
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
`

const readme = `GroomReport 单机版（无需 Cursor / 无需 npm）— 布局 v${layoutVersion}

用法
----
1. macOS：双击「GroomReport.command」或「启动 GroomReport.command」，会在本机浏览器打开应用。
2. Windows：双击「GroomReport.bat」或「启动 GroomReport.bat」。

说明
----
• 本包构建时的布局版本为 v${layoutVersion}，须与页面角标「v${layoutVersion}」一致；若角标更旧，请用新 dist 替换本文件夹后重开。
• 通过本机临时网页服务（127.0.0.1）打开，这样 PDF/图片导出与 ES 模块才能正常工作；请勿只双击 index.html。
• 可将本文件夹整体复制到任意路径后再启动。
• 需要系统已安装 Python 3（macOS 通常自带 python3）。

若浏览器提示无法连接 / This site can't be reached
----
• 请先看「终端」窗口里是否有 Python 红色报错；脚本会自动避开已被占用的端口（8765–8804）。
• 可手动在浏览器地址栏输入终端里显示的 http://127.0.0.1:端口/ 再试。
• Windows：请双击「GroomReport.bat」或「启动 GroomReport.bat」，不要单独新开 cmd 再运行 python，否则工作目录不对会打不开页面。

构建
----
在项目根目录执行：npm run build:standalone
`

writeFileSync(join(dist, '启动 GroomReport.command'), macLauncher, 'utf8')
chmodSync(join(dist, '启动 GroomReport.command'), 0o755)
writeFileSync(join(dist, 'GroomReport.command'), macLauncher, 'utf8')
chmodSync(join(dist, 'GroomReport.command'), 0o755)
writeFileSync(join(dist, '启动 GroomReport.bat'), winLauncher, 'utf8')
writeFileSync(join(dist, 'GroomReport.bat'), winLauncher, 'utf8')
writeFileSync(join(dist, '使用说明.txt'), readme, 'utf8')
writeFileSync(join(dist, 'LAYOUT_VERSION.txt'), `${layoutVersion}\n`, 'utf8')

const indexHtml = join(dist, 'index.html')
if (existsSync(indexHtml)) {
  copyFileSync(indexHtml, join(dist, '404.html'))
}

console.info(
  `[standalone] Wrote GroomReport.command / 启动 GroomReport.command, .bat twins, LAYOUT_VERSION.txt (${layoutVersion}), 使用说明.txt → dist/` +
    (existsSync(indexHtml) ? ' + 404.html' : ''),
)
