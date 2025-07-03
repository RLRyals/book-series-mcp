# Book Series MCP (Model Context Protocol) Server

This project provides a set of Model Context Protocol (MCP) servers designed to help manage complex book series writing projects with Claude Desktop. It includes functionality for character management, plot tracking, world-building, research/continuity tracking, and writing production management.

## Features

- Character Management & Development Tracking
- Plot Structure & Timeline Management
- World-Building & Location Tracking
- Research & Continuity Management
- Writing Production & Progress Tracking
- Automated Story Structure Validation
- Character Knowledge State Tracking

## Prerequisites

- Node.js (v16 or higher)
- Docker (recommended) OR PostgreSQL (v12 or higher)
- Claude Desktop

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/RLRyals/book-series-mcp.git
cd book-series-mcp
```

2. **Set up environment variables**
```bash
cp .env.template .env
```
Then edit `.env` with your desired configuration.

3. **Install dependencies**
```bash
npm install
```

4. **Set up the database**

You have two options:

### Option A: Using Docker (Recommended)
1. Make sure Docker is installed and running
2. Run the database setup script:
```bash
pwsh .\db-docker-tools.ps1 -setup
```
This will:
- Create a Docker container with PostgreSQL
- Initialize the database with the schema
- Set up all necessary tables and views

### Option B: Using existing PostgreSQL installation
1. Create a new database in your PostgreSQL instance
2. Run the initialization script:
```sql
psql -U your_user -d your_database -f init.sql
```

## Setting Up MCP Servers in Claude Desktop

1. Open Claude Desktop
2. Go to Settings
3. In the settings, look for the "MCP Servers Configuration" section
4. Replace the entire configuration with this:

```json
{
  "mcpServers": {
    "writing-production": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/writing-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3004"
      }
    },
    "character-development": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/character-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3001"
      }
    },
    "plot-management": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/plot-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3002"
      }
    },
    "world-building": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/world-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3003"
      }
    },
    "research-continuity": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/research-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3005"
      }
    },
    "book-series-manager": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "MCP_PORT": "3000"
      }
    }
  },
  "isUsingBuiltInNodeForMcp": true
}
```

**Important Notes:**
1. Replace `path/to/book-series-mcp` with the actual path where you installed the project on your computer
2. The database connection string should match your `.env` file exactly:
   - Default username is `writer`
   - Default password is `secure_writing_password_2025`
   - If you changed these in your `.env` file, use your custom values instead

What each server does:
- **Writing Production**: Helps track your writing progress, word counts, and goals
- **Character Development**: Manages your characters, their relationships, and development arcs
- **Plot Management**: Keeps track of your plot threads, timelines, and story structure
- **World Building**: Organizes your locations, organizations, and world elements
- **Research & Continuity**: Makes sure your story details stay consistent and tracks what each character knows
- **Book Series Manager**: The main server that coordinates everything

Important: Replace `path/to/book-series-mcp` with the actual path where you installed the project on your computer. Also update the database connection details to match your `.env` file.

Each server provides specialized functionality:
- Book Series Manager: Central coordination and management
- Character Development: Character creation, development, and relationship tracking
- Plot Management: Plot threads, timelines, and story structure
- World Building: Locations, organizations, and world elements
- Writing Production: Writing progress, goals, and productivity tracking
- Research & Continuity: Character knowledge states, fact checking, and continuity management

## Environment Configuration

1. Copy the template environment file:
```bash
cp .env.template .env
```

2. Update the `.env` file with your specific configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=book_series_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Ports
CHARACTER_SERVER_PORT=3001
PLOT_SERVER_PORT=3002
RESEARCH_SERVER_PORT=3003
WORLD_SERVER_PORT=3004
WRITING_SERVER_PORT=3005

# Optional: Docker Configuration
POSTGRES_DOCKER_CONTAINER=book-series-db
POSTGRES_DOCKER_PORT=5432
POSTGRES_DOCKER_PASSWORD=your_docker_password_here
```

## Project Structure

- `src/` - Source code for all MCP servers
  - `character-mcp-server/` - Character management
  - `plot-mcp-server/` - Plot and timeline management
  - `research-mcp-server/` - Research and continuity tracking
  - `world-mcp-server/` - World building elements
  - `writing-mcp-server/` - Writing production management
- `docs/` - Additional documentation
- `tests/` - Test files
- `.env.template` - Template for environment variables
- `init.sql` - Complete database initialization script
- `README.md` - Project documentation

## Key Features

### Character Knowledge Tracking
- Track what each character knows at any point in the story
- Manage knowledge states (knows, suspects, unaware, etc.)
- Control how characters can reference information
- Validate scene dialogue against character knowledge

### Story Structure Validation
- Ensure proper beat placement in chapters
- Track chapter structure elements
- Validate scene chronology
- Monitor plot thread progression

### Timeline Management
- Create and track timeline events
- Monitor character movements
- Validate chronological consistency
- Generate chapter chronology reports

### Writing Progress Tracking
- Set daily and weekly word count goals
- Track writing session productivity
- Monitor chapter and book completion
- Generate progress analytics

## Additional Documentation

For more detailed information, see:
- [Character Knowledge Tracker Guide](docs/character-knowledge-tracker-guide.md)
- [Story Structure Validator Guide](docs/story-structure-validator-guide.md)
- [Docker Database Guide](docs/docker-database-guide.md)
- [Running Instructions](docs/running-instructions.md)

## Database Management

### Initial Setup
The complete database schema is contained in `init.sql`. This single file includes all necessary tables, views, functions, and indexes. To initialize the database:

Using Docker:
```bash
pwsh .\db-docker-tools.ps1 -setup
```

Using existing PostgreSQL:
```sql
psql -U your_user -d your_database -f init.sql
```

### Backing Up Data
Use the provided Docker tools script:
```bash
pwsh .\db-docker-tools.ps1 -backup
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check connection settings
   - Run `test-db-connection.js`

2. **Server Start-up Issues**
   - Ensure all required ports are available
   - Check if database migrations are up to date
   - Verify Node.js version

3. **Claude Desktop Integration**
   - Confirm MCP server configurations
   - Check server endpoints are accessible
   - Verify authentication settings if enabled

## Development

To start all MCP servers for development:

```bash
npm run start-all
```

Or start individual servers:

```bash
npm run start-character
npm run start-plot
npm run start-research
npm run start-world
npm run start-writing
```

## Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
