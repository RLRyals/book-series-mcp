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
- Text-to-Speech Generation with ElevenLabs Integration

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

1. Install Docker:
   - Visit [Docker Desktop's download page](https://www.docker.com/products/docker-desktop)
   - Download Docker Desktop for Windows
   - Run the installer and follow the installation wizard
   - During installation:
     - If prompted about WSL 2, allow Docker to install it
     - Accept the default settings
   - Restart your computer after installation

2. Start Docker:
   - Launch Docker Desktop from your Start menu
   - Wait for the Docker icon in your system tray to stop animating (this means Docker is ready)
   - You can verify Docker is running by:
     - Right-clicking the Docker icon in the system tray
     - It should say "Docker Desktop is running" with a green check mark

3. Run the database setup script:
```bash
pwsh .\db-docker-tools.ps1 -setup
```

This will:
- Create a Docker container with PostgreSQL
- Initialize the database with the schema
- Set up all necessary tables and views

Additional Docker database management commands:
```powershell
# Check database status
pwsh .\db-docker-tools.ps1 -Command status

# Connect to database directly
pwsh .\db-docker-tools.ps1 -Command connect

# Backup the database
pwsh .\db-docker-tools.ps1 -Command backup

# Test connection
pwsh .\db-docker-tools.ps1 -Command test-connection

# Run specific migration
pwsh .\db-docker-tools.ps1 -Command run-migration -MigrationFile <migration_file>
```

You can customize the Docker setup using these environment variables in your `.env` file:
```env
POSTGRES_DOCKER_CONTAINER=book-series-db
POSTGRES_DOCKER_PORT=5432
POSTGRES_DOCKER_PASSWORD=your_docker_password_here
```

### Option B: Using existing PostgreSQL installation
(This option doesn't require Docker or any Docker-related files)

1. Create a new database in your PostgreSQL instance:
```sql
CREATE DATABASE book_series;
```

2. Create a new user with appropriate permissions:
```sql
CREATE USER writer WITH PASSWORD 'secure_writing_password_2025';
GRANT ALL PRIVILEGES ON DATABASE book_series TO writer;
```

3. Run the initialization script:
```sql
psql -U writer -d book_series -f init.sql
```

4. Apply any necessary migrations from the `migrations` folder in order:
```sql
psql -U writer -d book_series -f migrations/20250701_add_character_knowledge_states.sql
psql -U writer -d book_series -f migrations/20250702_add_story_structure_validator.sql
# ... and so on for other migration files
```

5. Test the database connection:
```bash
node test-db-connection.js
```

Make sure your `.env` file has the correct PostgreSQL connection details:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=book_series
DB_USER=writer
DB_PASSWORD=secure_writing_password_2025
```

Note: When using this option, you can ignore the `docker-compose.yml` and other Docker-related files in the project as they are only needed for Option A.

## Setting Up MCP Servers in Claude Desktop

1. Open Claude Desktop
2. Go to Settings under File -> Settings
3. In the settings, go to the Developer tab
4. Select Edit Config. Replace or edit the configuration with this:

```json
{
  "mcpServers": {
    "writing-production": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/writing-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "character-development": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/character-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "plot-management": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/plot-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "world-building": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/world-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "research-continuity": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/research-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "book-series-manager": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series"
      }
    },
    "elevenlabs-persona-voices": {
      "command": "node",
      "args": ["path/to/book-series-mcp/src/elevenlabs-persona/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://writer:secure_writing_password_2025@localhost:5432/book_series",
        "ELEVENLABS_API_KEY": "sk_your11labskey_goes_here",
        "ELEVENLABS_MCP_BASE_PATH": "path/to/book-series-mcp",
        "ELEVENLABS_PERSONA_AUDIO_PATH": "path/to/book-series-mcp/audio/persona-responses",
        "ELEVENLABS_DEFAULT_VOICE_ID": "IRHApOXLvnW57QJPQH2P",
        "ELEVENLABS_DEFAULT_MODEL": "eleven_flash_v2_5"
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
- [Integrating ElevenLabs MCP](docs/integrating-elevenlabs-mcp.md)

## ElevenLabs Integration

This project includes integration with the ElevenLabs MCP for text-to-speech capabilities. To set up the integration:

```bash
# Install ElevenLabs MCP
pip install elevenlabs-mcp

# Set up integration
node setup-elevenlabs-integration.js
```

For detailed setup instructions, see the [ElevenLabs Integration Guide](docs/integrating-elevenlabs-mcp.md).

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
