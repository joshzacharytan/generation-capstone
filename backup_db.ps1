# PostgreSQL Database Backup Script
# Run this before any database schema changes

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = ".\backups"
$backupFile = "$backupDir\ecommerce_db_backup_$timestamp.sql"

# Create backups directory if it doesn't exist
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
    Write-Host "Created backups directory: $backupDir" -ForegroundColor Green
}

Write-Host "Creating database backup..." -ForegroundColor Yellow
Write-Host "Backup file: $backupFile" -ForegroundColor Cyan

# Create the backup
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -U postgres -d ecommerce_db > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database backup created successfully!" -ForegroundColor Green
    Write-Host "Backup location: $backupFile" -ForegroundColor Cyan
    
    # Show backup file size
    $fileSize = (Get-Item $backupFile).Length / 1KB
    Write-Host "Backup size: $([math]::Round($fileSize, 2)) KB" -ForegroundColor Gray
    
    # List recent backups
    Write-Host "`nRecent backups:" -ForegroundColor Yellow
    Get-ChildItem $backupDir -Filter "*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        Write-Host "  $($_.Name) - $($_.LastWriteTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Database backup failed!" -ForegroundColor Red
}