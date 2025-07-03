# db-docker-tools.ps1
# PowerShell script for managing Docker PostgreSQL database

param (
    [Parameter()]
    [string]$Command = "help",
    
    [Parameter()]
    [string]$MigrationFile = "",
    
    [Parameter()]
    [string]$ContainerName = "book-series-postgres",
    
    [Parameter()]
    [string]$Username = "writer",
    
    [Parameter()]
    [string]$Database = "book_series"
)

# Function to display help
function Show-Help {
    Write-Host "DB Docker Tools - Manage PostgreSQL in Docker" -ForegroundColor Cyan
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Usage: .\db-docker-tools.ps1 -Command <command> [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  status              - Check the status of the PostgreSQL container"
    Write-Host "  connect             - Connect to PostgreSQL with psql"
    Write-Host "  run-migration       - Run a specific migration file"
    Write-Host "  list-migrations     - List available migration files"
    Write-Host "  test-connection     - Test database connection"
    Write-Host "  backup              - Backup the database"
    Write-Host "  restore             - Restore the database from backup"
    Write-Host "  help                - Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -MigrationFile      - Path to migration file (for run-migration)"
    Write-Host "  -ContainerName      - Docker container name (default: book-series-postgres)"
    Write-Host "  -Username           - PostgreSQL username (default: writer)"
    Write-Host "  -Database           - PostgreSQL database (default: book_series)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\db-docker-tools.ps1 -Command status"
    Write-Host "  .\db-docker-tools.ps1 -Command run-migration -MigrationFile 20250701_add_character_knowledge_states.sql"
    Write-Host "  .\db-docker-tools.ps1 -Command connect"
}

# Function to check container status
function Check-Status {
    Write-Host "Checking PostgreSQL container status..." -ForegroundColor Cyan
    
    $container = docker ps -a --filter "name=$ContainerName" --format "{{.Names}} ({{.Status}})"
    
    if ($container) {
        Write-Host "Found container: $container" -ForegroundColor Green
    } else {
        Write-Host "No container found with name: $ContainerName" -ForegroundColor Red
    }
}

# Function to connect to PostgreSQL
function Connect-Database {
    Write-Host "Connecting to PostgreSQL in Docker container $ContainerName..." -ForegroundColor Cyan
    
    docker exec -it $ContainerName psql -U $Username -d $Database
}

# Function to run a migration file
function Run-Migration {
    if (-not $MigrationFile) {
        Write-Host "Error: Migration file not specified. Use -MigrationFile parameter." -ForegroundColor Red
        return
    }
    
    $migrationPath = Join-Path -Path (Get-Location) -ChildPath "migrations\$MigrationFile"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "Error: Migration file not found: $migrationPath" -ForegroundColor Red
        return
    }
    
    Write-Host "Running migration: $MigrationFile..." -ForegroundColor Cyan
    
    # Copy migration file to container
    $tempPath = "/tmp/$MigrationFile"
    Get-Content $migrationPath | docker exec -i $ContainerName sh -c "cat > $tempPath"
    
    # Execute migration
    docker exec -i $ContainerName psql -U $Username -d $Database -f $tempPath
    
    # Clean up temp file
    docker exec $ContainerName rm $tempPath
    
    Write-Host "Migration completed." -ForegroundColor Green
}

# Function to list available migrations
function List-Migrations {
    $migrationsDir = Join-Path -Path (Get-Location) -ChildPath "migrations"
    
    if (-not (Test-Path $migrationsDir)) {
        Write-Host "Error: Migrations directory not found: $migrationsDir" -ForegroundColor Red
        return
    }
    
    Write-Host "Available migration files:" -ForegroundColor Cyan
    
    $files = Get-ChildItem -Path $migrationsDir -Filter "*.sql" | Sort-Object Name
    
    foreach ($file in $files) {
        $firstLine = Get-Content $file.FullName -TotalCount 1
        Write-Host "- $($file.Name)" -ForegroundColor Yellow
        if ($firstLine -match "^--\s*(.+)$") {
            Write-Host "  $($matches[1])" -ForegroundColor Gray
        }
    }
}

# Function to test database connection
function Test-DbConnection {
    Write-Host "Testing connection to PostgreSQL in Docker container $ContainerName..." -ForegroundColor Cyan
    
    $result = docker exec $ContainerName psql -U $Username -d $Database -c "SELECT NOW() as current_time;"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Connection successful!" -ForegroundColor Green
    } else {
        Write-Host "Connection failed!" -ForegroundColor Red
    }
}

# Function to backup the database
function Backup-Database {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_${Database}_${timestamp}.sql"
    
    Write-Host "Backing up database $Database to $backupFile..." -ForegroundColor Cyan
    
    docker exec $ContainerName pg_dump -U $Username -d $Database -f "/tmp/$backupFile"
    docker cp "$ContainerName:/tmp/$backupFile" "./$backupFile"
    docker exec $ContainerName rm "/tmp/$backupFile"
    
    Write-Host "Backup completed: $backupFile" -ForegroundColor Green
}

# Function to restore the database
function Restore-Database {
    $backupFiles = Get-ChildItem -Path (Get-Location) -Filter "backup_${Database}_*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backupFiles.Count -eq 0) {
        Write-Host "No backup files found." -ForegroundColor Red
        return
    }
    
    Write-Host "Available backup files:" -ForegroundColor Cyan
    for ($i = 0; $i -lt [Math]::Min(5, $backupFiles.Count); $i++) {
        Write-Host "[$i] $($backupFiles[$i].Name) ($(Get-Date $backupFiles[$i].LastWriteTime -Format 'yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Yellow
    }
    
    $selection = Read-Host "Enter the number of the backup to restore (or 'q' to quit)"
    
    if ($selection -eq 'q') {
        return
    }
    
    $selectedIndex = [int]$selection
    if ($selectedIndex -ge 0 -and $selectedIndex -lt $backupFiles.Count) {
        $backupFile = $backupFiles[$selectedIndex].Name
        
        Write-Host "Restoring database $Database from $backupFile..." -ForegroundColor Cyan
        
        docker cp "./$backupFile" "$ContainerName:/tmp/$backupFile"
        docker exec $ContainerName psql -U $Username -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$Database' AND pid <> pg_backend_pid();"
        docker exec $ContainerName psql -U $Username -d postgres -c "DROP DATABASE IF EXISTS ${Database};"
        docker exec $ContainerName psql -U $Username -d postgres -c "CREATE DATABASE ${Database} WITH OWNER = $Username;"
        docker exec $ContainerName psql -U $Username -d $Database -f "/tmp/$backupFile"
        docker exec $ContainerName rm "/tmp/$backupFile"
        
        Write-Host "Restore completed." -ForegroundColor Green
    } else {
        Write-Host "Invalid selection." -ForegroundColor Red
    }
}

# Main execution
switch ($Command.ToLower()) {
    "status" { Check-Status }
    "connect" { Connect-Database }
    "run-migration" { Run-Migration }
    "list-migrations" { List-Migrations }
    "test-connection" { Test-DbConnection }
    "backup" { Backup-Database }
    "restore" { Restore-Database }
    default { Show-Help }
}
