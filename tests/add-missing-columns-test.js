// Test script for running the migration to add missing columns
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from '../src/shared/database.js';
import { runMigration } from '../src/shared/run-migration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMissingColumnsMigration() {
    console.error('Testing migration for adding missing columns to world_building_elements and locations tables');
    
    const db = new DatabaseManager();
    
    try {
        // Run the migration
        const migrationPath = path.resolve(__dirname, '../migrations/20250704_add_missing_columns.sql');
        await runMigration(migrationPath);
        console.error('Migration completed successfully');
        
        // Verify the columns were added to world_building_elements
        let result = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'world_building_elements' 
            AND column_name IN ('related_characters', 'related_locations')
        `);
        
        console.error('world_building_elements new columns:', result.rows.map(row => row.column_name));
        
        if (result.rows.length !== 2) {
            throw new Error('Not all expected columns were added to world_building_elements');
        }
        
        // Verify the column was added to locations
        result = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'locations' 
            AND column_name = 'access_requirements'
        `);
        
        console.error('locations new column:', result.rows.map(row => row.column_name));
        
        if (result.rows.length !== 1) {
            throw new Error('Expected column was not added to locations');
        }
        
        // Verify indexes were created
        result = await db.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'world_building_elements' 
            AND indexname IN (
                'idx_world_building_elements_related_characters', 
                'idx_world_building_elements_related_locations'
            )
        `);
        
        console.error('New indexes:', result.rows.map(row => row.indexname));
        
        if (result.rows.length !== 2) {
            throw new Error('Not all expected indexes were created');
        }
        
        // Test inserting data with the new columns
        // Create a test series if needed
        let seriesId;
        const seriesResult = await db.query('SELECT id FROM series LIMIT 1');
        if (seriesResult.rows.length === 0) {
            const insertSeries = await db.query(`
                INSERT INTO series (name, pen_name, genre) 
                VALUES ('Test Series', 'Test Author', 'Test Genre') 
                RETURNING id
            `);
            seriesId = insertSeries.rows[0].id;
        } else {
            seriesId = seriesResult.rows[0].id;
        }
        
        // Insert a test world building element with the new columns
        const worldBuildingResult = await db.query(`
            INSERT INTO world_building_elements (
                series_id, 
                category, 
                element_name, 
                description, 
                related_characters, 
                related_locations
            ) VALUES (
                $1, 
                'test_category', 
                'Test Element', 
                'This is a test element', 
                ARRAY[1, 2, 3]::integer[], 
                ARRAY[1, 2]::integer[]
            ) RETURNING id
        `, [seriesId]);
        
        console.error('Inserted world building element with ID:', worldBuildingResult.rows[0].id);
        
        // Insert a test location with the new column
        const locationResult = await db.query(`
            INSERT INTO locations (
                series_id, 
                name, 
                location_type, 
                description, 
                access_requirements
            ) VALUES (
                $1, 
                'Test Location', 
                'test_type', 
                'This is a test location', 
                'Requires level 5 security clearance'
            ) RETURNING id
        `, [seriesId]);
        
        console.error('Inserted location with ID:', locationResult.rows[0].id);
        
        console.error('All tests passed! The migration was successful.');
    } catch (error) {
        console.error('Error during migration testing:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run the test
testMissingColumnsMigration()
    .then(() => console.error('Migration test completed'))
    .catch(err => {
        console.error('Migration test failed:', err);
        process.exit(1);
    });
