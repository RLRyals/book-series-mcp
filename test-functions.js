// test-functions.js - Test script for writing progress and series report functions
import { WritingProductionServer } from './src/writing-server/index.js';
import { ResearchServer } from './src/research-server/index.js';

async function runTests() {
    console.log("Starting function tests...\n");

    // Initialize servers (without starting HTTP listeners)
    const writingServer = new WritingProductionServer();
    const researchServer = new ResearchServer();

    try {
        // Test 1: writing-production:get_writing_progress
        console.log("Test 1: Testing get_writing_progress...");
        
        // First get a valid book_id
        const booksQuery = await writingServer.db.query('SELECT id FROM books LIMIT 1');
        if (booksQuery.rows.length === 0) {
            throw new Error('No books found in database for testing');
        }
        
        const bookId = booksQuery.rows[0].id;
        console.log(`Using book_id: ${bookId}`);

        const progressResult = await writingServer.getWritingProgress({ book_id: bookId });
        console.log("Writing progress result:", JSON.stringify(progressResult, null, 2));
        
        if (!progressResult || typeof progressResult.completion_percentage !== 'number') {
            throw new Error('Writing progress test failed - invalid or missing completion percentage');
        }
        console.log("✓ get_writing_progress test passed!\n");

        // Test 2: research-continuity:generate_series_report
        console.log("Test 2: Testing generate_series_report...");
        
        // First get a valid series_id
        const seriesQuery = await researchServer.db.query('SELECT id FROM series LIMIT 1');
        if (seriesQuery.rows.length === 0) {
            throw new Error('No series found in database for testing');
        }
        
        const seriesId = seriesQuery.rows[0].id;
        console.log(`Using series_id: ${seriesId}`);

        const reportResult = await researchServer.generateSeriesReport({
            series_id: seriesId,
            report_type: 'progress_report',
            format: 'json'
        });

        console.log("Series report result:", JSON.stringify(reportResult, null, 2));
        
        if (!reportResult || reportResult.content === 'Progress report would be generated here') {
            throw new Error('Series report test failed - still showing placeholder content');
        }
        
        // Verify report has actual content
        if (!reportResult.type || !reportResult.series || !reportResult.writing_stats) {
            throw new Error('Series report test failed - missing required sections');
        }
        console.log("✓ generate_series_report test passed!\n");

        console.log("All tests passed successfully!");
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    } finally {
        // Clean up
        await writingServer.db.close();
        await researchServer.db.close();
    }
}

// Run the tests
runTests().catch(console.error);
