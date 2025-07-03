// src/character-server/index.js - Character Development MCP Server
import { BaseMCPServer } from '../shared/base-server.js';

class CharacterDevelopmentServer extends BaseMCPServer {
    constructor() {
        super('character-development-server', '1.0.0');
        
        this.tools = [
            {
                name: 'create_character',
                description: 'Create a new character in the series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        name: { type: 'string', description: 'Character name' },
                        character_type: { 
                            type: 'string', 
                            description: 'Type: protagonist, antagonist, supporting, victim, suspect, witness',
                            enum: ['protagonist', 'antagonist', 'supporting', 'victim', 'suspect', 'witness', 'informant', 'colleague']
                        },
                        species: { type: 'string', description: 'Human, non-human, hybrid, etc.' },
                        occupation: { type: 'string', description: 'Character occupation' },
                        department: { type: 'string', description: 'Police department or organization' },
                        rank_title: { type: 'string', description: 'Professional rank/title' },
                        badge_number: { type: 'string', description: 'Police badge number' },
                        age: { type: 'integer', description: 'Character age' },
                        physical_description: { type: 'string', description: 'Physical appearance' },
                        personality_traits: { type: 'string', description: 'Key personality traits' },
                        background_story: { type: 'string', description: 'Character background' },
                        secrets: { type: 'string', description: 'Hidden aspects of character' },
                        abilities: { type: 'string', description: 'Special skills, powers, etc.' },
                        weaknesses: { type: 'string', description: 'Character weaknesses or vulnerabilities' },
                        goals: { type: 'string', description: 'Character goals and motivations' },
                        moral_alignment: { 
                            type: 'string', 
                            description: 'Moral alignment',
                            enum: ['lawful_good', 'neutral_good', 'chaotic_good', 'lawful_neutral', 'true_neutral', 'chaotic_neutral', 'lawful_evil', 'neutral_evil', 'chaotic_evil']
                        },
                        importance_level: { type: 'integer', description: 'Importance (1-10)', minimum: 1, maximum: 10, default: 5 },
                        aliases: { type: 'array', items: { type: 'string' }, description: 'Alternate names/identities' }
                    },
                    required: ['series_id', 'name', 'character_type']
                }
            },
            {
                name: 'update_character',
                description: 'Update character information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer', description: 'Character ID' },
                        name: { type: 'string' },
                        physical_description: { type: 'string' },
                        personality_traits: { type: 'string' },
                        background_story: { type: 'string' },
                        secrets: { type: 'string' },
                        abilities: { type: 'string' },
                        goals: { type: 'string' },
                        moral_alignment: { type: 'string' },
                        status: { 
                            type: 'string',
                            enum: ['active', 'deceased', 'missing', 'retired', 'imprisoned', 'unknown']
                        }
                    },
                    required: ['character_id']
                }
            },
            {
                name: 'get_characters',
                description: 'Get characters for a series with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        character_type: { type: 'string', description: 'Filter by character type' },
                        status: { type: 'string', description: 'Filter by status' },
                        importance_min: { type: 'integer', description: 'Minimum importance level' },
                        search_name: { type: 'string', description: 'Search by name' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'create_relationship',
                description: 'Create a relationship between two characters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character1_id: { type: 'integer', description: 'First character ID' },
                        character2_id: { type: 'integer', description: 'Second character ID' },
                        relationship_type: { 
                            type: 'string', 
                            description: 'Type of relationship',
                            enum: ['partner', 'colleague', 'friend', 'enemy', 'family', 'mentor', 'romantic', 'informant', 'suspect', 'victim']
                        },
                        relationship_subtype: { type: 'string', description: 'More specific relationship details' },
                        description: { type: 'string', description: 'Relationship description' },
                        tension_level: { type: 'integer', description: 'Tension (1-10)', minimum: 1, maximum: 10, default: 5 },
                        trust_level: { type: 'integer', description: 'Trust (1-10)', minimum: 1, maximum: 10, default: 5 },
                        secret_from_others: { type: 'boolean', description: 'Is this relationship secret?', default: false }
                    },
                    required: ['character1_id', 'character2_id', 'relationship_type']
                }
            },
            {
                name: 'get_relationships',
                description: 'Get relationships for a character or series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer', description: 'Optional: specific character ID' },
                        series_id: { type: 'integer', description: 'Optional: all relationships in series' },
                        relationship_type: { type: 'string', description: 'Filter by relationship type' }
                    }
                }
            },
            {
                name: 'track_character_development',
                description: 'Record character development event',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer', description: 'Character ID' },
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_id: { type: 'integer', description: 'Optional: Chapter ID' },
                        development_type: { 
                            type: 'string',
                            description: 'Type of development',
                            enum: ['revelation', 'growth', 'setback', 'trauma', 'victory', 'loss', 'relationship_change', 'skill_development', 'moral_choice']
                        },
                        description: { type: 'string', description: 'Development description' },
                        emotional_impact: { type: 'string', description: 'Emotional impact on character' },
                        character_change: { type: 'string', description: 'How this changes the character' },
                        relationship_changes: { type: 'string', description: 'Impact on relationships' },
                        significance_level: { type: 'integer', description: 'Significance (1-10)', minimum: 1, maximum: 10, default: 5 }
                    },
                    required: ['character_id', 'book_id', 'development_type', 'description']
                }
            },
            {
                name: 'get_character_arc',
                description: 'Get complete character development arc',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer', description: 'Character ID' },
                        book_range: { 
                            type: 'object',
                            properties: {
                                start_book: { type: 'integer' },
                                end_book: { type: 'integer' }
                            }
                        }
                    },
                    required: ['character_id']
                }
            },
            {
                name: 'check_character_continuity',
                description: 'Check for character continuity issues',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer', description: 'Character ID' },
                        check_type: { 
                            type: 'string',
                            description: 'Type of continuity check',
                            enum: ['timeline', 'relationships', 'abilities', 'appearance', 'all'],
                            default: 'all'
                        }
                    },
                    required: ['character_id']
                }
            },
            {
                name: 'get_character_relationships_network',
                description: 'Get network view of character relationships',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        center_character_id: { type: 'integer', description: 'Optional: center on specific character' },
                        relationship_types: { 
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Filter by relationship types'
                        }
                    },
                    required: ['series_id']
                }
            }
        ];
    }

    getToolHandler(toolName) {
        const handlers = {
            'create_character': this.createCharacter,
            'update_character': this.updateCharacter,
            'get_characters': this.getCharacters,
            'create_relationship': this.createRelationship,
            'get_relationships': this.getRelationships,
            'track_character_development': this.trackCharacterDevelopment,
            'get_character_arc': this.getCharacterArc,
            'check_character_continuity': this.checkCharacterContinuity,
            'get_character_relationships_network': this.getCharacterNetworkView
        };

        return handlers[toolName];
    }

    async createCharacter(args) {
        this.validateRequired(args, ['series_id', 'name', 'character_type']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Handle aliases array
        const characterData = { ...args };
        if (characterData.aliases && Array.isArray(characterData.aliases)) {
            // PostgreSQL will handle the array conversion
        }
        
        const character = await this.db.create('characters', characterData);
        
        return {
            character,
            message: `Created character "${character.name}" (${character.character_type}) with ID ${character.id}`
        };
    }

    async updateCharacter(args) {
        this.validateRequired(args, ['character_id']);
        
        const character = await this.validateCharacterExists(args.character_id);
        if (!character) {
            throw new Error(`Character with ID ${args.character_id} not found`);
        }
        
        const { character_id, ...updateData } = args;
        const updatedCharacter = await this.db.update('characters', character_id, updateData);
        
        return {
            character: updatedCharacter,
            message: `Updated character "${updatedCharacter.name}"`
        };
    }

    async getCharacters(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = 'SELECT * FROM characters WHERE series_id = $1';
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.character_type) {
            query += ` AND character_type = $${paramIndex}`;
            params.push(args.character_type);
            paramIndex++;
        }

        if (args.status) {
            query += ` AND status = $${paramIndex}`;
            params.push(args.status);
            paramIndex++;
        }

        if (args.importance_min) {
            query += ` AND importance_level >= $${paramIndex}`;
            params.push(args.importance_min);
            paramIndex++;
        }

        if (args.search_name) {
            query += ` AND name ILIKE $${paramIndex}`;
            params.push(`%${args.search_name}%`);
            paramIndex++;
        }

        query += ' ORDER BY importance_level DESC, name';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createRelationship(args) {
        this.validateRequired(args, ['character1_id', 'character2_id', 'relationship_type']);
        
        if (args.character1_id === args.character2_id) {
            throw new Error('Cannot create relationship between character and themselves');
        }

        await this.validateCharacterExists(args.character1_id);
        await this.validateCharacterExists(args.character2_id);
        
        const relationship = await this.db.create('character_relationships', args);
        
        return {
            relationship,
            message: `Created relationship between characters ${args.character1_id} and ${args.character2_id}`
        };
    }

    async getRelationships(args) {
        let query, params;

        if (args.character_id) {
            query = `
                SELECT cr.*, 
                       c1.name as character1_name, c2.name as character2_name,
                       c1.character_type as character1_type, c2.character_type as character2_type
                FROM character_relationships cr
                JOIN characters c1 ON cr.character1_id = c1.id
                JOIN characters c2 ON cr.character2_id = c2.id
                WHERE cr.character1_id = $1 OR cr.character2_id = $1
            `;
            params = [args.character_id];
        } else if (args.series_id) {
            query = `
                SELECT cr.*, 
                       c1.name as character1_name, c2.name as character2_name,
                       c1.character_type as character1_type, c2.character_type as character2_type
                FROM character_relationships cr
                JOIN characters c1 ON cr.character1_id = c1.id
                JOIN characters c2 ON cr.character2_id = c2.id
                WHERE c1.series_id = $1
            `;
            params = [args.series_id];
        } else {
            throw new Error('Must provide either character_id or series_id');
        }

        if (args.relationship_type) {
            query += ` AND cr.relationship_type = $${params.length + 1}`;
            params.push(args.relationship_type);
        }

        query += ' ORDER BY cr.created_at DESC';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async trackCharacterDevelopment(args) {
        this.validateRequired(args, ['character_id', 'book_id', 'development_type', 'description']);
        
        await this.validateCharacterExists(args.character_id);
        await this.validateBookExists(args.book_id);
        
        const development = await this.db.create('character_development', args);
        
        return {
            development,
            message: `Recorded ${args.development_type} development for character ${args.character_id}`
        };
    }

    async getCharacterArc(args) {
        this.validateRequired(args, ['character_id']);
        
        const character = await this.validateCharacterExists(args.character_id);
        if (!character) {
            throw new Error(`Character with ID ${args.character_id} not found`);
        }

        let query = `
            SELECT cd.*, b.title as book_title, b.book_number, 
                   ch.title as chapter_title, ch.chapter_number
            FROM character_development cd
            JOIN books b ON cd.book_id = b.id
            LEFT JOIN chapters ch ON cd.chapter_id = ch.id
            WHERE cd.character_id = $1
        `;
        let params = [args.character_id];

        if (args.book_range) {
            if (args.book_range.start_book) {
                query += ` AND b.book_number >= $${params.length + 1}`;
                params.push(args.book_range.start_book);
            }
            if (args.book_range.end_book) {
                query += ` AND b.book_number <= $${params.length + 1}`;
                params.push(args.book_range.end_book);
            }
        }

        query += ' ORDER BY b.book_number, ch.chapter_number';
        
        const developments = await this.db.query(query, params);
        
        return {
            character: {
                id: character.id,
                name: character.name,
                character_type: character.character_type,
                character_arc_summary: character.character_arc_summary
            },
            developments: developments.rows,
            timeline_summary: this.generateArcSummary(developments.rows)
        };
    }

    generateArcSummary(developments) {
        if (developments.length === 0) return 'No development events recorded';
        
        const byBook = {};
        developments.forEach(dev => {
            if (!byBook[dev.book_number]) {
                byBook[dev.book_number] = [];
            }
            byBook[dev.book_number].push(dev);
        });

        const summary = [];
        Object.keys(byBook).sort((a, b) => parseInt(a) - parseInt(b)).forEach(bookNum => {
            const bookDevs = byBook[bookNum];
            const majorEvents = bookDevs.filter(d => d.significance_level >= 7);
            summary.push(
                `Book ${bookNum}: ${bookDevs.length} development events` + 
                (majorEvents.length > 0 ? ` (${majorEvents.length} major)` : '')
            );
        });

        return summary;
    }

    async checkCharacterContinuity(args) {
        this.validateRequired(args, ['character_id']);
        
        return await this.db.checkCharacterContinuity(args.character_id);
    }

    async getCharacterNetworkView(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT cr.*, 
                   c1.name as character1_name, c1.character_type as character1_type, c1.importance_level as character1_importance,
                   c2.name as character2_name, c2.character_type as character2_type, c2.importance_level as character2_importance
            FROM character_relationships cr
            JOIN characters c1 ON cr.character1_id = c1.id
            JOIN characters c2 ON cr.character2_id = c2.id
            WHERE c1.series_id = $1
        `;
        let params = [args.series_id];

        if (args.center_character_id) {
            query += ` AND (cr.character1_id = $2 OR cr.character2_id = $2)`;
            params.push(args.center_character_id);
        }

        if (args.relationship_types && args.relationship_types.length > 0) {
            query += ` AND cr.relationship_type = ANY($${params.length + 1})`;
            params.push(args.relationship_types);
        }

        query += ' ORDER BY c1.importance_level DESC, c2.importance_level DESC';
        
        const relationships = await this.db.query(query, params);
        
        // Also get character list for the network
        const charactersQuery = args.center_character_id ?
            `SELECT * FROM characters WHERE series_id = $1 AND (id = $2 OR id IN (
                SELECT character1_id FROM character_relationships WHERE character2_id = $2
                UNION
                SELECT character2_id FROM character_relationships WHERE character1_id = $2
            ))` :
            'SELECT * FROM characters WHERE series_id = $1 ORDER BY importance_level DESC';
            
        const characters = await this.db.query(charactersQuery, params);
        
        return {
            characters: characters.rows,
            relationships: relationships.rows,
            network_stats: {
                total_characters: characters.rows.length,
                total_relationships: relationships.rows.length,
                relationship_types: [...new Set(relationships.rows.map(r => r.relationship_type))]
            }
        };
    }
}

// Start the server
const server = new CharacterDevelopmentServer();
server.run().catch(console.error);