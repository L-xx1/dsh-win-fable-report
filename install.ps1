<#
  dsh-win-fable-report — install.ps1
  将 win-fable-report agent preset 安装到本机 DeepSeek Harness 用户 preset 根目录。

  用法：
    powershell -ExecutionPolicy Bypass -File .\install.ps1          # 目标已存在时报错，不覆盖
    powershell -ExecutionPolicy Bypass -File .\install.ps1 -Force   # 覆盖已安装的 win-fable-report

  安装后请完全重启 dsh，新建空白会话，选择「Fable级且及时总结模式」。
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$PresetId = 'win-fable-report'
$Source = Join-Path $PSScriptRoot 'win-fable-report'
$CompositionFile = Join-Path $Source 'agent.cordis.yml'
$PlaybookFile = Join-Path $Source 'win-tool-playbook.mjs'

if (-not (Test-Path -LiteralPath $CompositionFile -PathType Leaf)) {
    throw "找不到预设组装文件：$CompositionFile 请在与 install.ps1 同目录的发布包中运行。"
}
if (-not (Test-Path -LiteralPath $PlaybookFile -PathType Leaf)) {
    throw "找不到 playbook 插件：$PlaybookFile 发布包不完整。"
}

$DshHome = if ($env:DSH_HOME -and $env:DSH_HOME.Trim().Length -gt 0) {
    $env:DSH_HOME
} else {
    Join-Path $env:USERPROFILE '.dsh'
}
$PresetRoot = Join-Path $DshHome '.agent-presets'
$Destination = Join-Path $PresetRoot $PresetId

if (Test-Path -LiteralPath $Destination) {
    if ($Force) {
        Write-Warning "已存在目标预设，按 -Force 覆盖：$Destination"
        Remove-Item -LiteralPath $Destination -Recurse -Force
    } else {
        throw "目标预设已存在：$Destination 如需覆盖请加 -Force。"
    }
}

New-Item -ItemType Directory -Force -Path $PresetRoot | Out-Null
Copy-Item -Recurse -LiteralPath $Source -Destination $Destination

$BashPath = 'C:\Program Files\Git\bin\bash.exe'
if (-not (Test-Path -LiteralPath $BashPath -PathType Leaf)) {
    Write-Warning "未找到预设指定的 Git Bash：$BashPath"
    Write-Warning "请安装 Git for Windows，或编辑 agent.cordis.yml 中 custom-bash 的 bashPath。"
}

Write-Host ''
Write-Host '已安装 Fable级且及时总结模式：' -ForegroundColor Green
Write-Host "  preset id : $PresetId"
Write-Host "  安装位置 : $Destination"
Write-Host ''
Write-Host '下一步：'
Write-Host '  1. 完全重启 DeepSeek Harness；'
Write-Host '  2. 新建一个空白会话；'
Write-Host '  3. 在 preset 选择器中选择「Fable级且及时总结模式」。'
Write-Host '  4. 不要在已有内容的会话上切换 preset。'
Write-Host ''
