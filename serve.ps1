# 启动大肥鱼个人站（本地）
$site = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8788
$py = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $py) { $py = "C:\Users\pc\.dsh\bili-duty\.venv\Scripts\python.exe" }
$running = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $running) {
  Start-Process -FilePath $py -ArgumentList @("-m", "http.server", "$port", "--directory", $site) -WindowStyle Hidden
  Start-Sleep 1
}
Start-Process "http://127.0.0.1:$port/"
