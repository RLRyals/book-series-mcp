// src/index.js - Basic MCP Server for Book Series Management
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

class BookSeriesMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'book-series-manager',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // Database connection
        this.db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };

        process.on('SIGINT', async () => {
            await this.cleanup();
            process.exit(0);
        });
    }

    async cleanup() {
        console.error('Shutting down MCP server...');
        await this.db.end();
    }

    setupToolHandlers() {
        // List all available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'create_series',
                        description: 'Create a new book series',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', description: 'Series name' },
                                pen_name: { type: 'string', description: 'Author pen name' },
                                genre: { type: 'string', description: 'Genre of the series' },
                                world_type: { type: 'string', description: 'Type of world/setting' },
                                description: { type: 'string', description: 'Series description' },
                                total_planned_books: { type: 'integer', description: 'Number of planned books', default: 20 }
                            },
                            required: ['name', 'pen_name', 'genre']
                        }
                    },
                    {
                        name: 'get_series_overview',
                        description: 'Get overview of all series',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Optional: specific series ID' }
                            }
                        }
                    },
                    {
                        name: 'create_series_character',
                        description: 'Create a new character',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                name: { type: 'string', description: 'Character name' },
                                character_type: { type: 'string', description: 'Type: protagonist, antagonist, supporting, etc.' },
                                species: { type: 'string', description: 'Human, non-human, etc.' },
                                occupation: { type: 'string', description: 'Character occupation' },
                                department: { type: 'string', description: 'Police department or organization' },
                                rank_title: { type: 'string', description: 'Professional rank/title' },
                                background_story: { type: 'string', description: 'Character background' },
                                secrets: { type: 'string', description: 'Hidden aspects of character' },
                                personality_traits: { type: 'string', description: 'Key personality traits' },
                                goals: { type: 'string', description: 'Character goals and motivations' },
                                moral_alignment: { type: 'string', description: 'Moral alignment' },
                                importance_level: { type: 'integer', description: 'Importance (1-10)', default: 5 }
                            },
                            required: ['series_id', 'name', 'character_type']
                        }
                    },
                    {
                        name: 'get_series_characters',
                        description: 'Get characters for a series',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                character_type: { type: 'string', description: 'Optional: filter by character type' }
                            },
                            required: ['series_id']
                        }
                    },
                    {
                        name: 'create_series_book',
                        description: 'Create a new book in a series',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                book_number: { type: 'integer', description: 'Book number in series' },
                                title: { type: 'string', description: 'Book title' },
                                main_case_description: { type: 'string', description: 'Main case/plot description' },
                                mini_arc_position: { type: 'string', description: 'Position in mini-arc' },
                                target_word_count: { type: 'integer', description: 'Target word count', default: 100000 },
                                target_chapters: { type: 'integer', description: 'Target number of chapters', default: 40 }
                            },
                            required: ['series_id', 'book_number', 'title']
                        }
                    },
                    {
                        name: 'get_series_books',
                        description: 'Get books in a series with progress info',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' }
                            },
                            required: ['series_id']
                        }
                    },
                    {
                        name: 'create_series_plot_thread',
                        description: 'Create a new plot thread (main arc, mini arc, subplot)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                thread_type: { type: 'string', description: 'Type: series_arc, mini_arc, main_case, subplot, character_arc' },
                                title: { type: 'string', description: 'Plot thread title' },
                                description: { type: 'string', description: 'Plot thread description' },
                                start_book: { type: 'integer', description: 'Starting book number' },
                                end_book: { type: 'integer', description: 'Ending book number' },
                                importance_level: { type: 'integer', description: 'Importance (1-10)', default: 5 },
                                related_characters: { type: 'array', items: { type: 'integer' }, description: 'Related character IDs' }
                            },
                            required: ['series_id', 'thread_type', 'title', 'description']
                        }
                    },
                    {
                        name: 'get_series_plot_threads',
                        description: 'Get plot threads for a series',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                thread_type: { type: 'string', description: 'Optional: filter by thread type' }
                            },
                            required: ['series_id']
                        }
                    },
                    {
                        name: 'update_writing_progress',
                        description: 'Log a writing session and update progress',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                claude_project_name: { type: 'string', description: 'Name of Claude project' },
                                book_id: { type: 'integer', description: 'Book ID' },
                                chapter_id: { type: 'integer', description: 'Optional: Chapter ID' },
                                words_written: { type: 'integer', description: 'Words written in session' },
                                session_type: { type: 'string', description: 'Type: outlining, drafting, editing, research' },
                                session_notes: { type: 'string', description: 'Notes about the session' },
                                next_session_goals: { type: 'string', description: 'Goals for next session' }
                            },
                            required: ['claude_project_name', 'book_id', 'words_written', 'session_type']
                        }
                    },
                    {
                        name: 'search_Series_content',
                        description: 'Search across all series content',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                search_term: { type: 'string', description: 'Term to search for' },
                                content_type: { type: 'string', description: 'Optional: characters, books, plot_threads, notes' }
                            },
                            required: ['series_id', 'search_term']
                        }
                    },
                    {
                        name: 'cross_reference_elements',
                        description: 'Find connections and references between different story elements',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                series_id: { type: 'integer', description: 'Series ID' },
                                element_type: { 
                                    type: 'string', 
                                    description: 'Type of element to cross-reference',
                                    enum: ['character', 'location', 'plot_thread', 'world_element', 'case']
                                },
                                element_id: { type: 'integer', description: 'ID of the specific element' },
                                depth_level: { 
                                    type: 'integer', 
                                    description: 'How many degrees of separation to explore',
                                    minimum: 1,
                                    maximum: 5,
                                    default: 2
                                },
                                reference_types: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['direct_mentions', 'implied_connections', 'timeline_overlap', 'shared_locations', 'relationship_chains']
                                    },
                                    description: 'Types of references to look for'
                                }
                            },
                            required: ['series_id', 'element_type', 'element_id']
                        }
                    }
                ]
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'create_series':
                        return await this.createSeries(args);
                    case 'get_series_overview':
                        return await this.getSeriesOverview(args);
                    case 'create_series_character':
                        return await this.createCharacter(args);
                    case 'get_series_characters':
                        return await this.getCharacters(args);
                    case 'create_series_book':
                        return await this.createBook(args);
                    case 'get_series_books':
                        return await this.getBooks(args);
                    case 'create_series_plot_thread':
                        return await this.createPlotThread(args);
                    case 'get_series_plot_threads':
                        return await this.getPlotThreads(args);
                    case 'update_writing_progress':
                        return await this.updateWritingProgress(args);
                    case 'search_Series_content':
                        return await this.searchContent(args);
                    case 'cross_reference_elements':
                        return await this.crossReferenceElements(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error executing ${name}: ${error.message}`
                        }
                    ],
                    isError: true
                };
            }
        });
    }

    async createSeries(args) {
        const { name, pen_name, genre, world_type, description, total_planned_books = 20 } = args;
        
        const result = await this.db.query(
            `INSERT INTO series (name, pen_name, genre, world_type, description, total_planned_books) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, pen_name, genre, world_type, description, total_planned_books]
        );

        return {
            content: [
                {
                    type: 'text',
                    text: `Created series "${name}" with ID ${result.rows[0].id}. Ready to add characters, books, and plot threads!`
                }
            ]
        };
    }

    async getSeriesOverview(args) {
        const { series_id } = args;
        
        let query = 'SELECT * FROM series_overview';
        let params = [];
        
        if (series_id) {
            query += ' WHERE id = $1';
            params = [series_id];
        }
        
        const result = await this.db.query(query, params);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.rows, null, 2)
                }
            ]
        };
    }

    async createCharacter(args) {
        const {
            series_id, name, character_type, species, occupation, department,
            rank_title, background_story, secrets, personality_traits, goals,
            moral_alignment, importance_level = 5
        } = args;

        const result = await this.db.query(
            `INSERT INTO characters 
             (series_id, name, character_type, species, occupation, department, rank_title, 
              background_story, secrets, personality_traits, goals, moral_alignment, importance_level) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [series_id, name, character_type, species, occupation, department, rank_title,
             background_story, secrets, personality_traits, goals, moral_alignment, importance_level]
        );

        return {
            content: [
                {
                    type: 'text',
                    text: `Created character "${name}" (${character_type}) with ID ${result.rows[0].id}`
                }
            ]
        };
    }

    async getCharacters(args) {
        const { series_id, character_type } = args;
        
        let query = 'SELECT * FROM characters WHERE series_id = $1';
        let params = [series_id];
        
        if (character_type) {
            query += ' AND character_type = $2';
            params.push(character_type);
        }
        
        query += ' ORDER BY importance_level DESC, name';
        
        const result = await this.db.query(query, params);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.rows, null, 2)
                }
            ]
        };
    }

    async createBook(args) {
        const {
            series_id, book_number, title, main_case_description,
            mini_arc_position, target_word_count = 100000, target_chapters = 40
        } = args;

        const result = await this.db.query(
            `INSERT INTO books 
             (series_id, book_number, title, main_case_description, mini_arc_position, 
              target_word_count, target_chapters) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [series_id, book_number, title, main_case_description, mini_arc_position,
             target_word_count, target_chapters]
        );

        // Update series book count
        await this.db.query(
            'UPDATE series SET current_book_count = current_book_count + 1 WHERE id = $1',
            [series_id]
        );

        return {
            content: [
                {
                    type: 'text',
                    text: `Created book "${title}" (Book ${book_number}) with ID ${result.rows[0].id}`
                }
            ]
        };
    }

    async getBooks(args) {
        const { series_id } = args;
        
        const result = await this.db.query(
            'SELECT * FROM book_progress WHERE series_id = $1 ORDER BY book_number',
            [series_id]
        );
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.rows, null, 2)
                }
            ]
        };
    }

    async createPlotThread(args) {
        const {
            series_id, thread_type, title, description, start_book, end_book,
            importance_level = 5, related_characters = []
        } = args;

        const result = await this.db.query(
            `INSERT INTO plot_threads 
             (series_id, thread_type, title, description, start_book, end_book, 
              importance_level, related_characters) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [series_id, thread_type, title, description, start_book, end_book,
             importance_level, related_characters]
        );

        return {
            content: [
                {
                    type: 'text',
                    text: `Created plot thread "${title}" (${thread_type}) with ID ${result.rows[0].id}`
                }
            ]
        };
    }

    async getPlotThreads(args) {
        const { series_id, thread_type } = args;
        
        let query = 'SELECT * FROM plot_threads WHERE series_id = $1';
        let params = [series_id];
        
        if (thread_type) {
            query += ' AND thread_type = $2';
            params.push(thread_type);
        }
        
        query += ' ORDER BY importance_level DESC, start_book';
        
        const result = await this.db.query(query, params);
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result.rows, null, 2)
                }
            ]
        };
    }

    async updateWritingProgress(args) {
        const {
            claude_project_name, book_id, chapter_id, words_written,
            session_type, session_notes, next_session_goals
        } = args;

        // Log the writing session
        const sessionResult = await this.db.query(
            `INSERT INTO writing_sessions 
             (claude_project_name, book_id, chapter_id, words_written, session_type, 
              session_notes, next_session_goals) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [claude_project_name, book_id, chapter_id, words_written, session_type,
             session_notes, next_session_goals]
        );

        // Update book word count
        await this.db.query(
            'UPDATE books SET word_count = word_count + $1 WHERE id = $2',
            [words_written, book_id]
        );

        // If updating a specific chapter, update chapter word count
        if (chapter_id) {
            await this.db.query(
                'UPDATE chapters SET word_count = word_count + $1 WHERE id = $2',
                [words_written, chapter_id]
            );
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `Logged writing session: ${words_written} words written for book ID ${book_id} by ${claude_project_name}`
                }
            ]
        };
    }

    async crossReferenceElements(args) {
        const { series_id, element_type, element_id, depth_level = 2, reference_types = [] } = args;
        
        // Base query to get direct references
        let references = {};
        
        // Get direct mentions in various content types
        const directMentions = await this.db.query(
            `SELECT 'direct_mention' as ref_type, source_type, source_id, content_preview
             FROM element_references 
             WHERE series_id = $1 
             AND target_type = $2 
             AND target_id = $3`,
            [series_id, element_type, element_id]
        );
        references.direct_mentions = directMentions.rows;
        
        // Get timeline overlaps if it's a character or location
        if (element_type === 'character' || element_type === 'location') {
            const timelineOverlaps = await this.db.query(
                `SELECT DISTINCT e2.* 
                 FROM timeline_events e1
                 JOIN timeline_events e2 ON DATE_TRUNC('day', e1.event_datetime) = DATE_TRUNC('day', e2.event_datetime)
                 WHERE e1.series_id = $1 
                 AND e1.${element_type}_id = $2
                 AND e2.${element_type}_id != $2`,
                [series_id, element_id]
            );
            references.timeline_overlaps = timelineOverlaps.rows;
        }
        
        // Get relationship chains for characters
        if (element_type === 'character' && depth_level > 1) {
            const relationships = await this.db.query(
                `WITH RECURSIVE char_chain AS (
                    SELECT c1.id, c1.name, c1.character_type, 1 as depth
                    FROM character_relationships cr
                    JOIN characters c1 ON (cr.character1_id = c1.id OR cr.character2_id = c1.id)
                    WHERE (cr.character1_id = $1 OR cr.character2_id = $1)
                    UNION
                    SELECT c2.id, c2.name, c2.character_type, cc.depth + 1
                    FROM character_relationships cr
                    JOIN char_chain cc ON (cr.character1_id = cc.id OR cr.character2_id = cc.id)
                    JOIN characters c2 ON (
                        (cr.character1_id = c2.id OR cr.character2_id = c2.id) 
                        AND c2.id != cc.id
                    )
                    WHERE cc.depth < $2
                )
                SELECT * FROM char_chain WHERE id != $1 ORDER BY depth;`,
                [element_id, depth_level]
            );
            references.relationship_chains = relationships.rows;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(references, null, 2)
                }
            ]
        };
    }

    async searchContent(args) {
        const { series_id, search_term, content_type } = args;
        const searchPattern = `%${search_term}%`;
        
        let results = {};

        if (!content_type || content_type === 'characters') {
            const charResult = await this.db.query(
                `SELECT id, name, character_type, background_story, secrets 
                 FROM characters 
                 WHERE series_id = $1 AND (
                   name ILIKE $2 OR background_story ILIKE $2 OR secrets ILIKE $2
                 )`,
                [series_id, searchPattern]
            );
            results.characters = charResult.rows;
        }

        if (!content_type || content_type === 'plot_threads') {
            const plotResult = await this.db.query(
                `SELECT id, title, thread_type, description 
                 FROM plot_threads 
                 WHERE series_id = $1 AND (
                   title ILIKE $2 OR description ILIKE $2
                 )`,
                [series_id, searchPattern]
            );
            results.plot_threads = plotResult.rows;
        }

        if (!content_type || content_type === 'notes') {
            const noteResult = await this.db.query(
                `SELECT id, title, content, note_type 
                 FROM series_notes 
                 WHERE series_id = $1 AND (
                   title ILIKE $2 OR content ILIKE $2
                 )`,
                [series_id, searchPattern]
            );
            results.notes = noteResult.rows;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Book Series MCP Server running on stdio');
    }
}

// Start the server
const server = new BookSeriesMCPServer();
server.run().catch(console.error);