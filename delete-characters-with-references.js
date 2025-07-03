// Script to delete characters with IDs 1 and 2 and their references
import { DatabaseManager } from './src/shared/database.js';

async function deleteCharactersWithReferences() {
    console.error('Preparing to delete characters with IDs 1 and 2...');
    
    const db = new DatabaseManager();
    
    try {
        // Start a transaction to ensure consistency
        await db.transaction(async (client) => {
            // Find all references to these characters in the clues_evidence table
            const referencesResult = await client.query(
                'SELECT id FROM clues_evidence WHERE discovered_by IN (1, 2)'
            );
            
            console.error(`Found ${referencesResult.rows.length} references in clues_evidence table`);
            
            if (referencesResult.rows.length > 0) {
                // Option 1: Set discovered_by to NULL for these records
                const updateResult = await client.query(
                    'UPDATE clues_evidence SET discovered_by = NULL WHERE discovered_by IN (1, 2)'
                );
                
                console.error(`Updated ${updateResult.rowCount} references in clues_evidence table (set to NULL)`);
                
                // Option 2 (alternative): Delete the referencing rows
                // Uncomment this if you want to delete the referencing rows instead
                /*
                const deleteRefsResult = await client.query(
                    'DELETE FROM clues_evidence WHERE discovered_by IN (1, 2)'
                );
                console.error(`Deleted ${deleteRefsResult.rowCount} references from clues_evidence table`);
                */
            }
            
            // Check for any other references in other tables
            // character_relationships
            const relationsResult = await client.query(
                'SELECT id FROM character_relationships WHERE character1_id IN (1, 2) OR character2_id IN (1, 2)'
            );
            
            if (relationsResult.rows.length > 0) {
                console.error(`Found ${relationsResult.rows.length} references in character_relationships table`);
                const deleteRelationsResult = await client.query(
                    'DELETE FROM character_relationships WHERE character1_id IN (1, 2) OR character2_id IN (1, 2)'
                );
                console.error(`Deleted ${deleteRelationsResult.rowCount} references from character_relationships table`);
            }
            
            // character_development
            const developmentResult = await client.query(
                'SELECT id FROM character_development WHERE character_id IN (1, 2)'
            );
            
            if (developmentResult.rows.length > 0) {
                console.error(`Found ${developmentResult.rows.length} references in character_development table`);
                const deleteDevelopmentResult = await client.query(
                    'DELETE FROM character_development WHERE character_id IN (1, 2)'
                );
                console.error(`Deleted ${deleteDevelopmentResult.rowCount} references from character_development table`);
            }
            
            // chapters
            const chaptersResult = await client.query(
                'SELECT id FROM chapters WHERE pov_character_id IN (1, 2)'
            );
            
            if (chaptersResult.rows.length > 0) {
                console.error(`Found ${chaptersResult.rows.length} references in chapters table`);
                const updateChaptersResult = await client.query(
                    'UPDATE chapters SET pov_character_id = NULL WHERE pov_character_id IN (1, 2)'
                );
                console.error(`Updated ${updateChaptersResult.rowCount} references in chapters table (set to NULL)`);
            }
            
            // Check for array fields that might contain these character IDs
            const tables = [
                { name: 'plot_threads', column: 'related_characters' },
                { name: 'cases', column: 'assigned_detectives' },
                { name: 'timeline_events', column: 'characters_involved' },
                { name: 'series_notes', column: 'related_characters' },
                { name: 'world_building_elements', column: 'related_characters' }
            ];
            
            for (const table of tables) {
                try {
                    // Check if the table exists
                    const tableExistsResult = await client.query(
                        `SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables 
                            WHERE table_name = $1
                        )`, [table.name]
                    );
                    
                    if (tableExistsResult.rows[0].exists) {
                        // Check if the column exists
                        const columnExistsResult = await client.query(
                            `SELECT EXISTS (
                                SELECT 1 FROM information_schema.columns 
                                WHERE table_name = $1 AND column_name = $2
                            )`, [table.name, table.column]
                        );
                        
                        if (columnExistsResult.rows[0].exists) {
                            // Find rows with these character IDs in the array
                            const arrayRefsResult = await client.query(
                                `SELECT id FROM ${table.name} 
                                 WHERE 1 = ANY(${table.column}) OR 2 = ANY(${table.column})`
                            );
                            
                            if (arrayRefsResult.rows.length > 0) {
                                console.error(`Found ${arrayRefsResult.rows.length} references in ${table.name} table (${table.column} array)`);
                                
                                // Remove these character IDs from the arrays
                                const updateArrayResult = await client.query(
                                    `UPDATE ${table.name} 
                                     SET ${table.column} = array_remove(array_remove(${table.column}, 1), 2)
                                     WHERE 1 = ANY(${table.column}) OR 2 = ANY(${table.column})`
                                );
                                
                                console.error(`Updated ${updateArrayResult.rowCount} arrays in ${table.name} table`);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error processing ${table.name}: ${err.message}`);
                }
            }
            
            // Check for character_knowledge_states table (if it exists from our previous migrations)
            try {
                const ckStateResult = await client.query(
                    `SELECT EXISTS (
                        SELECT 1 FROM information_schema.tables 
                        WHERE table_name = 'character_knowledge_states'
                    )`
                );
                
                if (ckStateResult.rows[0].exists) {
                    const knowledgeResult = await client.query(
                        'SELECT id FROM character_knowledge_states WHERE character_id IN (1, 2)'
                    );
                    
                    if (knowledgeResult.rows.length > 0) {
                        console.error(`Found ${knowledgeResult.rows.length} references in character_knowledge_states table`);
                        const deleteKnowledgeResult = await client.query(
                            'DELETE FROM character_knowledge_states WHERE character_id IN (1, 2)'
                        );
                        console.error(`Deleted ${deleteKnowledgeResult.rowCount} references from character_knowledge_states table`);
                    }
                }
            } catch (err) {
                console.error(`Error processing character_knowledge_states: ${err.message}`);
            }
            
            // Finally, delete the characters
            const deleteResult = await client.query('DELETE FROM characters WHERE id IN (1, 2)');
            console.error(`Deleted ${deleteResult.rowCount} characters with IDs 1 and 2`);
            
            // Verify deletion
            const verifyResult = await client.query('SELECT id, name FROM characters WHERE id IN (1, 2)');
            
            if (verifyResult.rows.length === 0) {
                console.error('Deletion successful! No characters found with IDs 1 or 2.');
            } else {
                console.error('Some characters with IDs 1 or 2 still exist in the database.');
                console.table(verifyResult.rows);
            }
        });
        
    } catch (error) {
        console.error('Error deleting characters:', error);
    } finally {
        await db.close();
    }
}

// Run the deletion
deleteCharactersWithReferences()
    .then(() => console.error('Deletion process completed'))
    .catch(err => {
        console.error('Deletion process failed:', err);
        process.exit(1);
    });
