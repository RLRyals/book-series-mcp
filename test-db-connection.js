// test-db-connection.js - Test database connection for MCP servers
import { DatabaseManager } from './src/shared/database.js';

async function testDatabaseConnection() {
    console.error('Testing MCP server database connection...');
    
    try {
        // Output current environment variables
        console.error('Environment variables:');
        console.error('NODE_ENV:', process.env.NODE_ENV);
        console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
        console.error('DATABASE_URL preview:', process.env.DATABASE_URL 
            ? process.env.DATABASE_URL.substring(0, 30) + '...' 
            : 'undefined');
        
        // Create database manager
        console.error('\nInitializing DatabaseManager...');
        const db = new DatabaseManager();
        
        // Test connection
        console.error('\nTesting connection...');
        const health = await db.healthCheck();
        
        if (health.healthy) {
            console.error('✅ Database connection successful!');
            console.error('Timestamp:', health.timestamp);
            
            // List some data
            try {
                const seriesResult = await db.query('SELECT COUNT(*) FROM series');
                console.error('Series count:', seriesResult.rows[0].count);
                
                const booksResult = await db.query('SELECT COUNT(*) FROM books');
                console.error('Books count:', booksResult.rows[0].count);
                
                const charactersResult = await db.query('SELECT COUNT(*) FROM characters');
                console.error('Characters count:', charactersResult.rows[0].count);
            } catch (err) {
                console.error('Error querying tables:', err.message);
            }
        } else {
            console.error('❌ Database connection failed!');
            console.error('Error:', health.error);
        }
        
        // Close connection
        await db.close();
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testDatabaseConnection().catch(console.error);
