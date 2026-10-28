# RetailFlow AI — Run Next.js Frontend Dev Server
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting RetailFlow AI Next.js Frontend " -ForegroundColor Cyan
Write-Host " Listening on http://localhost:3000      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\frontend"
npm run dev
