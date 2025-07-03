import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const serverPort = process.env.MCP_PORT || '3004';
const serverUrl = `http://localhost:${serverPort}`;

const server = new Server(
  {
    name: `docker-bridge-${serverPort}`,
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Forward tools/list requests
server.setRequestHandler('tools/list', async () => {
  try {
    const response = await fetch(`${serverUrl}/info`);
    const info = await response.json();
    return { tools: info.tools || [] };
  } catch (error) {
    console.error(`Bridge error (${serverPort}):`, error.message);
    return { tools: [] };
  }
});

// Forward tools/call requests  
server.setRequestHandler('tools/call', async (request) => {
  try {
    const response = await fetch(`${serverUrl}/mcp-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.params)
    });
    return await response.json();
  } catch (error) {
    console.error(`Bridge call error (${serverPort}):`, error.message);
    return { 
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true 
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);