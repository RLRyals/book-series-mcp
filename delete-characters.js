// Script to delete characters with IDs 1 and 2
import { DatabaseManager } from './src/shared/database.js';

async function deleteCharacters() {
    console.error('Deleting characters with IDs 1 and 2...');
    
    const db = new DatabaseManager();
    
    try {
        // First check if they exist
        const checkResult = await db.query('SELECT id, name FROM characters WHERE id IN (1, 2)');
        console.error(`Found ${checkResult.rows.length} characters to delete:`);
        console.table(checkResult.rows);
        
        // Delete the characters
        const result = await db.query('DELETE FROM characters WHERE id IN (1, 2)');
        console.error(`Deleted ${result.rowCount} characters with IDs 1 and 2`);
        
        // Verify deletion
        const verifyResult = await db.query('SELECT id, name FROM characters WHERE id IN (1, 2)');
        
        if (verifyResult.rows.length === 0) {
            console.error('Deletion successful! No characters found with IDs 1 or 2.');
        } else {
            console.error('Some characters with IDs 1 or 2 still exist in the database.');
            console.table(verifyResult.rows);
        }
        
        // Check for foreign key constraints
        if (result.rowCount === 0) {
            console.error('Checking for foreign key constraints...');
            
            // Check tables referencing characters
            const tables = [
                'character_relationships', 
                'character_development',
                'chapters',
                'plot_threads',
                'timeline_events',
                'clues_evidence',
                'character_knowledge_states'
            ];
            
            for (const table of tables) {
                try {
                    const constraintCheck = await db.query(
                        `SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables 
                            WHERE table_name = $1
                        )`, [table]);
                    
                    if (constraintCheck.rows[0].exists) {
                        const refResult = await db.query(
                            `SELECT * FROM ${table} WHERE 
                             CASE 
                                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'character_id')
                                THEN character_id IN (1, 2)
                                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'character1_id')
                                THEN character1_id IN (1, 2) OR character2_id IN (1, 2)
                                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'pov_character_id')
                                THEN pov_character_id IN (1, 2)
                                WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = 'characters_involved')
                                THEN 1 = ANY(characters_involved) OR 2 = ANY(characters_involved)
                                ELSE FALSE
                             END`, 
                            [table]);
                        
                        if (refResult.rows.length > 0) {
                            console.error(`Found references in ${table}: ${refResult.rows.length} rows`);
                        }
                    }
                } catch (err) {
                    console.error(`Error checking table ${table}: ${err.message}`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error deleting characters:', error);
    } finally {
        await db.close();
    }
}

// Run the deletion
deleteCharacters()
    .then(() => console.error('Deletion completed'))
    .catch(err => {
        console.error('Deletion failed:', err);
        process.exit(1);
    });
