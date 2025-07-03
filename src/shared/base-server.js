// src/shared/base-server.js - Base class for all MCP servers
import dotenv from 'dotenv';
dotenv.config();
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DatabaseManager } from './database.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

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

        // Initialize database
        this.db = new DatabaseManager();
        
        // Initialize HTTP server for health checks
        this.httpApp = express();
        this.setupHttpServer();
        
        // Tool definitions (to be overridden by child classes)
        this.tools = [];
        
        this.setupErrorHandling();
        this.setupBaseHandlers();
    }

    setupHttpServer() {
        this.httpApp.use(helmet());
        this.httpApp.use(cors());
        this.httpApp.use(express.json());

        // Health check endpoint
        this.httpApp.get('/health', async (req, res) => {
            try {
                const dbHealth = await this.db.healthCheck();
                res.json({
                    server: this.serverName,
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    database: dbHealth
                });
            } catch (error) {
                res.status(500).json({
                    server: this.serverName,
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        // Server info endpoint
        this.httpApp.get('/info', (req, res) => {
            res.json({
                name: this.serverName,
                version: this.serverVersion,
                tools: this.tools.map(tool => ({
                    name: tool.name,
                    description: tool.description
                }))
            });
        });

        const port = process.env.MCP_PORT || 3000;
        this.httpApp.listen(port, () => {
            console.error(`${this.serverName} HTTP server running on port ${port}`);
        });
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

    // Common tool implementations that can be shared
    async getSeriesOverview(args) {
        const { series_id } = args;
        const result = await this.db.getSeriesOverview(series_id);
        
        if (series_id && result.length === 0) {
            throw new Error(`Series with ID ${series_id} not found`);
        }
        
        return result;
    }

    async searchContent(args) {
        this.validateRequired(args, ['series_id', 'search_term']);
        const { series_id, search_term, content_types } = args;
        
        await this.validateSeriesExists(series_id);
        
        const contentTypesArray = content_types ? 
            (Array.isArray(content_types) ? content_types : [content_types]) : 
            [];
            
        return await this.db.searchContent(series_id, search_term, contentTypesArray);
    }

    async cleanup() {
        console.error(`Shutting down ${this.serverName}...`);
        try {
            await this.db.close();
            console.error(`${this.serverName} database connection closed`);
        } catch (error) {
            console.error(`Error during ${this.serverName} cleanup:`, error);
        }
    }

    async run() {
        try {
            // Test database connection
            const healthCheck = await this.db.healthCheck();
            if (!healthCheck.healthy) {
                throw new Error(`Database health check failed: ${healthCheck.error}`);
            }
            
            console.error(`${this.serverName} database connection established`);
            
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