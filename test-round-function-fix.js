// test-round-function-fix.js - Test script to verify our ROUND function fix
import { DatabaseManager } from './src/shared/database.js';

// Create database connection
const db = new DatabaseManager();

async function testRoundFunctionFix() {
    console.log("Testing ROUND function fix...");
    
    try {
        // Database is auto-connected upon creation in this implementation
        console.log("Connected to database successfully");
        
        // Test query that previously caused the error
        const testQuery = `
            SELECT 
                id, title, word_count, target_word_count,
                ROUND((word_count::numeric / NULLIF(target_word_count, 0)::numeric) * 100.0, 2) as completion_percentage
            FROM books
            LIMIT 1
        `;
        
        const result = await db.query(testQuery);
        console.log("Test query executed successfully!");
        console.log("Result:", result.rows[0]);
        
        // Test the progress report function in research server
        console.log("\nTesting generate_series_report content...");
        const seriesQuery = "SELECT id FROM series LIMIT 1";
        const seriesResult = await db.query(seriesQuery);
        
        if (seriesResult.rows.length > 0) {
            const seriesId = seriesResult.rows[0].id;
            
            // Test the progress report query
            const progressQuery = `
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(words_written) as total_words,
                    ROUND(AVG(words_written)::numeric, 0) as avg_words_per_session,
                    ROUND(AVG(productivity_rating)::numeric, 1) as avg_productivity
                FROM writing_sessions 
                WHERE book_id IN (SELECT id FROM books WHERE series_id = $1)
            `;
            
            const progressResult = await db.query(progressQuery, [seriesId]);
            console.log("Progress report query executed successfully!");
            console.log("Result:", progressResult.rows[0]);
        } else {
            console.log("No series found to test progress report");
        }
        
        console.log("\nAll tests passed! The ROUND function issue is fixed.");
    } catch (error) {
        console.error("Error during testing:", error);
    } finally {
        // Close database connection
        await db.close();
    }
}

// Run the test
testRoundFunctionFix().catch(console.error);
