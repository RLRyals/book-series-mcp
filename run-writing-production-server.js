// run-writing-production-server.js - Script to run the Writing Production MCP Server
import { WritingProductionServer } from './src/writing-server/index.js';

// Set port environment variable to avoid conflicts
process.env.MCP_PORT = 3000;

// Instantiate and start the server
const server = new WritingProductionServer();
server.run().catch(console.error);
