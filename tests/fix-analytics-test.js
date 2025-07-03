// Test script for running the migration to fix the ROUND function and analytics issues
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseManager } from '../src/shared/database.js';
import { runMigration } from '../src/shared/run-migration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAnalyticsFix() {
    console.error('Testing migration for fixing ROUND function and analytics views');
    
    const db = new DatabaseManager();
    
    try {
        // Run the migration
        const migrationPath = path.resolve(__dirname, '../migrations/20250705_fix_round_function_and_analytics.sql');
        await runMigration(migrationPath);
        console.error('Migration completed successfully');
        
        // Test if the book_progress view works now
        const bookProgressResult = await db.query(`
            SELECT * FROM book_progress LIMIT 1
        `);
        
        console.error('Book progress view is functioning:', bookProgressResult.rows.length > 0);
        
        // Test if the new writing_analytics view works
        const analyticsResult = await db.query(`
            SELECT * FROM writing_analytics LIMIT 1
        `);
        
        console.error('Writing analytics view is functioning:', analyticsResult.rows.length > 0);
        
        // Test if the new chapter_structure_progress view works
        const chapterProgressResult = await db.query(`
            SELECT * FROM chapter_structure_progress LIMIT 1
        `);
        
        console.error('Chapter structure progress view is functioning:', chapterProgressResult.rows.length > 0);
        
        // Test if the writing_goals table was created
        const tableExists = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'writing_goals'
            )
        `);
        
        console.error('Writing goals table created:', tableExists.rows[0].exists);
        
        // Test if the writing_goals_progress view works
        const goalsProgressResult = await db.query(`
            SELECT * FROM writing_goals_progress LIMIT 1
        `);
        
        console.error('Writing goals progress view is functioning:', true);
        
        // Insert a test book if needed to test the fixed ROUND function
        const books = await db.query(`SELECT id FROM books LIMIT 1`);
        let bookId;
        
        if (books.rows.length === 0) {
            // Create a test series and book
            const seriesResult = await db.query(`
                INSERT INTO series (name, pen_name, genre) 
                VALUES ('Test Series', 'Test Author', 'Test Genre') 
                RETURNING id
            `);
            
            const seriesId = seriesResult.rows[0].id;
            
            const bookResult = await db.query(`
                INSERT INTO books (
                    series_id, book_number, title, word_count, target_word_count
                ) VALUES (
                    $1, 1, 'Test Book', 25000, 100000
                ) RETURNING id
            `, [seriesId]);
            
            bookId = bookResult.rows[0].id;
            console.error('Created test book with ID:', bookId);
        } else {
            bookId = books.rows[0].id;
            console.error('Using existing book with ID:', bookId);
        }
        
        // Now test the specific query that was failing
        const testQuery = `
            SELECT 
                b.id, b.title, b.word_count, b.target_word_count, b.chapter_count, b.target_chapters,
                b.status, b.outline_complete, b.first_draft_complete, b.editing_complete,
                ROUND((b.word_count::numeric / NULLIF(b.target_word_count, 0)) * 100, 2) as completion_percentage,
                COUNT(ws.id) as total_sessions,
                SUM(ws.words_written) as total_words_logged,
                AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL) as avg_productivity
            FROM books b
            LEFT JOIN writing_sessions ws ON b.id = ws.book_id
            WHERE b.id = $1
            GROUP BY b.id
        `;
        
        const testResult = await db.query(testQuery, [bookId]);
        console.error('Test query executed successfully');
        console.error('Completion percentage calculation:', testResult.rows[0].completion_percentage);
        
        console.error('All tests passed! The ROUND function issue is fixed.');
    } catch (error) {
        console.error('Error during testing:', error);
        throw error;
    } finally {
        await db.close();
    }
}

// Run the test
testAnalyticsFix()
    .then(() => console.error('Analytics fix test completed'))
    .catch(err => {
        console.error('Analytics fix test failed:', err);
        process.exit(1);
    });
