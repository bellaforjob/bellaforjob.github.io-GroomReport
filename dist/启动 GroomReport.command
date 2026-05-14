#!/bin/bash
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
    if command -v curl &>/dev/null && curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:${p}/"; then
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
