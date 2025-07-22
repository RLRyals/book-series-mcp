# Setting Up Your AI Writing Team with Voice Integration

This guide will walk you through setting up a team of AI writing personas in Claude, complete with ElevenLabs voice integration. This creates an immersive writing room experience where each team member has their own voice and specialization.

## Prerequisites

1. A Claude project (Claude Desktop or web interface)
2. An ElevenLabs account with API key (get one at https://elevenlabs.io/app/settings/api-keys)
3. Book Series MCP server set up and running
4. PostgreSQL database

## Step 1: Database Setup

First, create the necessary database tables for voice integration. Run the following SQL:

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
    UNIQUE(series_id, persona_name)
);

-- Add necessary indexes
CREATE INDEX IF NOT EXISTS idx_character_voices_character_id ON character_voices(character_id);
CREATE INDEX IF NOT EXISTS idx_voice_library_character_id ON voice_library(character_id);
CREATE INDEX IF NOT EXISTS idx_persona_voice_mappings_series ON persona_voice_mappings(series_id);
```

## Step 2: Create Your Writing Team Personas

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

### Optional Specialist Roles

Add these based on your specific needs:

6. **THE TECHNICAL CONSULTANT**
   - Role: Specialized knowledge (legal, medical, etc.)
   - Voice Type: Professional, precise

7. **THE STYLE EXPERT**
   - Role: Prose quality, voice consistency
   - Voice Type: Artistic, flowing

8. **THE PROCESS MANAGER**
   - Role: Documentation, workflow optimization
   - Voice Type: Systematic, organized

## Step 3: Voice Setup in ElevenLabs

1. Log into your ElevenLabs account
2. Create a new voice for each persona:
   - Use the Voice Lab
   - Upload samples that match the desired personality
   - Note down the Voice ID for each created voice

## Step 4: Configure Persona Voice Mappings

For each persona, create a voice mapping in your database:

```sql
INSERT INTO persona_voice_mappings 
(persona_name, voice_id, voice_description, voice_settings)
VALUES 
('SHOWRUNNER', 'your-voice-id-here', 'Confident, authoritative voice for final decisions',
 '{"stability": 0.7, "similarity_boost": 0.7, "speed": 1.1}'::jsonb);
```

## Step 5: Create Claude System Instructions

Create a system instructions file with your team setup. Here's a template:

```markdown
# AI WRITING ROOM: TEAM CONFIGURATION

## Writing Team Personas

### **THE SHOWRUNNER** 🎭
*Voice: Confident, authoritative (ElevenLabs Voice ID: [your-id-here])*
**Role:** [Detailed role description]
**MCP Tools:** [List relevant tools]

[Repeat for each team member...]

## System Protocols

### Core Mechanics:
- **ALWAYS** start responses with persona name in bold: "**SHOWRUNNER:**"
- Each persona maintains consistent voice and expertise
- Use \`speak_as_persona\` for voice delivery when appropriate
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
\`\`\`
speak_as_persona("PERSONA_NAME", "text to speak")
\`\`\`
```

## Step 6: Integration Testing

Test your setup with these prompts:

1. "Have the Showrunner explain our current project status"
2. "Ask the World Builder to describe our magic system"
3. "Let the Character Expert analyze our protagonist"

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
   - Verify ElevenLabs API key
   - Check voice IDs are correct
   - Confirm proper audio directory setup

2. **Workflow Problems**
   - Review persona role definitions
   - Clarify decision hierarchy
   - Document process changes

3. **Performance Optimization**
   - Monitor database query performance
   - Cache frequently used audio
   - Optimize voice settings for quality/speed balance
