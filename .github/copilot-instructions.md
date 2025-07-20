# Book Series MCP - AI Assistant Guide

This is a Model Context Protocol (MCP) server system for managing complex book series writing projects. The system provides specialized servers for character management, plot tracking, world-building, research/continuity tracking, and writing production management.

## Key Architecture Components

### Server Architecture
- **Base Server (`src/shared/base-server.js`)**: Core MCP server functionality, used by all specialized servers
- **Database Layer (`src/shared/database.js`)**: Common database management with connection pooling and transaction support
- **Specialized Servers**:
  - Writing Production (`src/writing-server/`): Writing progress, goals, story structure
  - Character Server (`src/character-server/`): Character profiles and development
  - Plot Server (`src/plot-server/`): Plot threads and timeline management
  - World Server (`src/world-server/`): World-building elements
  - Research Server (`src/research-server/`): Continuity and knowledge tracking

### Important System Patterns

1. **Knowledge State Tracking**
   ```sql
   -- Example from character_knowledge_states table
   knowledge_state VARCHAR(100), -- knows, suspects, unaware, memory_gap, knows_with_oz_protection
   ```

2. **Story Structure Validation**
   ```javascript
   // See: src/writing-server/controllers/story-structure-controller.js
   validateChapterPlan({
     initial_goal, disturbance, new_goal,
     complications, turning_point, choice, consequences
   })
   ```

3. **Timeline Chronology**
   ```javascript
   // See: src/plot-server/controllers/timeline-chronology-controller.js
   validateEvent({event_datetime, character_ids, location_id})
   ```

## Development Workflow

### Setting Up Development Environment

1. **Database Setup** (Using Docker - Recommended):
   ```powershell
   pwsh .\db-docker-tools.ps1 -setup
   ```

2. **Running Migrations**:
   ```powershell
   pwsh .\db-docker-tools.ps1 -Command run-migration -MigrationFile <migration_file>
   ```

3. **Starting MCP Servers**:
   ```bash
   npm run start:character   # Port 3001
   npm run start:plot       # Port 3002
   npm run start:world      # Port 3003
   npm run start:writing    # Port 3004
   npm run start:research   # Port 3005
   ```

### Testing & Debugging

- **Key Test Files**:
  - `tests/character-knowledge-tracker-test.js`
  - `tests/story-structure-validator-test.js`
  - `tests/fix-analytics-test.js`

- **Logs and Error Handling**: Use `DEBUG=true` for detailed database operation logs

### Common Issues & Solutions

1. **PostgreSQL ROUND Function**: Always use proper type casting with numeric:
   ```sql
   ROUND((value::numeric / divisor::numeric) * 100.0, 2)
   ```

2. **Database Connection**: Verify Docker container status:
   ```powershell
   pwsh .\db-docker-tools.ps1 -Command status
   ```

## Integration Points

1. **Claude Desktop Configuration**:
   - Configure MCP servers in Claude Desktop's developer settings
   - Each server needs unique port and DATABASE_URL

2. **Database Schema**:
   - All migrations in `migrations/` folder must be applied in order
   - Key tables: character_knowledge_states, chapter_structure_plans, timeline_events

3. **Cross-Server Communication**:
   - Servers share common database pool
   - Use BaseMCPServer class for consistent behavior
   - Each server has dedicated port and tools

## Project-Specific Conventions

1. **Knowledge State Management**:
   - Always check character existence before setting knowledge
   - Use defined enum values for knowledge_state
   - Include source and confidence_level

2. **Story Structure**:
   - Follow 7-point story structure (goal → disturbance → new_goal → complications → turning_point → choice → consequences)
   - All structural elements must be validated

3. **Timeline Management**:
   - Events must include datetime and character_ids
   - Always validate chronological consistency
   - Use character_status_snapshots for point-in-time queries
