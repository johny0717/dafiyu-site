# 刷新鱼塘数据并发布
$ErrorActionPreference = 'Stop'
$site = Split-Path -Parent $MyInvocation.MyCommand.Path
$venv = "C:\Users\pc\.dsh\bili-duty\.venv\Scripts\python.exe"
& $venv (Join-Path $site "build_data.py")
if ($LASTEXITCODE -ne 0) { Read-Host "生成数据失败，按回车关闭"; exit 1 }
Copy-Item "C:\Users\pc\.dsh\bili-duty\fish\tmp\dafiyu-data.json" (Join-Path $site "data.json") -Force
& (Join-Path $site "publish.ps1")
