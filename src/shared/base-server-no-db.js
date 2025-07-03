// src/shared/base-server-no-db.js - Base server without database for testing
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export class BaseMCPServer {
    constructor(serverName, serverVersion = '1.0.0') {
        this.serverName = serverName;
        this.serverVersion = serverVersion;
        
        // Initialize MCP Server
        this.server = new Server(
            {
                name: serverName,
                version: serverVersion,
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // Mock database for testing
        this.db = new MockDatabase();
        
        // Tool definitions (to be overridden by child classes)
        this.tools = [];
        
        this.setupErrorHandling();
        this.setupBaseHandlers();
    }

    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error(`[${this.serverName} MCP Error]`, error);
        };

        process.on('SIGINT', async () => {
            await this.cleanup();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.cleanup();
            process.exit(0);
        });

        process.on('uncaughtException', (error) => {
            console.error(`[${this.serverName} Uncaught Exception]`, error);
            this.cleanup().then(() => process.exit(1));
        });
    }

    setupBaseHandlers() {
        // List tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return { tools: this.tools };
        });

        // Call tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                const handler = this.getToolHandler(name);
                if (!handler) {
                    throw new Error(`Unknown tool: ${name}`);
                }

                const result = await handler.call(this, args);
                return this.formatSuccess(result);
            } catch (error) {
                console.error(`Error executing tool ${name}:`, error);
                return this.formatError(name, error);
            }
        });
    }

    // To be overridden by child classes
    getToolHandler(toolName) {
        throw new Error('getToolHandler must be implemented by child class');
    }

    // Helper methods for formatting responses
    formatSuccess(data, message = null) {
        const response = {
            content: []
        };

        if (message) {
            response.content.push({
                type: 'text',
                text: message
            });
        }

        if (data) {
            if (typeof data === 'string') {
                response.content.push({
                    type: 'text',
                    text: data
                });
            } else {
                response.content.push({
                    type: 'text',
                    text: JSON.stringify(data, null, 2)
                });
            }
        }

        return response;
    }

    formatError(toolName, error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error executing ${toolName}: ${error.message}`
                }
            ],
            isError: true
        };
    }

    // Common validation helpers
    validateRequired(args, requiredFields) {
        const missing = requiredFields.filter(field => 
            args[field] === undefined || args[field] === null || args[field] === ''
        );
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }

    validateSeriesExists(seriesId) {
        return this.db.findById('series', seriesId);
    }

    validateBookExists(bookId) {
        return this.db.findById('books', bookId);
    }

    validateCharacterExists(characterId) {
        return this.db.findById('characters', characterId);
    }

    async cleanup() {
        console.error(`Shutting down ${this.serverName}...`);
        // No database to close in mock version
    }

    async run() {
        try {
            console.error(`${this.serverName} starting (database-free mode)`);
            
            // Start MCP server
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.error(`${this.serverName} MCP Server running on stdio`);
            
        } catch (error) {
            console.error(`Failed to start ${this.serverName}:`, error);
            await this.cleanup();
            process.exit(1);
        }
    }
}

// Mock database for testing
class MockDatabase {
    constructor() {
        this.mockData = {
            series: [
                { id: 1, name: 'Test Series', description: 'Mock series for testing' }
            ],
            books: [
                { id: 1, series_id: 1, book_number: 1, title: 'Test Book', status: 'planning' }
            ],
            characters: [
                { id: 1, series_id: 1, name: 'Test Character', character_type: 'protagonist' }
            ]
        };
    }

    async healthCheck() {
        return { healthy: true, timestamp: new Date().toISOString() };
    }

    async findById(table, id) {
        const data = this.mockData[table] || [];
        return data.find(item => item.id === parseInt(id));
    }

    async create(table, data) {
        if (!this.mockData[table]) this.mockData[table] = [];
        const newId = Math.max(0, ...this.mockData[table].map(item => item.id)) + 1;
        const newItem = { id: newId, ...data, created_at: new Date().toISOString() };
        this.mockData[table].push(newItem);
        return newItem;
    }

    async query(sql, params) {
        // Return mock data based on the query
        console.error(`Mock query executed: ${sql}`);
        return { rows: [] };
    }

    async getSeriesOverview(seriesId) {
        if (seriesId) {
            return this.mockData.series.filter(s => s.id === parseInt(seriesId));
        }
        return this.mockData.series;
    }
}