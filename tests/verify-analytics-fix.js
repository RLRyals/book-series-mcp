// Test script to verify the analytics fixes without running migrations
import { DatabaseManager } from '../src/shared/database.js';

async function verifyAnalyticsFixes() {
    console.log('Verifying analytics fixes...');
    
    const db = new DatabaseManager();
    
    try {
        // Test if the book_progress view works with ROUND
        const bookProgressResult = await db.query(`
            SELECT id, title, current_word_count, target_word_count, completion_percentage 
            FROM book_progress 
            WHERE target_word_count > 0 
            LIMIT 1
        `);
        
        console.log('Book progress view test:', {
            success: bookProgressResult.rows.length > 0,
            sample: bookProgressResult.rows[0]
        });
        
        // Test if writing_goals has daily_word_goal column
        const columnExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'writing_goals'
                AND column_name = 'daily_word_goal'
            )
        `);
        
        console.log('Daily word goal column exists:', columnExists.rows[0].exists);
        
        // Test if writing_analytics view works
        const analyticsResult = await db.query(`
            SELECT book_id, title, word_count, target_word_count, completion_percentage
            FROM writing_analytics 
            WHERE target_word_count > 0
            LIMIT 1
        `);
        
        console.log('Writing analytics view test:', {
            success: analyticsResult.rows.length > 0,
            sample: analyticsResult.rows[0]
        });

        console.log('All verification tests completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
}

verifyAnalyticsFixes();
