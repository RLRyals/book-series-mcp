// src/research-mcp-server/character-knowledge-tools.js
// MCP Tools for character knowledge state tracking

export const characterKnowledgeTools = [
    {
        name: 'set_character_knowledge_state',
        description: 'Track what a character knows at a specific story point',
        inputSchema: {
            type: 'object',
            properties: {
                character_id: { type: 'integer', description: 'Character ID' },
                book_id: { type: 'integer', description: 'Book ID' },
                chapter_id: { type: 'integer', description: 'Chapter ID' },
                knowledge_item: { type: 'string', description: 'The specific information or knowledge being tracked' },
                knowledge_state: { 
                    type: 'string', 
                    description: 'Knowledge state',
                    enum: ['knows', 'knows_with_oz_protection', 'suspects', 'unaware', 'memory_gap']
                },
                source: { type: 'string', description: 'How the character learned this information' },
                confidence_level: { 
                    type: 'string', 
                    description: 'How certain the character is about this knowledge',
                    enum: ['certain', 'probable', 'suspected']
                },
                can_act_on: { type: 'boolean', description: 'Whether the character can act on this information', default: true },
                can_reference_directly: { type: 'boolean', description: 'Whether the character can directly reference this information', default: true },
                can_reference_indirectly: { type: 'boolean', description: 'Whether the character can indirectly reference this information', default: true },
                restrictions: { type: 'string', description: 'Any specific limitations on how the character can use this knowledge' },
                internal_thought_ok: { type: 'boolean', description: 'Whether the character can reference this in internal thoughts', default: true },
                dialogue_restriction: { type: 'string', description: 'Specific restrictions on how this can be used in dialogue' }
            },
            required: ['character_id', 'book_id', 'chapter_id', 'knowledge_item', 'knowledge_state']
        }
    },
    {
        name: 'check_character_can_reference',
        description: 'Validate if a character can reference specific information at a given point in the story',
        inputSchema: {
            type: 'object',
            properties: {
                character_id: { type: 'integer', description: 'Character ID' },
                knowledge_item: { type: 'string', description: 'The specific information or knowledge being checked' },
                at_chapter: { type: 'integer', description: 'Chapter ID to check knowledge state at' }
            },
            required: ['character_id', 'knowledge_item', 'at_chapter']
        }
    },
    {
        name: 'get_character_knowledge_state',
        description: 'Get the complete knowledge state for a character at a specific point in the story',
        inputSchema: {
            type: 'object',
            properties: {
                character_id: { type: 'integer', description: 'Character ID' },
                chapter_id: { type: 'integer', description: 'Chapter ID to get knowledge state at' }
            },
            required: ['character_id', 'chapter_id']
        }
    },
    {
        name: 'validate_scene_against_knowledge',
        description: 'Validate if scene dialogue/thoughts respect character knowledge boundaries',
        inputSchema: {
            type: 'object',
            properties: {
                character_id: { type: 'integer', description: 'Character ID' },
                chapter_id: { type: 'integer', description: 'Chapter ID where the scene occurs' },
                scene_content: { type: 'string', description: 'The content of the scene to validate' },
                content_type: { 
                    type: 'string', 
                    description: 'Type of content',
                    enum: ['dialogue', 'internal_thought', 'narration'],
                    default: 'dialogue'
                }
            },
            required: ['character_id', 'chapter_id', 'scene_content']
        }
    }
];
