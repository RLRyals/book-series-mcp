// src/shared/run-migration.js - Utility to run a specific migration file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get migration file from command line argument
const migrationFile = process.argv[2];

// Export the runMigration function for use in test scripts
export async function runMigration(migrationPath) {
    const db = new DatabaseManager();
    
    try {
        console.error(`Running migration: ${path.basename(migrationPath)}`);
        
        // Read the migration SQL if a path is provided
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration within a transaction
        await db.transaction(async (client) => {
            await client.query(migrationSQL);
            console.error('Migration completed successfully');
            
            // Record the migration in the migrations table
            // First check if the migrations table exists
            const tableCheckResult = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'migrations'
                );
            `);
            
            const tableExists = tableCheckResult.rows[0].exists;
            
            if (!tableExists) {
                // Create migrations table if it doesn't exist
                await client.query(`
                    CREATE TABLE migrations (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                `);
            }
            
            // Record this migration
            await client.query(
                'INSERT INTO migrations (name) VALUES ($1)',
                [path.basename(migrationPath)]
            );
        });
        
        return true;
    } catch (error) {
        console.error('Error running migration:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run migration if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
    if (!migrationFile) {
        console.error('Please provide a migration file name');
        process.exit(1);
    }

    const migrationPathFromCLI = path.resolve(__dirname, '../../migrations', migrationFile);

    // Check if the file exists
    if (!fs.existsSync(migrationPathFromCLI)) {
        console.error(`Migration file not found: ${migrationPathFromCLI}`);
        process.exit(1);
    }
    
    runMigration(migrationPathFromCLI)
        .then(() => console.error('Migration completed successfully'))
        .catch(err => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}
