// standalone-pg-test.js - Standalone PostgreSQL connection test
import { Client } from 'pg';
import { readFileSync } from 'fs';

async function testPostgreSQL() {
    console.error('🔍 Testing PostgreSQL connection...\n');
    
    // Try to read .env file
    let envVars = {};
    try {
        const envContent = readFileSync('.env', 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envVars[key.trim()] = value.trim();
            }
        });
        console.error('✅ Found .env file');
        console.error('DATABASE_URL exists:', envVars.DATABASE_URL ? 'Yes' : 'No');
    } catch (error) {
        console.error('❌ No .env file found');
    }
    
    // Test configurations
    const testConfigs = [
        {
            name: 'From .env DATABASE_URL',
            config: envVars.DATABASE_URL,
            skip: !envVars.DATABASE_URL
        },
        {
            name: 'Default PostgreSQL (postgres/postgres)',
            config: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                database: 'postgres',
                connectionTimeoutMillis: 5000,
            }
        },
        {
            name: 'Default PostgreSQL (postgres/empty password)',
            config: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: '',
                database: 'postgres',
                connectionTimeoutMillis: 5000,
            }
        },
        {
            name: 'Your book_series_db (postgres/postgres)',
            config: {
                host: 'localhost',
                port: 5432,
                user: 'postgres',
                password: 'postgres',
                database: 'book_series_db',
                connectionTimeoutMillis: 5000,
            }
        }
    ];
    
    for (const { name, config, skip } of testConfigs) {
        if (skip) {
            console.error(`⏭️  Skipping: ${name} (no config)`);
            continue;
        }
        
        console.error(`\n🔧 Testing: ${name}`);
        
        if (typeof config === 'object') {
            console.error(`   Host: ${config.host}:${config.port}`);
            console.error(`   User: ${config.user}`);
            console.error(`   Database: ${config.database}`);
        }
        
        const client = new Client(config);
        
        try {
            console.error('   Connecting...');
            await client.connect();
            console.error('   ✅ Connected successfully!');
            
            const result = await client.query('SELECT version()');
            console.error('   📋 PostgreSQL version:', result.rows[0].version.substring(0, 50) + '...');
            
            // List databases
            try {
                const dbs = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname');
                console.error('   📂 Available databases:', dbs.rows.map(row => row.datname).join(', '));
            } catch (dbError) {
                console.error('   ⚠️  Could not list databases:', dbError.message);
            }
            
            await client.end();
            console.error('   🎉 Test passed! This configuration works.');
            
            // If this worked, show the working connection string
            if (typeof config === 'object') {
                const workingURL = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
                console.error('\n✨ Working connection string:');
                console.error(`DATABASE_URL=${workingURL}`);
            }
            
            return; // Exit on first success
            
        } catch (error) {
            console.error('   ❌ Failed:', error.message);
            
            // Provide specific error guidance
            if (error.code === 'ECONNREFUSED') {
                console.error('   💡 PostgreSQL server is not running or not accepting connections');
            } else if (error.code === 'ENOTFOUND') {
                console.error('   💡 Cannot resolve hostname (check if PostgreSQL is installed)');
            } else if (error.message.includes('password authentication failed')) {
                console.error('   💡 Wrong username or password');
            } else if (error.message.includes('database') && error.message.includes('does not exist')) {
                console.error('   💡 Database does not exist - try creating it first');
            } else if (error.message.includes('timeout')) {
                console.error('   💡 Connection timeout - PostgreSQL may be slow or not responding');
            }
            
            try {
                await client.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
    
    console.error('\n❌ All connection tests failed');
    console.error('\n📋 Next steps:');
    console.error('1. Make sure PostgreSQL is installed and running');
    console.error('2. Check Windows Services for "postgresql" service');
    console.error('3. Try connecting with pgAdmin or another PostgreSQL client');
    console.error('4. Verify your username and password');
    console.error('5. Create the book_series_db database if it doesn\'t exist');
    
    console.error('\n🔧 To start PostgreSQL service (if installed):');
    console.error('   - Windows: Services → PostgreSQL → Start');
    console.error('   - Or in CMD as admin: net start postgresql-x64-XX');
}

testPostgreSQL().catch(error => {
    console.error('💥 Test script error:', error);
});