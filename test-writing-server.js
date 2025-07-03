// test-writing-server.js - Simplified writing server for testing MCP connection
import { BaseMCPServer } from './src/shared/base-server-no-db.js';

class TestWritingServer extends BaseMCPServer {
    constructor() {
        super('test-writing-server', '1.0.0');
        
        this.tools = [
            {
                name: 'create_book',
                description: 'Create a new book in a series (test version)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        book_number: { type: 'integer', description: 'Book number in series' },
                        title: { type: 'string', description: 'Book title' }
                    },
                    required: ['series_id', 'book_number', 'title']
                }
            },
            {
                name: 'get_books',
                description: 'Get books in a series (test version)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'test_connection',
                description: 'Test the MCP connection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Test message' }
                    }
                }
            }
        ];
    }

    getToolHandler(toolName) {
        const handlers = {
            'create_book': this.createBook,
            'get_books': this.getBooks,
            'test_connection': this.testConnection
        };

        return handlers[toolName];
    }

    async createBook(args) {
        this.validateRequired(args, ['series_id', 'book_number', 'title']);
        
        // Mock validation
        const series = await this.validateSeriesExists(args.series_id);
        if (!series) {
            throw new Error(`Series with ID ${args.series_id} not found`);
        }
        
        const book = await this.db.create('books', {
            series_id: args.series_id,
            book_number: args.book_number,
            title: args.title,
            status: 'planning'
        });
        
        return {
            book,
            message: `Created book "${book.title}" (Book ${book.book_number}) with ID ${book.id}`
        };
    }

    async getBooks(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Return mock books
        return [
            {
                id: 1,
                series_id: args.series_id,
                book_number: 1,
                title: 'Test Book 1',
                status: 'planning',
                word_count: 0,
                target_word_count: 100000
            },
            {
                id: 2,
                series_id: args.series_id,
                book_number: 2,
                title: 'Test Book 2',
                status: 'outlining',
                word_count: 5000,
                target_word_count: 100000
            }
        ];
    }

    async testConnection(args) {
        const message = args.message || 'Hello from MCP!';
        return {
            success: true,
            message: `Test successful! Server: ${this.serverName}, Message: ${message}`,
            timestamp: new Date().toISOString(),
            available_tools: this.tools.map(t => t.name)
        };
    }
}

// Start the server
const server = new TestWritingServer();
server.run().catch(console.error);