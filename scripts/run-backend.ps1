# RetailFlow AI — Run Backend with Maven Wrapper and H2 in-memory or PostgreSQL
param (
    [string]$Profile = "h2"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting RetailFlow AI Spring Boot API " -ForegroundColor Cyan
Write-Host " Profile: $Profile                      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\..\backend"

if ($Profile -eq "h2") {
    .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"
} else {
    .\mvnw.cmd spring-boot:run
}
