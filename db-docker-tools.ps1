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
    
    try {
        $container = docker ps -a --filter "name=$ContainerName" --format "{{.Names}} ({{.Status}})"
        
        if ($container) {
            Write-Host "Found container: $container" -ForegroundColor Green
            return $true
        } else {
            Write-Host "No container found with name: $ContainerName" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "Error checking container status: $_" -ForegroundColor Red
        return $false
    }
}

# Function to connect to PostgreSQL
function Connect-Database {
    Write-Host "Connecting to PostgreSQL in Docker container $ContainerName..." -ForegroundColor Cyan
    
    if (-not (Check-Status)) {
        Write-Host "Container not found or not running. Please check container status first." -ForegroundColor Red
        return
    }
    
    try {
        docker exec -it $ContainerName psql -U $Username -d $Database
    } catch {
        Write-Host "Error connecting to database: $_" -ForegroundColor Red
    }
}

# Function to run a migration file
function Run-Migration {
    if (-not $MigrationFile) {
        Write-Host "Error: Migration file not specified. Use -MigrationFile parameter." -ForegroundColor Red
        return
    }
    
    if (-not (Check-Status)) {
        Write-Host "Container not found or not running. Please check container status first." -ForegroundColor Red
        return
    }
    
    $migrationPath = Join-Path -Path (Get-Location) -ChildPath "migrations\$MigrationFile"
    
    if (-not (Test-Path $migrationPath)) {
        Write-Host "Error: Migration file not found: $migrationPath" -ForegroundColor Red
        return
    }
    
    Write-Host "Running migration: $MigrationFile..." -ForegroundColor Cyan
    
    try {
        # Copy migration file to container
        $tempPath = "/tmp/$MigrationFile"
        Get-Content $migrationPath | docker exec -i $ContainerName sh -c "cat > $tempPath"
        
        # Execute migration
        docker exec -i $ContainerName psql -U $Username -d $Database -f $tempPath
        
        # Clean up temp file
        docker exec $ContainerName rm $tempPath
        
        Write-Host "Migration completed." -ForegroundColor Green
    } catch {
        Write-Host "Error running migration: $_" -ForegroundColor Red
    }
}

# Function to list available migrations
function List-Migrations {
    $migrationsDir = Join-Path (Get-Location) "migrations"
    
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
    
    if (-not (Check-Status)) {
        Write-Host "Container not found or not running. Please check container status first." -ForegroundColor Red
        return
    }
    
    try {
        $result = docker exec $ContainerName psql -U $Username -d $Database -c "SELECT NOW() as current_time;"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Connection successful!" -ForegroundColor Green
        } else {
            Write-Host "Connection failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "Error testing connection: $_" -ForegroundColor Red
    }
}

# Function to backup the database
function Backup-Database {
    if (-not (Check-Status)) {
        Write-Host "Container not found or not running. Please check container status first." -ForegroundColor Red
        return
    }

    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_${Database}_${timestamp}.sql"
    $backupDir = Join-Path -Path (Get-Location) -ChildPath "backups"
    
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    
    $backupPath = Join-Path -Path $backupDir -ChildPath $backupFile
    Write-Host "Backing up database $Database to $backupPath..." -ForegroundColor Cyan
    
    try {
        docker exec $ContainerName pg_dump -U $Username -d $Database -f "/tmp/$backupFile"
        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump failed"
        }
        
        docker cp "$ContainerName:/tmp/$backupFile" $backupPath
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to copy backup file from container"
        }
        
        docker exec $ContainerName rm "/tmp/$backupFile"
        Write-Host "Backup completed: $backupPath" -ForegroundColor Green
    } catch {
        Write-Host "Error creating backup: $_" -ForegroundColor Red
    }
}

# Function to restore the database
function Restore-Database {
    if (-not (Check-Status)) {
        Write-Host "Container not found or not running. Please check container status first." -ForegroundColor Red
        return
    }

    $backupDir = Join-Path -Path (Get-Location) -ChildPath "backups"
    if (-not (Test-Path $backupDir)) {
        Write-Host "Backup directory not found: $backupDir" -ForegroundColor Red
        return
    }
    
    $backupFiles = Get-ChildItem -Path $backupDir -Filter "backup_$($Database)_*.sql" | Sort-Object LastWriteTime -Descending
    
    if ($backupFiles.Count -eq 0) {
        Write-Host "No backup files found in $backupDir." -ForegroundColor Red
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
    
    if (-not ($selection -match '^\d+$')) {
        Write-Host "Invalid selection. Please enter a number." -ForegroundColor Red
        return
    }
    
    $selectedIndex = [int]$selection
    if ($selectedIndex -ge 0 -and $selectedIndex -lt $backupFiles.Count) {
        $backupFile = $backupFiles[$selectedIndex].Name
        $backupPath = Join-Path -Path $backupDir -ChildPath $backupFile
        
        Write-Host "Restoring database $Database from $backupFile..." -ForegroundColor Cyan
        
        try {
            docker cp $backupPath "$ContainerName:/tmp/$backupFile"
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to copy backup file to container"
            }

            # Create SQL commands with proper variable escaping
            $terminateCmd = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${Database}' AND pid <> pg_backend_pid();"
            $dropCmd = "DROP DATABASE IF EXISTS ""${Database}"";"
            $createCmd = "CREATE DATABASE ""${Database}"" WITH OWNER = ""${Username}"";"

            # Execute each command separately
            docker exec $ContainerName psql -U $Username -d postgres -c $terminateCmd
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to terminate database connections"
            }

            docker exec $ContainerName psql -U $Username -d postgres -c $dropCmd
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to drop database"
            }

            docker exec $ContainerName psql -U $Username -d postgres -c $createCmd
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to create database"
            }

            docker exec $ContainerName psql -U $Username -d $Database -f "/tmp/$backupFile"
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to restore database from backup file"
            }

            docker exec $ContainerName rm "/tmp/$backupFile"
            Write-Host "Restore completed." -ForegroundColor Green
        } catch {
            Write-Host "Error restoring database: $_" -ForegroundColor Red
        }
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
