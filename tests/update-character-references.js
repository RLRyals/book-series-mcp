// tests/update-character-references.js
// Script to update character references in clues_evidence table and then delete characters with IDs 1 and 2

import { DatabaseManager } from '../src/shared/database.js';

async function updateCharacterReferencesAndDelete() {
    const db = new DatabaseManager();
    
    try {
        console.error('Starting transaction to update character references and delete characters');
        
        await db.transaction(async (client) => {
            // First, find all references to characters 1 and 2 in clues_evidence
            const referencesResult = await client.query(`
                SELECT id, discovered_by 
                FROM clues_evidence 
                WHERE discovered_by IN (1, 2)
            `);
            
            console.error(`Found ${referencesResult.rows.length} references to characters 1 and 2 in clues_evidence`);
            
            if (referencesResult.rows.length > 0) {
                // Update all references to character 3
                const updateResult = await client.query(`
                    UPDATE clues_evidence 
                    SET discovered_by = 3 
                    WHERE discovered_by IN (1, 2)
                    RETURNING id
                `);
                
                console.error(`Updated ${updateResult.rows.length} records in clues_evidence to reference character 3`);
                console.error('Updated clue IDs:', updateResult.rows.map(row => row.id));
            }
            
            // For character_knowledge_states, we need to delete the records due to unique constraints
            const knowledgeStatesResult = await client.query(`
                SELECT id, character_id, book_id, chapter_id, knowledge_item
                FROM character_knowledge_states 
                WHERE character_id IN (1, 2)
            `);
            
            if (knowledgeStatesResult.rows.length > 0) {
                console.error(`Found ${knowledgeStatesResult.rows.length} references in character_knowledge_states`);
                console.error('These knowledge states will be deleted due to unique constraint issues:');
                
                knowledgeStatesResult.rows.forEach(row => {
                    console.error(`  - ID: ${row.id}, Character: ${row.character_id}, Knowledge: ${row.knowledge_item}`);
                });
                
                const deleteResult = await client.query(`
                    DELETE FROM character_knowledge_states 
                    WHERE character_id IN (1, 2)
                    RETURNING id
                `);
                
                console.error(`Deleted ${deleteResult.rows.length} records from character_knowledge_states`);
            }
            
            // Check for other references in other tables
            const tables = [
                'character_development', 
                'character_relationships', 
                'chapters', 
                'timeline_events'
            ];
            
            for (const table of tables) {
                // Check for foreign key columns referencing characters
                if (table === 'character_relationships') {
                    // character_relationships has two columns referencing characters
                    const relationsResult = await client.query(`
                        SELECT id, character1_id, character2_id 
                        FROM character_relationships 
                        WHERE character1_id IN (1, 2) OR character2_id IN (1, 2)
                    `);
                    
                    if (relationsResult.rows.length > 0) {
                        console.error(`Found ${relationsResult.rows.length} references in character_relationships`);
                        
                        // Update character1_id references
                        await client.query(`
                            UPDATE character_relationships 
                            SET character1_id = 3 
                            WHERE character1_id IN (1, 2)
                        `);
                        
                        // Update character2_id references
                        await client.query(`
                            UPDATE character_relationships 
                            SET character2_id = 3 
                            WHERE character2_id IN (1, 2)
                        `);
                        
                        console.error(`Updated references in character_relationships to character 3`);
                    }
                } else if (table === 'chapters') {
                    // Check pov_character_id in chapters
                    const chaptersResult = await client.query(`
                        SELECT id, pov_character_id 
                        FROM chapters 
                        WHERE pov_character_id IN (1, 2)
                    `);
                    
                    if (chaptersResult.rows.length > 0) {
                        console.error(`Found ${chaptersResult.rows.length} references in chapters`);
                        
                        await client.query(`
                            UPDATE chapters 
                            SET pov_character_id = 3 
                            WHERE pov_character_id IN (1, 2)
                        `);
                        
                        console.error(`Updated references in chapters to character 3`);
                    }
                } else if (table === 'character_development') {
                    // Check character_id in character_development
                    const devResult = await client.query(`
                        SELECT id, character_id 
                        FROM character_development 
                        WHERE character_id IN (1, 2)
                    `);
                    
                    if (devResult.rows.length > 0) {
                        console.error(`Found ${devResult.rows.length} references in character_development`);
                        
                        await client.query(`
                            UPDATE character_development 
                            SET character_id = 3 
                            WHERE character_id IN (1, 2)
                        `);
                        
                        console.error(`Updated references in character_development to character 3`);
                    }
                } else if (table === 'timeline_events') {
                    // Check characters_involved array in timeline_events
                    const timelineResult = await client.query(`
                        SELECT id, characters_involved 
                        FROM timeline_events 
                        WHERE 1 = ANY(characters_involved) OR 2 = ANY(characters_involved)
                    `);
                    
                    if (timelineResult.rows.length > 0) {
                        console.error(`Found ${timelineResult.rows.length} references in timeline_events`);
                        
                        // For each timeline event, replace 1 and 2 with 3 in the characters_involved array
                        for (const row of timelineResult.rows) {
                            const newCharactersInvolved = Array.from(new Set(
                                row.characters_involved.map(id => id === 1 || id === 2 ? 3 : id)
                            ));
                            
                            await client.query(`
                                UPDATE timeline_events 
                                SET characters_involved = $1 
                                WHERE id = $2
                            `, [newCharactersInvolved, row.id]);
                        }
                        
                        console.error(`Updated references in timeline_events to character 3`);
                    }
                }
            }
            
            // Check for array columns in other tables that might reference characters
            const arrayColumnTables = [
                { table: 'plot_threads', column: 'related_characters' },
                { table: 'cases', column: 'assigned_detectives' },
                { table: 'series_notes', column: 'related_characters' },
                { table: 'world_building_elements', column: 'related_characters' }
            ];
            
            for (const { table, column } of arrayColumnTables) {
                // Check if the column exists (for the world_building_elements which we just added)
                const columnExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_name = $1 AND column_name = $2
                    );
                `, [table, column]);
                
                if (columnExists.rows[0].exists) {
                    const arrayResult = await client.query(`
                        SELECT id, ${column} 
                        FROM ${table} 
                        WHERE 1 = ANY(${column}) OR 2 = ANY(${column})
                    `);
                    
                    if (arrayResult.rows.length > 0) {
                        console.error(`Found ${arrayResult.rows.length} references in ${table}.${column}`);
                        
                        // For each row, replace 1 and 2 with 3 in the array
                        for (const row of arrayResult.rows) {
                            const newArray = Array.from(new Set(
                                row[column].map(id => id === 1 || id === 2 ? 3 : id)
                            ));
                            
                            await client.query(`
                                UPDATE ${table} 
                                SET ${column} = $1 
                                WHERE id = $2
                            `, [newArray, row.id]);
                        }
                        
                        console.error(`Updated references in ${table}.${column} to character 3`);
                    }
                }
            }
            
            // Now delete the characters
            const deleteResult = await client.query(`
                DELETE FROM characters 
                WHERE id IN (1, 2) 
                RETURNING id, name
            `);
            
            console.error(`Deleted ${deleteResult.rows.length} characters:`);
            deleteResult.rows.forEach(row => {
                console.error(`  - ID: ${row.id}, Name: ${row.name}`);
            });
        });
        
        console.error('Transaction completed successfully');
        
        // Verify character 3 exists
        const char3Result = await db.query(`
            SELECT id, name FROM characters WHERE id = 3
        `);
        
        if (char3Result.rows.length > 0) {
            console.error(`Character ID 3 exists: ${char3Result.rows[0].name}`);
        } else {
            console.error('Warning: Character ID 3 does not exist. References were updated but may be invalid.');
        }
        
    } catch (error) {
        console.error('Error during update operation:', error);
    } finally {
        await db.close();
    }
}

// Run the function
updateCharacterReferencesAndDelete()
    .then(() => console.error('Script completed'))
    .catch(err => console.error('Script failed:', err));
