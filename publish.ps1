# 发布大肥鱼网站到 GitHub Pages
$ErrorActionPreference = 'Stop'
$site = Split-Path -Parent $MyInvocation.MyCommand.Path
$tokenFile = "C:\Users\pc\.dsh\bili-duty\fish\secrets\github_token.txt"
if (-not (Test-Path $tokenFile)) {
  Write-Host "找不到 GitHub token：$tokenFile"
  Read-Host "按回车关闭"
  exit 1
}
$env:GH_TOKEN = (Get-Content $tokenFile -Raw -Encoding UTF8).Trim()
$py = "C:\Users\pc\AppData\Local\Microsoft\WindowsApps\python.exe"
if (-not (Test-Path $py)) { $py = "python" }
& $py (Join-Path $site "publish.py")
if ($LASTEXITCODE -ne 0) {
  Read-Host "发布失败，按回车关闭"
  exit $LASTEXITCODE
}
Start-Process "https://johny0717.github.io/dafiyu-site/"
Start-Sleep 2
