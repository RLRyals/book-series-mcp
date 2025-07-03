# Running the Character Knowledge State Tracker Implementation

This document provides instructions for running and testing the Character Knowledge State Tracker implementation.

## Environment Setup

### PostgreSQL Database (Docker)

The project uses PostgreSQL running in Docker. The database connection details are:

```
Host: localhost
Port: 5432
Database: book_series
Username: writer
Password: secure_writing_password_2024
Connection string: postgresql://writer:secure_writing_password_2024@localhost:5432/book_series
```

### MCP Servers (Claude Desktop)

The MCP servers are configured to run through Claude Desktop. The configuration is already set up in your Claude Desktop configuration file (`claude_desktop_config.json`):

```json
"research-continuity": {
  "command": "node",
  "args": [
    "C:/Users/User/source/repos/book-series-mcp/src/research-server/index.js"
  ],
  "env": {
    "NODE_ENV": "development",
    "DATABASE_URL": "postgresql://writer:secure_writing_password_2024@localhost:5432/book_series",
    "MCP_PORT": "3005"
  }
}
```

The Research-Continuity server runs on port 3005.

## Running the Migration

1. To apply the database migration to create the required table, connect to your Docker PostgreSQL container and run:

```powershell
# Connect to PostgreSQL in Docker
docker exec -it <postgres-container-name> psql -U writer -d book_series

# Once connected to PostgreSQL, execute:
\i /path/to/migrations/20250701_add_character_knowledge_states.sql
```

Alternatively, you can run the migration using the project's script:

```powershell
npm run db:run-migration 20250701_add_character_knowledge_states.sql
```

This will create the `character_knowledge_states` table in your database.

## Starting the Research Server

Since you're using Claude Desktop to manage the MCP servers:

1. Open Claude Desktop
2. The Research-Continuity server should start automatically based on your configuration
3. Verify the server is running by checking Claude Desktop's server status

## Testing the Implementation

### Automated Tests

Run the automated tests to verify the functionality:

```powershell
npm run test:character-knowledge
```

Make sure the environment variable for the database connection is properly set when running the tests:

```powershell
$env:DATABASE_URL="postgresql://writer:secure_writing_password_2024@localhost:5432/book_series"
npm run test:character-knowledge
```

### Manual Testing

You can test the API endpoints manually:

1. Use an API client like Postman or curl to make requests to the HTTP API.

For example, to set a knowledge state:

```powershell
$body = @{
  character_id = 1
  book_id = 1
  chapter_id = 20
  knowledge_item = "Test Knowledge Item"
  knowledge_state = "knows"
  source = "test_source"
  confidence_level = "certain"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3005/api/character-knowledge/set-state" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"; "X-Series-ID"="1"} `
  -Body $body
```

Note that we're using port 3005 as configured in your Claude Desktop settings.

## Using with MCP through Claude Desktop

To use the Character Knowledge Tracker with Claude:

1. Make sure Claude Desktop is running and the Research-Continuity server is active
2. In your conversation with Claude, you can use the MCP tools that were implemented:
   - `set_character_knowledge_state`
   - `check_character_can_reference` 
   - `get_character_knowledge_state`
   - `validate_scene_against_knowledge`

## Troubleshooting

### Docker Database Connection Issues

If you encounter database connection issues:

1. Verify your Docker container is running:
   ```powershell
   docker ps
   ```

2. Check the container logs:
   ```powershell
   docker logs <postgres-container-name>
   ```

3. Test the database connection:
   ```powershell
   docker exec -it <postgres-container-name> psql -U writer -d book_series -c "SELECT 1"
   ```

4. Run the test database connection script:
   ```powershell
   npm run test:db
   ```

### Claude Desktop MCP Issues

If you have issues with the MCP servers in Claude Desktop:

1. Check the server status in Claude Desktop
2. Try restarting the server from Claude Desktop
3. Check the server logs in Claude Desktop
4. Verify the configuration in `claude_desktop_config.json`

### API Errors

If you encounter errors when calling the API:

1. Check that you're using the correct port (3005)
2. Verify that all required parameters are being provided
3. Ensure the character, book, and chapter IDs exist in the database

## Next Steps

After confirming the Character Knowledge State Tracker is working correctly, you can:

1. Populate the database with actual character knowledge states
2. Integrate the tracker into your writing workflow
3. Proceed with implementing the other extensions as outlined in the [Implementation Plan](implementation-plan.md)
