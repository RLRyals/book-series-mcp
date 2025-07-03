// Script to verify characters were deleted
import { DatabaseManager } from './src/shared/database.js';

async function verifyDeletion() {
    console.error('Verifying character deletion...');
    
    const db = new DatabaseManager();
    
    try {
        // Check if characters with IDs 1 and 2 exist
        const result = await db.query('SELECT id, name FROM characters WHERE id IN (1, 2)');
        
        console.error(`Found ${result.rows.length} characters with IDs 1 or 2:`);
        console.table(result.rows);
        
        if (result.rows.length === 0) {
            console.error('Deletion successful! No characters found with IDs 1 or 2.');
        } else {
            console.error('Some characters with IDs 1 or 2 still exist in the database.');
        }
        
        // Get total count of characters
        const countResult = await db.query('SELECT COUNT(*) FROM characters');
        console.error(`Total characters in database: ${countResult.rows[0].count}`);
        
    } catch (error) {
        console.error('Error verifying deletion:', error);
    } finally {
        await db.close();
    }
}

// Run the verification
verifyDeletion()
    .then(() => console.error('Verification completed'))
    .catch(err => {
        console.error('Verification failed:', err);
        process.exit(1);
    });
