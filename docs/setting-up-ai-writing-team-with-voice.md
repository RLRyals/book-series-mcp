# Setting Up Your AI Writing Team with Voice Integration

This guide will walk you through setting up a team of AI writing personas in Claude, complete with ElevenLabs voice integration. This creates an immersive writing room experience where each team member has their own voice and specialization.

## Prerequisites

1. A Claude project (Claude Desktop or web interface)
2. An ElevenLabs account with API key (get one at https://elevenlabs.io/app/settings/api-keys)
   - There is a free tier with 10k credits per month
3. Book Series MCP server set up and running
4. PostgreSQL database
5. Node.js installed on your system

## Step 1: Install Required Dependencies

First, you need to install the necessary packages for ElevenLabs integration:

1. Open your terminal and navigate to your Book Series MCP project directory

2. Install the required Node.js packages:
   ```bash
   npm install elevenlabs node-fetch dotenv @modelcontextprotocol/sdk
   ```

3. If you want to use the ElevenLabs CLI tools (optional but recommended):
   ```bash
   # On Windows with PowerShell:
   iwr -useb https://astral.sh/uv/install.ps1 | iex
   
   # Add UV to your PATH (if not automatically added)
   $env:PATH += ";$env:USERPROFILE\.local\bin"
   
   # Install the ElevenLabs MCP package
   pip install elevenlabs-mcp
   ```

4. Verify the installation:
   ```bash
   # For Node.js packages
   npm list elevenlabs
   
   # For ElevenLabs MCP (if installed)
   uvx elevenlabs-mcp --version
   ```

## Step 2: Database Setup

Create the necessary database tables for voice integration. Run the following SQL:

```sql
-- Table for storing character voice profiles
CREATE TABLE IF NOT EXISTS character_voices (
    id SERIAL PRIMARY KEY,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    voice_id VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    voice_settings JSONB DEFAULT '{}'::jsonb,
    sample_audio_path VARCHAR(255),
    UNIQUE(character_id, voice_id)
);

-- Table for voice library
CREATE TABLE IF NOT EXISTS voice_library (
    id SERIAL PRIMARY KEY,
    voice_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    character_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}'::TEXT[],
    voice_settings JSONB DEFAULT '{}'::jsonb
);

-- Table for Claude persona voice mappings
CREATE TABLE IF NOT EXISTS persona_voice_mappings (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    persona_name VARCHAR(255) NOT NULL,
    voice_id VARCHAR(255),
    voice_description TEXT,
    sample_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    voice_settings JSONB DEFAULT '{}'::jsonb,
    model_id VARCHAR(255) DEFAULT 'eleven_flash_v2_5',
    UNIQUE(series_id, persona_name)
);

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS idx_character_voices_character_id ON character_voices(character_id);
CREATE INDEX IF NOT EXISTS idx_voice_library_character_id ON voice_library(character_id);
CREATE INDEX IF NOT EXISTS idx_persona_voice_mappings_series ON persona_voice_mappings(series_id);
```

## Step 3: Configure Environment Variables

Create or update your `.env` file with ElevenLabs configuration:

```bash
# ElevenLabs TTS Configuration
AUDIO_OUTPUT_DIRECTORY=/app/audio_output
ELEVENLABS_MCP_PORT=3008
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_DEFAULT_MODEL=eleven_flash_v2_5  # Fastest, cheapest
# Alternative: eleven_turbo_v2_5 for better quality
```

## Step 4: Create Directory Structure

Set up the necessary audio directories:

```bash
# Run this in your project root
mkdir -p audio/persona-responses audio/character-voices audio/book-readings audio/soundscapes
```

Or use the provided setup script if available:

```bash
node setup-elevenlabs-integration.js
```

## Step 5: Create Your Writing Team Personas

### Core Team Template

Here's a template for essential writing team roles. Customize these according to your project needs:

1. **THE SHOWRUNNER** 
   - Role: Overall narrative direction, final decisions, team coordination
   - Voice Type: Confident, authoritative
   - MCP Tools: Book Series Manager, Plot Management System

2. **THE EDITOR**
   - Role: Structure, pacing, clarity, consistency
   - Voice Type: Precise, analytical
   - MCP Tools: Writing Production Manager

3. **THE WORLD BUILDER**
   - Role: Setting consistency, rules, systems
   - Voice Type: Methodical, academic
   - MCP Tools: World Building Manager, Research System

4. **THE CHARACTER EXPERT**
   - Role: Character consistency, psychology, relationships
   - Voice Type: Thoughtful, empathetic
   - MCP Tools: Character Development Tracker

5. **THE FIRST DRAFTER**
   - Role: Raw content generation, scene writing
   - Voice Type: Energetic, creative
   - MCP Tools: Writing Production Manager

## Step 6: Voice Setup in ElevenLabs

1. Log into your ElevenLabs account (https://elevenlabs.io/app)
2. Navigate to Voice Library (https://elevenlabs.io/app/voice-library)
3. Create a new voice for each persona:
   - Click "Add Voice"
   - Choose "Professional" for high-quality output
   - Upload samples that match the desired personality (or use ElevenLabs presets)
   - Adjust settings: Name the voice after your persona
   - Click "Create" and wait for processing
   - Note down the Voice ID for each created voice (click on the voice and look at the URL - the ID is the string after /voice/)

Example Voice IDs from ElevenLabs presets:
- Authoritative: TgFfYvRjAS9S0iz0tf6x (Rachel)
- Analytical: ThT5KcBeYPX3keUQqHPh (Emily)
- Energetic: uYXf8XasLslADfZ2MB4u (Matilda)
- Professional: Q25Ap1kpdO8Q2MyJ7mpk (Serena)
- Thoughtful: EkK5I93UQWFDigLMpZcX (Adam)

## Step 7: Configure Persona Voice Mappings

For each persona, create a voice mapping in your database:

```sql
INSERT INTO persona_voice_mappings 
(persona_name, voice_id, voice_description, voice_settings, model_id)
VALUES 
('SHOWRUNNER', 'TgFfYvRjAS9S0iz0tf6x', 'Confident, authoritative voice for final decisions',
 '{"stability": 0.7, "similarity_boost": 0.7, "speed": 1.1}'::jsonb, 'eleven_flash_v2_5');
```

Or use the MCP tools to create the mappings programmatically:

```javascript
// Example call to create persona voice mapping
await server.callTool('create_persona_voice_map', {
  persona_name: 'SHOWRUNNER',
  voice_id: 'TgFfYvRjAS9S0iz0tf6x',
  voice_description: 'Confident, authoritative voice for final decisions',
  model_id: 'eleven_flash_v2_5'
});
```

## Step 8: Configure Claude System Instructions

Create a system instructions file with your team setup. Here's a template:

```markdown
# AI WRITING ROOM: TEAM CONFIGURATION

## Writing Team Personas

### **SHOWRUNNER** 🎭
*Voice: Confident, authoritative (ElevenLabs Voice ID: TgFfYvRjAS9S0iz0tf6x)*

*"We need to connect these plot threads across the arc. Remember what we established earlier."*

**Role:** Plot arc continuity, narrative direction, final decisions, team coordination
**MCP Tools:** Book Series Manager, Plot Management System
**Voice Integration:** Uses `speak_as_persona` tool to deliver decisions with authority

### **EDITOR** ✏️
*Voice: Precise, analytical (ElevenLabs Voice ID: ThT5KcBeYPX3keUQqHPh)*

*"This scene is dragging. Cut the exposition and get to the action."*

**Role:** Structure, pacing, clarity, consistency, cutting unnecessary material
**MCP Tools:** Writing Production Manager
**Voice Integration:** Delivers feedback with precision and clarity

[Repeat for each team member...]

## System Protocols

### Core Mechanics:
- **ALWAYS** start responses with persona name in bold: "**SHOWRUNNER:**"
- Each persona maintains consistent voice and expertise
- Use `speak_as_persona` for voice delivery when appropriate
- End with "PASS TO: [PERSONA]" to indicate next in workflow
- Only SHOWRUNNER can declare "SECTION COMPLETE"

### Voice Integration Protocols:

#### WHEN TO USE VOICE
- Critical decisions
- Creative breakthroughs
- Important corrections
- Process improvements
- User requests for voice

#### VOICE COMMAND SYNTAX
```
speak_as_persona({
  "persona_name": "PERSONA_NAME", 
  "text": "text to speak"
})
```
```

## Step 9: Start the ElevenLabs Integration Server

Add this to your package.json:

```json
"scripts": {
  "start:elevenlabs": "node ./src/elevenlabs-persona/index.js"
}
```

Then run the server:

```bash
npm run start:elevenlabs
```

## Step 10: Configure Claude Desktop (for desktop app users)

1. Enable Developer Mode in Claude Desktop:
   - Click on "Help" in the hamburger menu at the top left
   - Select "Enable Developer Mode"

2. Go to Claude > Settings > Developer > Edit Config > claude_desktop_config.json

3. Add the ElevenLabs MCP configuration alongside your existing Book Series MCP:

```json
{
  "mcpServers": {
    "BookSeries": {
      "command": "node",
      "args": ["./run-writing-production-server.js"],
      "cwd": "/path/to/your/book-series-mcp"
    },
    "ElevenLabs": {
      "command": "node",
      "args": ["./src/elevenlabs-persona/index.js"],
      "cwd": "/path/to/your/book-series-mcp"
    }
  }
}
```

For web interface users (Claude.ai or Typing Mind), the MCP servers will be set up by your administrator.

## Step 11: Integration Testing

Test your setup with these prompts:

1. "Have the Showrunner explain our current project status"
2. "Ask the World Builder to describe our setting"
3. "Let the Character Expert analyze our protagonist"
4. "Test the Editor's voice with a sample critique"

## Best Practices

1. **Voice Consistency**
   - Each persona should have distinct speech patterns
   - Maintain consistent terminology per role
   - Use voice for emphasis and important moments

2. **Workflow Management**
   - Clear handoffs between personas
   - Structured review process
   - Documentation of decisions

3. **Resource Optimization**
   - Monitor ElevenLabs credit usage
   - Cache frequently used voice responses
   - Use voice selectively for impact

4. **Team Dynamics**
   - Allow constructive disagreement between personas
   - Maintain clear role boundaries
   - Follow the chain of command (Showrunner has final say)

## Troubleshooting

Common issues and solutions:

1. **Voice Integration Issues**
   - Verify ElevenLabs API key in your .env file
   - Check voice IDs are correctly copied from ElevenLabs
   - Confirm proper audio directory setup and permissions

2. **MCP Connection Issues**
   - Make sure all servers are running
   - Check port configurations
   - Verify claude_desktop_config.json format

3. **Workflow Problems**
   - Review persona role definitions
   - Clarify decision hierarchy
   - Document process changes

4. **Performance Optimization**
   - Monitor database query performance
   - Cache frequently used audio
   - Optimize voice settings for quality/speed balance
