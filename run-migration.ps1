# run-migration.ps1 - Script to run the latest migration

Write-Host "Running migration to fix ROUND function issue..."

# Import Node.js script to run the migration
node ./src/shared/run-migration.js "./migrations/20250710_fix_round_double_precision.sql"

Write-Host "Migration completed. Please restart your servers to apply the fixes."
