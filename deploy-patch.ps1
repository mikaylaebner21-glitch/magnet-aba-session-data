# Run this from ANYWHERE - it will find your repo and patch it
# Usage: Right-click this file > Run with PowerShell

$repoPath = "$env:USERPROFILE\Downloads\magnet-aba-session-app (3)"

# Check folder exists
if (-not (Test-Path $repoPath)) {
    Write-Host "ERROR: Could not find repo at: $repoPath" -ForegroundColor Red
    Write-Host "Check the folder name in your Downloads and update this script" -ForegroundColor Yellow
    pause
    exit
}

# Unzip patch into repo
$patchZip = "$env:USERPROFILE\Downloads\magnet-aba-patch.zip"
if (-not (Test-Path $patchZip)) {
    Write-Host "ERROR: magnet-aba-patch.zip not found in Downloads" -ForegroundColor Red
    pause
    exit
}

Write-Host "Extracting patch files..." -ForegroundColor Cyan
Expand-Archive -Path $patchZip -DestinationPath $repoPath -Force

# Git push
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
Set-Location $repoPath
git add .
git commit -m "patch: scroll fix + red validation"
git push

Write-Host "Done! Vercel will redeploy automatically." -ForegroundColor Green
pause
