# Cleanup script for removing migration files
Write-Host "Cleaning up migration files..."

# List of migration files to remove
$migrations = @(
    "20250701_add_character_knowledge_states.sql",
    "20250702_add_story_structure_validator.sql",
    "20250703_add_timeline_chronology_enforcer.sql",
    "20250704_add_missing_columns.sql",
    "20250705_fix_round_function_and_analytics.sql",
    "20250706_fix_writing_goals_and_round.sql",
    "20250707_fix_round_and_add_weekly_goal.sql",
    "20250708_fix_round_numeric.sql",
    "20250709_completion_date_and_round.sql"
)

foreach ($migration in $migrations) {
    $path = Join-Path "migrations" $migration
    if (Test-Path $path) {
        Remove-Item $path
        Write-Host "Removed $migration"
    }
}

# Check if migrations directory is empty
$remainingFiles = Get-ChildItem "migrations" -File
if ($remainingFiles.Count -eq 0) {
    Remove-Item "migrations" -Force
    Write-Host "Removed empty migrations directory"
}

Write-Host "Cleanup complete!"
