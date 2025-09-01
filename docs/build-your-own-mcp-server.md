# Building Your Own MCP Server for Authors

This tutorial will walk you through creating your own Model Context Protocol (MCP) server system for managing complex writing projects, using our book series management system as an example. We'll show you how to build a similar system and extend it for your specific needs, such as tracking genre-specific tropes or complex character relationships.

## Part 1: Understanding MCP Servers

### What is an MCP Server?
An MCP server is a specialized tool that helps AI assistants like Claude understand and manage specific types of information. For authors, this means you can create tools to track:
- Character relationships and development
- Plot threads and story structure
- World-building elements
- Research and continuity
- Writing progress
- Genre-specific elements (like romance arcs or mystery clues)

### Basic Architecture
Our system uses:
- Node.js for the server code
- PostgreSQL for the database
- Multiple specialized servers for different aspects of writing

## Part 2: Setting Up Your Development Environment

### Step 1: Install Essential Software
1. Install Visual Studio Code from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install Node.js (v16 or higher) from [nodejs.org](https://nodejs.org/)
3. Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

### Step 2: Set Up Development Tools

1. Set up GitHub Copilot:
   - First, you'll need:
     - A GitHub account (create one at github.com if needed)
     - You do not need a GitHub Copilot subscription. (You can use API keys.)
   
   - Install GitHub Copilot in VS Code:
     - Open VS Code
     - Click the Extensions icon (or press Ctrl+Shift+X)
     - Search for "GitHub Copilot"
     - Install both "GitHub Copilot" and "GitHub Copilot Chat"
   
   - Sign in and authorize:
     - Click the Accounts icon in VS Code (or press Ctrl+Shift+P and type "Accounts")
     - Select "Turn on GitHub Copilot"
     - Sign in to GitHub when prompted
     - Authorize VS Code to use GitHub Copilot
     - Wait for the "GitHub Copilot is enabled" notification
   
   - Verify installation:
     - Open a new JavaScript file (.js extension)
     - Type a comment describing a simple function
     - If Copilot is working, you'll see ghost text suggestions
     - Press Tab to accept a suggestion

   - Set up custom models:
     - Manage Models
     - Select a provider
     - Enter API key

2. Create Your Project:
   ```bash
   # Create your project folder
   mkdir my-writing-assistant
   cd my-writing-assistant
   
   # Initialize a new Node.js project
   npm init -y
   ```

### Step 3: Configure Environment Variables

1. Create a `.env` file in your project root:
   ```bash
   touch .env
   ```

2. Add your database configuration to `.env`:
   ```plaintext
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=writing_assistant
   DB_USER=writer
   DB_PASSWORD=my_secure_password  # Change this to a strong password

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

3. Add `.env` to your `.gitignore` file:
   ```bash
   echo ".env" >> .gitignore
   ```

4. Install the dotenv package:
   ```bash
   npm install dotenv
   ```

### Step 4: Set Up Docker Compose
Create a new file called `docker-compose.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: writing_assistant
      POSTGRES_USER: writer
      POSTGRES_PASSWORD: my_secure_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Step 4: Create Basic Database Structure
1. Create a `src` folder for your code:
   ```bash
   mkdir src
   ```

2. Create an initialization script `src/init.sql`:
   ```sql
   -- Basic tables needed to start
   CREATE TABLE characters (
       id SERIAL PRIMARY KEY,
       name VARCHAR(100) NOT NULL,
       description TEXT
   );

   CREATE TABLE chapters (
       id SERIAL PRIMARY KEY,
       title VARCHAR(200),
       sequence_number INTEGER
   );
   ```

## Part 3: Creating Your First MCP Server

### Step 1: Create the Base Server
Create a simple MCP server that Claude can connect to:

1. Install required packages:
   ```bash
   npm install express pg dotenv
   ```

2. Create `src/base-server.js`:
   ```javascript
   require('dotenv').config();
   const express = require('express');
   const { Pool } = require('pg');

   class BaseMCPServer {
       constructor(port) {
           this.port = port || process.env.PORT;
           this.app = express();
           this.pool = new Pool({
               host: process.env.DB_HOST,
               database: process.env.DB_NAME,
               user: process.env.DB_USER,
               password: process.env.DB_PASSWORD,
               port: process.env.DB_PORT
           });
       }

       async start() {
           this.app.use(express.json());
           
           // Basic health check endpoint
           this.app.get('/health', (req, res) => {
               res.json({ status: 'ok' });
           });

           this.app.listen(this.port, () => {
               console.log(`Server running on port ${this.port}`);
           });
       }
   }

   module.exports = BaseMCPServer;
   ```

### Step 2: Create Your First Endpoint
Create `src/index.js`:

```javascript
const BaseMCPServer = require('./base-server');

const server = new BaseMCPServer(3000);

// Add a simple character endpoint
server.app.post('/character', async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await server.pool.query(
            'INSERT INTO characters (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

server.start();
```

## Part 4: Testing Your Server

### Step 1: Start Your Services
1. Start the database:
   ```bash
   docker-compose up -d
   ```

2. Initialize the database:
   ```bash
   # Connect to the database and run the init script
   docker exec -i writing-assistant-db psql -U writer -d writing_assistant < src/init.sql
   ```

3. Start your server:
   ```bash
   node src/index.js
   ```

### Step 2: Configure Claude Desktop
1. Open Claude Desktop settings
2. Add your MCP server configuration:
   ```json
   {
     "mcpServers": {
       "writing-assistant": {
         "command": "node",
         "args": ["src/index.js"],
         "env": {
           "NODE_ENV": "development",
           "PORT": "3000"
         }
       }
     }
   }
   ```

### Step 3: Test Basic Functionality
Try these basic commands with Claude:
1. Create a character
2. Retrieve character information
3. Verify the database connection

## Part 5: Adding More Features
Once your basic server is working, you can start adding more functionality:

2. Define relationship states and types:
```javascript
const RELATIONSHIP_STATES = {
    MUTUAL_INTEREST: 'mutual_interest',
    ONE_SIDED: 'one_sided',
    COMPLICATED: 'complicated',
    COMMITTED: 'committed',
    BROKEN_UP: 'broken_up',
    RECONCILED: 'reconciled'
};

const RELATIONSHIP_TYPES = {
    ROMANTIC: 'romantic',
    QUEERPLATONIC: 'queerplatonic',
    POLYAMOROUS: 'polyamorous'
};
```

3. Create relationship tracking functions:
```javascript
async function trackRelationshipMilestone(relationshipId, milestone) {
    // Track important moments in the relationship
}

async function analyzeRelationshipDynamics(characterIds) {
    // Analyze interactions between characters
}
```

## Part 5: Integrating with Claude Desktop

1. Configure your server in Claude Desktop:
```json
{
  "mcpServers": {
    "romance-tracker": {
      "command": "node",
      "args": ["path/to/your/romance-server/index.js"],
      "env": {
        "NODE_ENV": "development",
        "DATABASE_URL": "your-database-url",
        "MCP_PORT": "3006"
      }
    }
  }
}
```

2. Test your server's functionality with Claude

## Part 6: Best Practices

### Data Validation
Always validate your data:
```javascript
function validateRelationship(relationshipData) {
    if (!relationshipData.characters || relationshipData.characters.length < 2) {
        throw new Error('Relationship must involve at least 2 characters');
    }
    // More validation rules
}
```

### Error Handling
Implement robust error handling:
```javascript
try {
    await trackRelationshipMilestone(relationshipId, milestone);
} catch (error) {
    console.error('Failed to track relationship milestone:', error);
    // Handle error appropriately
}
```

### Database Management
- Use migrations for all database changes
- Back up your data regularly
- Use transactions for related changes

## Part 7: Examples of Specialized Servers

### Romance Arc Server
Tracks:
- Character relationships
- Relationship milestones
- Tension and conflict
- Resolution arcs

### Mystery Clue Server
Tracks:
- Evidence and clues
- Suspect motivations
- Red herrings
- Resolution paths

### Character Development Server
Tracks:
- Character growth
- Relationship dynamics
- Personal arcs
- Internal conflicts

## Next Steps

1. Start with a single specialized server
2. Test thoroughly with sample data
3. Gradually add more features
4. Connect with other servers as needed
5. Back up your data regularly

## Common Issues and Solutions

### Database Connection Issues
```powershell
# Test your database connection
node test-db-connection.js
```

### Server Start-up Problems
- Check port availability
- Verify environment variables
- Ensure database is running

## Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MCP Protocol Specification](https://github.com/anthropic-labs/mcp-spec)

## Conclusion

Building your own MCP server system allows you to create powerful tools specifically designed for your writing needs. Start small, test thoroughly, and expand as needed. Remember to:

1. Plan your data structure carefully
2. Implement proper validation
3. Handle errors gracefully
4. Back up your data regularly
5. Document your system

For more examples and detailed code, check our repository's `/examples` directory.
