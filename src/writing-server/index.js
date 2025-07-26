// src/writing-server/index.js - Writing Production MCP Server
import { BaseMCPServer } from '../shared/base-server.js';
import { setupStoryStructureRoutes } from './routes/story-structure-routes.js';
import { StoryStructureController } from './controllers/story-structure-controller.js';

class WritingProductionServer extends BaseMCPServer {
    constructor() {
        super('writing-production-server', '1.0.0');
        
        // Initialize controllers
        this.storyStructureController = new StoryStructureController(this.db);
        
        // Initialize REST API routes
        this.setupRoutes();
        
        // Define MCP tools
        this.tools = [
            {
                name: 'create_book',
                description: 'Create a new book in a series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        book_number: { type: 'integer', description: 'Book number in series' },
                        title: { type: 'string', description: 'Book title' },
                        subtitle: { type: 'string', description: 'Book subtitle' },
                        main_case_description: { type: 'string', description: 'Main case/plot description' },
                        mini_arc_position: { type: 'string', description: 'Position in mini-arc (e.g., "Book 1 of 3 in The Awakening Arc")' },
                        target_word_count: { type: 'integer', description: 'Target word count', default: 100000 },
                        target_chapters: { type: 'integer', description: 'Target number of chapters', default: 40 },
                        outline_complete: { type: 'boolean', description: 'Is the outline complete?', default: false },
                        publication_date: { type: 'string', format: 'date', description: 'Planned publication date' }
                    },
                    required: ['series_id', 'book_number', 'title']
                }
            },
            {
                name: 'update_book',
                description: 'Update book information and progress',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        title: { type: 'string' },
                        subtitle: { type: 'string' },
                        main_case_description: { type: 'string' },
                        status: { 
                            type: 'string',
                            enum: ['planning', 'outlining', 'writing', 'first_draft_complete', 'editing', 'revision', 'final_draft', 'complete', 'published']
                        },
                        outline_complete: { type: 'boolean' },
                        first_draft_complete: { type: 'boolean' },
                        editing_complete: { type: 'boolean' },
                        word_count: { type: 'integer' },
                        chapter_count: { type: 'integer' }
                    },
                    required: ['book_id']
                }
            },
            {
                name: 'get_books',
                description: 'Get books in a series with progress information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        status: { type: 'string', description: 'Filter by book status' },
                        include_progress: { type: 'boolean', description: 'Include detailed progress info', default: true }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'create_chapter',
                description: 'Create a new chapter in a book',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_number: { type: 'integer', description: 'Chapter number' },
                        title: { type: 'string', description: 'Chapter title' },
                        summary: { type: 'string', description: 'Chapter summary' },
                        outline: { type: 'string', description: 'Chapter outline' },
                        pov_character_id: { type: 'integer', description: 'Point of view character ID' },
                        scene_setting_id: { type: 'integer', description: 'Primary location ID' },
                        target_word_count: { type: 'integer', description: 'Target word count for chapter', default: 2500 },
                        writing_notes: { type: 'string', description: 'Notes for writing this chapter' }
                    },
                    required: ['book_id', 'chapter_number']
                }
            },
            {
                name: 'update_chapter',
                description: 'Update chapter content and progress',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_number: { type: 'integer', description: 'Chapter number' },
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        outline: { type: 'string' },
                        content: { type: 'string', description: 'Chapter content' },
                        word_count: { type: 'integer' },
                        status: { 
                            type: 'string',
                            enum: ['outlined', 'in_progress', 'drafted', 'revised', 'final']
                        },
                        writing_notes: { type: 'string' },
                        continuity_notes: { type: 'string' }
                    },
                    required: ['book_id', 'chapter_number']
                }
            },
            {
                name: 'get_chapters',
                description: 'Get chapters for a book',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        status: { type: 'string', description: 'Filter by chapter status' },
                        include_content: { type: 'boolean', description: 'Include chapter content', default: false },
                        pov_character_id: { type: 'integer', description: 'Filter by POV character' }
                    },
                    required: ['book_id']
                }
            },
            {
                name: 'log_writing_session',
                description: 'Log a writing session and update progress',
                inputSchema: {
                    type: 'object',
                    properties: {
                        claude_project_name: { type: 'string', description: 'Name of Claude project logging the session' },
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_id: { type: 'integer', description: 'Optional: Chapter ID if working on specific chapter' },
                        words_written: { type: 'integer', description: 'Words written in this session' },
                        session_type: { 
                            type: 'string',
                            description: 'Type of writing session',
                            enum: ['outlining', 'drafting', 'editing', 'revision', 'research', 'world_building', 'character_development', 'plotting']
                        },
                        session_start: { type: 'string', format: 'date-time', description: 'Session start time' },
                        session_end: { type: 'string', format: 'date-time', description: 'Session end time' },
                        goals_set: { type: 'string', description: 'Goals set for this session' },
                        goals_achieved: { type: 'string', description: 'Goals achieved in this session' },
                        obstacles_encountered: { type: 'string', description: 'Any obstacles or challenges' },
                        next_session_goals: { type: 'string', description: 'Goals for next session' },
                        session_notes: { type: 'string', description: 'General notes about the session' },
                        productivity_rating: { type: 'integer', description: 'Productivity rating (1-10)', minimum: 1, maximum: 10 }
                    },
                    required: ['claude_project_name', 'book_id', 'words_written', 'session_type' ]
                }
            },
            {
                name: 'get_writing_progress',
                description: 'Get writing progress for book, series, or Claude project',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Optional: specific book ID' },
                        series_id: { type: 'integer', description: 'Optional: entire series' },
                        claude_project_name: { type: 'string', description: 'Optional: specific Claude project' },
                        date_range: {
                            type: 'object',
                            properties: {
                                start_date: { type: 'string', format: 'date' },
                                end_date: { type: 'string', format: 'date' }
                            }
                        },
                        include_sessions: { type: 'boolean', description: 'Include individual sessions', default: false }
                    }
                }
            },
            {
                name: 'set_writing_goals',
                description: 'Set writing goals for a book or series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Optional: book-specific goals' },
                        series_id: { type: 'integer', description: 'Optional: series-wide goals' },
                        daily_word_goal: { type: 'integer', description: 'Daily word count goal' },
                        weekly_word_goal: { type: 'integer', description: 'Weekly word count goal' },
                        target_completion_date: { type: 'string', format: 'date', description: 'Target completion date' },
                        milestone_goals: { 
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    milestone_name: { type: 'string' },
                                    target_date: { type: 'string', format: 'date' },
                                    target_words: { type: 'integer' },
                                    description: { type: 'string' }
                                }
                            }
                        },
                        notes: { type: 'string', description: 'Notes about these goals' }
                    }
                }
            },
            {
                name: 'get_productivity_analytics',
                description: 'Get productivity analytics and insights',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        claude_project_name: { type: 'string', description: 'Optional: specific Claude project' },
                        time_period: { 
                            type: 'string',
                            enum: ['week', 'month', 'quarter', 'year', 'all_time'],
                            default: 'month'
                        },
                        analysis_type: {
                            type: 'string',
                            enum: ['productivity_trends', 'session_patterns', 'goal_tracking', 'project_comparison'],
                            default: 'productivity_trends'
                        }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'export_manuscript',
                description: 'Export book manuscript in various formats',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        export_format: { 
                            type: 'string',
                            enum: ['markdown', 'docx', 'pdf', 'epub', 'json'],
                            default: 'markdown'
                        },
                        include_metadata: { type: 'boolean', description: 'Include chapter metadata', default: true },
                        include_notes: { type: 'boolean', description: 'Include writing notes', default: false },
                        chapters_range: {
                            type: 'object',
                            properties: {
                                start_chapter: { type: 'integer' },
                                end_chapter: { type: 'integer' }
                            }
                        }
                    },
                    required: ['book_id']
                }
            },
            {
                name: 'bulk_chapter_operations',
                description: 'Perform bulk operations on chapters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        operation: { 
                            type: 'string',
                            enum: ['create_outline_batch', 'update_status_batch', 'reorder_chapters', 'split_chapter', 'merge_chapters']
                        },
                        operation_data: { 
                            type: 'object',
                            description: 'Operation-specific data (structure varies by operation)'
                        }
                    },
                    required: ['book_id', 'operation']
                }
            },
            {
                name: 'word_count_tracking',
                description: 'Advanced word count tracking and analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Optional: specific book' },
                        series_id: { type: 'integer', description: 'Optional: entire series' },
                        tracking_type: {
                            type: 'string',
                            enum: ['daily_progress', 'chapter_breakdown', 'pov_distribution', 'scene_analysis'],
                            default: 'daily_progress'
                        },
                        date_range: {
                            type: 'object',
                            properties: {
                                start_date: { type: 'string', format: 'date' },
                                end_date: { type: 'string', format: 'date' }
                            }
                        }
                    }
                }
            },
            {
                name: 'validate_chapter_structure',
                description: 'Validate chapter structure against story structure rules',
                inputSchema: {
                    type: 'object',
                    properties: {
                        chapter_id: { type: 'integer', description: 'Chapter ID' },
                        initial_goal: { type: 'string', description: 'Character\'s initial goal at chapter start' },
                        disturbance: { type: 'string', description: 'Event that disrupts the initial goal' },
                        new_goal: { type: 'string', description: 'Character\'s new goal after the disturbance' },
                        complications: { 
                            type: 'array', 
                            items: { type: 'string' },
                            description: 'Obstacles or complications in pursuing the goal' 
                        },
                        turning_point: { type: 'string', description: 'Major turning point in the chapter' },
                        choice: { type: 'string', description: 'Key choice the character makes' },
                        consequences: { type: 'string', description: 'Consequences of the choice' },
                        next_setup: { type: 'string', description: 'Setup for the next chapter (optional)' }
                    },
                    required: ['chapter_id', 'initial_goal', 'disturbance', 'new_goal', 
                              'complications', 'turning_point', 'choice', 'consequences']
                }
            },
            {
                name: 'check_structure_violations',
                description: 'Check for story structure violations in a chapter',
                inputSchema: {
                    type: 'object',
                    properties: {
                        chapter_id: { type: 'integer', description: 'Chapter ID to check' }
                    },
                    required: ['chapter_id']
                }
            },
            {
                name: 'validate_beat_placement',
                description: 'Validate beat progression percentages in a chapter',
                inputSchema: {
                    type: 'object',
                    properties: {
                        chapter_id: { type: 'integer', description: 'Chapter ID' },
                        chapter_word_count: { type: 'integer', description: 'Total word count of the chapter' },
                        beats: {
                            type: 'object',
                            properties: {
                                goal: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                disturbance: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                new_goal: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                complications: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                turning_point: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                choice: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                consequences: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    },
                                    required: ['start', 'end']
                                },
                                next_setup: {
                                    type: 'object',
                                    properties: {
                                        start: { type: 'integer', description: 'Start position in words' },
                                        end: { type: 'integer', description: 'End position in words' }
                                    }
                                }
                            },
                            required: ['goal', 'disturbance', 'new_goal', 'complications', 
                                      'turning_point', 'choice', 'consequences']
                        }
                    },
                    required: ['chapter_id', 'chapter_word_count', 'beats']
                }
            }
        ];

        this.setupErrorHandling();
    }
    
    setupRoutes() {
        // Set up story structure routes
        setupStoryStructureRoutes(this.httpApp, this.db);
    }

    getToolHandler(toolName) {
        const handlers = {
            // Story Structure Tools
            'validate_chapter_structure': (args) => this.storyStructureController.validateChapterPlan(args),
            'check_structure_violations': (args) => this.storyStructureController.checkViolations(args.chapter_id),
            'validate_beat_placement': (args) => this.storyStructureController.validateBeatPlacement(args),
            
            // Book Management Tools
            'create_book': this.createBook,
            'update_book': this.updateBook,
            'get_books': this.getBooks,
            'create_chapter': this.createChapter,
            'update_chapter': this.updateChapter,
            'get_chapters': this.getChapters,
            'log_writing_session': this.logWritingSession,
            'get_writing_progress': this.getWritingProgress,
            'set_writing_goals': this.setWritingGoals,
            'get_productivity_analytics': this.getProductivityAnalytics,
            'export_manuscript': this.exportManuscript,
            'bulk_chapter_operations': this.bulkChapterOperations,
            'word_count_tracking': this.wordCountTracking,
        };

        return handlers[toolName];
    }

    async createBook(args) {
        this.validateRequired(args, ['series_id', 'book_number', 'title']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Check if book number already exists
        const existingBook = await this.db.query(
            'SELECT id FROM books WHERE series_id = $1 AND book_number = $2',
            [args.series_id, args.book_number]
        );
        
        if (existingBook.rows.length > 0) {
            throw new Error(`Book ${args.book_number} already exists in this series`);
        }
        
        const book = await this.db.create('books', args);
        
        // Update series book count
        await this.db.query(
            'UPDATE series SET current_book_count = current_book_count + 1 WHERE id = $1',
            [args.series_id]
        );
        
        return {
            book,
            message: `Created book "${book.title}" (Book ${book.book_number}) with ID ${book.id}`
        };
    }

    async updateBook(args) {
        this.validateRequired(args, ['book_id']);
        
        const book = await this.validateBookExists(args.book_id);
        if (!book) {
            throw new Error(`Book with ID ${args.book_id} not found`);
        }
        
        const { book_id, ...updateData } = args;
        const updatedBook = await this.db.update('books', book_id, updateData);
        
        return {
            book: updatedBook,
            message: `Updated book "${updatedBook.title}"`
        };
    }

    async getBooks(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = args.include_progress ? 
            'SELECT * FROM book_progress WHERE series_id = $1' :
            'SELECT * FROM books WHERE series_id = $1';
        let params = [args.series_id];

        if (args.status) {
            query += ' AND status = $2';
            params.push(args.status);
        }

        query += ' ORDER BY book_number';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createChapter(args) {
        this.validateRequired(args, ['book_id', 'chapter_number']);
        
        await this.validateBookExists(args.book_id);
        
        // Check if chapter number already exists in this book
        const existingChapter = await this.db.query(
            'SELECT id FROM chapters WHERE book_id = $1 AND chapter_number = $2',
            [args.book_id, args.chapter_number]
        );
        
        if (existingChapter.rows.length > 0) {
            throw new Error(`Chapter ${args.chapter_number} already exists in this book`);
        }
        
        // Validate POV character and setting if provided
        if (args.pov_character_id) {
            await this.validateCharacterExists(args.pov_character_id);
        }
        
        if (args.scene_setting_id) {
            const location = await this.db.findById('locations', args.scene_setting_id);
            if (!location) {
                throw new Error(`Location with ID ${args.scene_setting_id} not found`);
            }
        }
        
        const chapter = await this.db.create('chapters', args);
        
        // Update book chapter count
        await this.db.query(
            'UPDATE books SET chapter_count = chapter_count + 1 WHERE id = $1',
            [args.book_id]
        );
        
        return {
            chapter,
            message: `Created chapter ${chapter.chapter_number}${chapter.title ? ` "${chapter.title}"` : ''} with ID ${chapter.id}`
        };
    }

    async updateChapter(args) {
        this.validateRequired(args, ['book_id', 'chapter_number']);
        
        // Validate book exists
        await this.validateBookExists(args.book_id);
        
        // Get chapter by book_id and chapter_number
        const chapterQuery = await this.db.query(
            'SELECT * FROM chapters WHERE book_id = $1 AND chapter_number = $2',
            [args.book_id, args.chapter_number]
        );

        if (chapterQuery.rows.length === 0) {
            throw new Error(`Could not find chapter ${args.chapter_number} in book ${args.book_id}`);
        }

        const existingChapter = chapterQuery.rows[0];
        
        // Remove book_id and chapter_number from update data since they are identifiers
        const { book_id, chapter_number, ...updateData } = args;
        
        // Update the chapter using its actual ID from the database
        const result = await this.db.update('chapters', existingChapter.id, updateData);
        
        // Return only essential metadata, not the full content
        const { content, outline, writing_notes, continuity_notes, ...chapterMetadata } = result;
        
        // If updating word count, also update the book's total word count
        if (updateData.word_count !== undefined) {
            const oldWordCount = existingChapter.word_count || 0;
            const wordCountDiff = updateData.word_count - oldWordCount;
            
            if (wordCountDiff !== 0) {
                await this.db.query(
                    'UPDATE books SET word_count = word_count + $1 WHERE id = $2',
                    [wordCountDiff, args.book_id]
                );
            }
        }
        
        return {
            chapter: chapterMetadata,
            message: `Updated chapter ${chapterMetadata.chapter_number}${chapterMetadata.title ? ` "${chapterMetadata.title}"` : ''}`
        };
    }

    async getChapters(args) {
        this.validateRequired(args, ['book_id']);
        
        await this.validateBookExists(args.book_id);
        
        let selectFields = 'c.id, c.book_id, c.chapter_number, c.title, c.word_count, c.target_word_count, c.summary, c.outline, c.status, c.writing_notes, c.continuity_notes, c.created_at, c.updated_at';
        
        if (args.include_content) {
            selectFields += ', c.content';
        }
        
        let query = `
            SELECT ${selectFields},
                   char.name as pov_character_name,
                   loc.name as scene_setting_name
            FROM chapters c
            LEFT JOIN characters char ON c.pov_character_id = char.id
            LEFT JOIN locations loc ON c.scene_setting_id = loc.id
            WHERE c.book_id = $1
        `;
        let params = [args.book_id];
        let paramIndex = 2;

        if (args.status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(args.status);
            paramIndex++;
        }

        if (args.pov_character_id) {
            query += ` AND c.pov_character_id = $${paramIndex}`;
            params.push(args.pov_character_id);
            paramIndex++;
        }

        query += ' ORDER BY c.chapter_number';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async logWritingSession(args) {
        this.validateRequired(args, ['claude_project_name', 'book_id', 'words_written', 'session_type']);
        
        await this.validateBookExists(args.book_id);
        
        if (args.chapter_id) {
            const chapter = await this.db.findById('chapters', args.chapter_id);
            if (!chapter) {
                throw new Error(`Chapter with ID ${args.chapter_id} not found`);
            }
        }
        
        // Set session start time if not provided
        if (!args.session_start) {
            args.session_start = new Date().toISOString();
        }
        
        const session = await this.db.create('writing_sessions', args);
        
        // Update book word count if words were written
        if (args.words_written > 0) {
            await this.db.query(
                'UPDATE books SET word_count = word_count + $1 WHERE id = $2',
                [args.words_written, args.book_id]
            );
            
            // Update chapter word count if chapter specified
            if (args.chapter_id) {
                await this.db.query(
                    'UPDATE chapters SET word_count = word_count + $1 WHERE id = $2',
                    [args.words_written, args.chapter_id]
                );
            }
        }
        
        return {
            session,
            message: `Logged ${args.session_type} session: ${args.words_written} words by ${args.claude_project_name}`
        };
    }

    async getWritingProgress(args) {
        let query, params;
        
        if (args.book_id) {
            query = `
                SELECT 
                    b.id, b.title, b.word_count, b.target_word_count, b.chapter_count, b.target_chapters,
                    b.status, b.outline_complete, b.first_draft_complete, b.editing_complete,
                    ROUND((b.word_count::numeric / NULLIF(b.target_word_count, 0)::numeric) * 100.0, 2) as completion_percentage,
                    COUNT(ws.id) as total_sessions,
                    SUM(ws.words_written) as total_words_logged,
                    AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL) as avg_productivity
                FROM books b
                LEFT JOIN writing_sessions ws ON b.id = ws.book_id
                WHERE b.id = $1
                GROUP BY b.id
            `;
            params = [args.book_id];
        } else if (args.series_id) {
            query = `
                SELECT 
                    s.name as series_name, s.current_book_count, s.total_planned_books,
                    COUNT(DISTINCT b.id) as books_created,
                    SUM(b.word_count) as total_words_written,
                    SUM(b.target_word_count) as total_target_words,
                    COUNT(ws.id) as total_sessions,
                    SUM(ws.words_written) as total_words_logged
                FROM series s
                LEFT JOIN books b ON s.id = b.series_id
                LEFT JOIN writing_sessions ws ON b.id = ws.book_id
                WHERE s.id = $1
                GROUP BY s.id, s.name, s.current_book_count, s.total_planned_books
            `;
            params = [args.series_id];
        } else if (args.claude_project_name) {
            query = `
                SELECT 
                    ws.claude_project_name,
                    COUNT(ws.id) as total_sessions,
                    SUM(ws.words_written) as total_words_written,
                    AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL) as avg_productivity,
                    COUNT(DISTINCT ws.book_id) as books_worked_on,
                    MIN(ws.session_start) as first_session,
                    MAX(ws.session_start) as last_session
                FROM writing_sessions ws
                WHERE ws.claude_project_name = $1
                GROUP BY ws.claude_project_name
            `;
            params = [args.claude_project_name];
        } else {
            throw new Error('Must provide book_id, series_id, or claude_project_name');
        }

        // Add date range filter if provided
        if (args.date_range) {
            if (args.date_range.start_date) {
                query = query.replace('WHERE', 'WHERE ws.session_start >= $' + (params.length + 1) + ' AND');
                params.push(args.date_range.start_date);
            }
            if (args.date_range.end_date) {
                query = query.replace('WHERE', 'WHERE ws.session_start <= $' + (params.length + 1) + ' AND');
                params.push(args.date_range.end_date);
            }
        }

        const result = await this.db.query(query, params);
        
        let progressData = result.rows[0] || {};
        
        // Include individual sessions if requested
        if (args.include_sessions) {
            let sessionQuery = 'SELECT * FROM writing_sessions WHERE 1=1';
            let sessionParams = [];
            
            if (args.book_id) {
                sessionQuery += ' AND book_id = $1';
                sessionParams.push(args.book_id);
            } else if (args.claude_project_name) {
                sessionQuery += ' AND claude_project_name = $1';
                sessionParams.push(args.claude_project_name);
            } else if (args.series_id) {
                sessionQuery += ' AND book_id IN (SELECT id FROM books WHERE series_id = $1)';
                sessionParams.push(args.series_id);
            }
            
            sessionQuery += ' ORDER BY session_start DESC';
            
            const sessions = await this.db.query(sessionQuery, sessionParams);
            progressData.recent_sessions = sessions.rows;
        }
        
        return progressData;
    }

    async setWritingGoals(args) {
        // Validate that either book_id or series_id is provided
        if (!args.book_id && !args.series_id) {
            throw new Error('Either book_id or series_id must be provided');
        }
        
        // If book_id is provided, validate that it exists
        if (args.book_id) {
            await this.validateBookExists(args.book_id);
        }
        
        // If series_id is provided, validate that it exists
        if (args.series_id) {
            await this.validateSeriesExists(args.series_id);
        }
        
        // Create a new goals record
        const goals = await this.db.create('writing_goals', args);
        
        return {
            goals,
            message: args.book_id ? 
                `Set writing goals for book ID ${args.book_id}` : 
                `Set writing goals for series ID ${args.series_id}`
        };
    }

    async getProductivityAnalytics(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const { series_id, claude_project_name, time_period = 'month', analysis_type = 'productivity_trends' } = args;
        
        let baseQuery, dateFilter, params = [series_id];
        let paramIndex = 2;
        
        // Set up date filtering based on time period
        const now = new Date();
        let startDate = new Date(now);
        
        switch (time_period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            case 'all_time':
                startDate = new Date(2000, 0, 1); // Far in the past
                break;
        }
        
        dateFilter = ` AND ws.session_start >= $${paramIndex}`;
        params.push(startDate.toISOString());
        paramIndex++;
        
        // Set up base query with claude_project_name filter if provided
        baseQuery = `
            FROM books b
            LEFT JOIN writing_sessions ws ON b.id = ws.book_id
            WHERE b.series_id = $1${dateFilter}
        `;
        
        if (claude_project_name) {
            baseQuery += ` AND ws.claude_project_name = $${paramIndex}`;
            params.push(claude_project_name);
            paramIndex++;
        }
        
        // Run appropriate analysis based on analysis_type
        switch (analysis_type) {
            case 'productivity_trends': {
                const query = `
                    SELECT 
                        DATE_TRUNC('day', ws.session_start) as day,
                        SUM(ws.words_written) as daily_words,
                        COUNT(ws.id) as session_count,
                        AVG(ws.productivity_rating) as avg_productivity
                    ${baseQuery}
                    GROUP BY day
                    ORDER BY day
                `;
                
                const result = await this.db.query(query, params);
                
                return {
                    productivity_trends: result.rows,
                    time_period: time_period,
                    summary: {
                        total_days: result.rows.length,
                        total_words: result.rows.reduce((sum, day) => sum + parseInt(day.daily_words || 0), 0),
                        avg_daily_words: Math.round(result.rows.reduce((sum, day) => sum + parseInt(day.daily_words || 0), 0) / 
                                          (result.rows.length || 1)),
                        most_productive_day: result.rows.reduce((max, day) => 
                            parseInt(day.daily_words) > parseInt(max.daily_words || 0) ? day : max, result.rows[0] || {})
                    }
                };
            }
            
            case 'session_patterns': {
                const query = `
                    SELECT 
                        ws.session_type,
                        COUNT(ws.id) as session_count,
                        SUM(ws.words_written) as total_words,
                        AVG(ws.words_written) as avg_words_per_session,
                        AVG(ws.productivity_rating) as avg_productivity,
                        AVG(EXTRACT(EPOCH FROM (ws.session_end - ws.session_start)) / 60) as avg_duration_minutes
                    ${baseQuery}
                    GROUP BY ws.session_type
                    ORDER BY total_words DESC
                `;
                
                const result = await this.db.query(query, params);
                
                return {
                    session_patterns: result.rows,
                    time_period: time_period,
                    insights: this.generateSessionInsights(result.rows)
                };
            }
            
            case 'goal_tracking': {
                // Get writing goals
                const goalsQuery = claude_project_name ?
                    `SELECT * FROM writing_goals WHERE series_id = $1 ORDER BY created_at DESC LIMIT 1` :
                    `SELECT * FROM writing_goals WHERE series_id = $1 ORDER BY created_at DESC LIMIT 1`;
                
                const goalsResult = await this.db.query(goalsQuery, [series_id]);
                const goals = goalsResult.rows[0] || {};
                
                // Get progress metrics
                const progressQuery = `
                    SELECT 
                        SUM(ws.words_written) as total_words,
                        COUNT(DISTINCT DATE_TRUNC('day', ws.session_start)) as active_days,
                        SUM(ws.words_written) / COUNT(DISTINCT DATE_TRUNC('day', ws.session_start)) as avg_daily_words
                    ${baseQuery}
                `;
                
                const progressResult = await this.db.query(progressQuery, params);
                const progress = progressResult.rows[0] || {};
                
                return this.formatGoalTracking(goals, progress);
            }
            
            case 'project_comparison': {
                return await this.getProjectComparison(baseQuery, params);
            }
            
            default:
                throw new Error(`Unknown analysis type: ${analysis_type}`);
        }
    }

    async exportManuscript(args) {
        this.validateRequired(args, ['book_id']);
        
        const book = await this.validateBookExists(args.book_id);
        if (!book) {
            throw new Error(`Book with ID ${args.book_id} not found`);
        }
        
        const { export_format = 'markdown', include_metadata = true, include_notes = false, chapters_range } = args;
        
        // Get book metadata
        const bookInfo = await this.db.findById('books', args.book_id);
        
        // Build chapter query
        let query = `
            SELECT c.*, 
                   char.name as pov_character_name,
                   loc.name as scene_setting_name
            FROM chapters c
            LEFT JOIN characters char ON c.pov_character_id = char.id
            LEFT JOIN locations loc ON c.scene_setting_id = loc.id
            WHERE c.book_id = $1
        `;
        let params = [args.book_id];
        
        // Apply chapter range if specified
        if (chapters_range) {
            if (chapters_range.start_chapter) {
                query += ' AND c.chapter_number >= $2';
                params.push(chapters_range.start_chapter);
            }
            
            if (chapters_range.end_chapter) {
                query += ' AND c.chapter_number <= $' + (params.length + 1);
                params.push(chapters_range.end_chapter);
            }
        }
        
        query += ' ORDER BY c.chapter_number';
        
        const chaptersResult = await this.db.query(query, params);
        const chapters = chaptersResult.rows;
        
        // Build the manuscript content based on the requested format
        let manuscript;
        
        switch (export_format) {
            case 'markdown':
                manuscript = this.formatManuscriptMarkdown(bookInfo, chapters, include_metadata, include_notes);
                break;
                
            case 'json':
                manuscript = this.formatManuscriptJson(bookInfo, chapters, include_metadata, include_notes);
                break;
                
            case 'docx':
            case 'pdf':
            case 'epub':
                throw new Error(`Export format ${export_format} is not yet implemented. Please use 'markdown' or 'json'.`);
                
            default:
                throw new Error(`Unknown export format: ${export_format}`);
        }
        
        return {
            book_title: bookInfo.title,
            export_format,
            chapter_count: chapters.length,
            total_word_count: chapters.reduce((sum, chapter) => sum + (chapter.word_count || 0), 0),
            manuscript
        };
    }
    
    formatManuscriptMarkdown(book, chapters, includeMetadata, includeNotes) {
        // Build the markdown document
        let markdown = `# ${book.title}\n\n`;
        
        if (book.subtitle) {
            markdown += `## ${book.subtitle}\n\n`;
        }
        
        if (includeMetadata) {
            markdown += `- Book ${book.book_number} in series\n`;
            markdown += `- Word Count: ${book.word_count || 0}\n`;
            markdown += `- Status: ${book.status || 'In Progress'}\n\n`;
            
            if (book.main_case_description) {
                markdown += `## Main Case\n\n${book.main_case_description}\n\n`;
            }
        }
        
        // Add chapters
        chapters.forEach(chapter => {
            markdown += `\n## Chapter ${chapter.chapter_number}`;
            
            if (chapter.title) {
                markdown += `: ${chapter.title}`;
            }
            
            markdown += '\n\n';
            
            if (includeMetadata) {
                if (chapter.pov_character_name) {
                    markdown += `*POV: ${chapter.pov_character_name}*\n\n`;
                }
                
                if (chapter.scene_setting_name) {
                    markdown += `*Location: ${chapter.scene_setting_name}*\n\n`;
                }
                
                if (chapter.summary) {
                    markdown += `**Summary:** ${chapter.summary}\n\n`;
                }
            }
            
            if (chapter.content) {
                markdown += `${chapter.content}\n\n`;
            } else if (chapter.outline) {
                markdown += `*Outline:* ${chapter.outline}\n\n`;
            }
            
            if (includeNotes) {
                if (chapter.writing_notes) {
                    markdown += `**Writing Notes:** ${chapter.writing_notes}\n\n`;
                }
                
                if (chapter.continuity_notes) {
                    markdown += `**Continuity Notes:** ${chapter.continuity_notes}\n\n`;
                }
            }
        });
        
        return markdown;
    }
    
    formatManuscriptJson(book, chapters, includeMetadata, includeNotes) {
        const result = {
            book: {
                id: book.id,
                title: book.title,
                subtitle: book.subtitle,
                book_number: book.book_number,
                word_count: book.word_count,
                status: book.status
            },
            chapters: chapters.map(chapter => {
                const chapterData = {
                    id: chapter.id,
                    chapter_number: chapter.chapter_number,
                    title: chapter.title,
                    content: chapter.content
                };
                
                if (includeMetadata) {
                    chapterData.metadata = {
                        pov_character: chapter.pov_character_name,
                        location: chapter.scene_setting_name,
                        summary: chapter.summary,
                        word_count: chapter.word_count,
                        target_word_count: chapter.target_word_count,
                        status: chapter.status
                    };
                }
                
                if (includeNotes) {
                    chapterData.notes = {
                        writing_notes: chapter.writing_notes,
                        continuity_notes: chapter.continuity_notes,
                        outline: chapter.outline
                    };
                }
                
                return chapterData;
            })
        };
        
        return result;
    }

    async bulkChapterOperations(args) {
        this.validateRequired(args, ['book_id', 'operation']);
        
        await this.validateBookExists(args.book_id);
        
        const { book_id, operation, operation_data = {} } = args;
        
        switch (operation) {
            case 'create_outline_batch': {
                // Create multiple chapter outlines at once
                this.validateRequired(operation_data, ['chapter_outlines']);
                
                if (!Array.isArray(operation_data.chapter_outlines)) {
                    throw new Error('chapter_outlines must be an array');
                }
                
                const results = [];
                
                for (const outline of operation_data.chapter_outlines) {
                    this.validateRequired(outline, ['chapter_number']);
                    
                    // Check if chapter exists
                    const existingChapter = await this.db.query(
                        'SELECT id FROM chapters WHERE book_id = $1 AND chapter_number = $2',
                        [book_id, outline.chapter_number]
                    );
                    
                    let chapterResult;
                    
                    if (existingChapter.rows.length > 0) {
                        // Update existing chapter
                        const chapterId = existingChapter.rows[0].id;
                        chapterResult = await this.db.update('chapters', chapterId, {
                            title: outline.title,
                            summary: outline.summary,
                            outline: outline.outline,
                            pov_character_id: outline.pov_character_id,
                            scene_setting_id: outline.scene_setting_id,
                            status: 'outlined'
                        });
                    } else {
                        // Create new chapter
                        chapterResult = await this.db.create('chapters', {
                            book_id,
                            chapter_number: outline.chapter_number,
                            title: outline.title,
                            summary: outline.summary,
                            outline: outline.outline,
                            pov_character_id: outline.pov_character_id,
                            scene_setting_id: outline.scene_setting_id,
                            status: 'outlined'
                        });
                        
                        // Update book chapter count
                        await this.db.query(
                            'UPDATE books SET chapter_count = chapter_count + 1 WHERE id = $1',
                            [book_id]
                        );
                    }
                    
                    results.push({
                        chapter_number: outline.chapter_number,
                        id: chapterResult.id,
                        title: chapterResult.title,
                        status: 'outlined'
                    });
                }
                
                return {
                    operation: 'create_outline_batch',
                    chapters_created: results.length,
                    chapters: results,
                    message: `Created/updated outlines for ${results.length} chapters`
                };
            }
            
            case 'update_status_batch': {
                // Update the status of multiple chapters at once
                this.validateRequired(operation_data, ['chapter_ids', 'status']);
                
                if (!Array.isArray(operation_data.chapter_ids)) {
                    throw new Error('chapter_ids must be an array');
                }
                
                const validStatuses = ['outlined', 'in_progress', 'drafted', 'revised', 'final'];
                if (!validStatuses.includes(operation_data.status)) {
                    throw new Error(`Invalid status: ${operation_data.status}. Must be one of: ${validStatuses.join(', ')}`);
                }
                
                const results = [];
                
                for (const chapterId of operation_data.chapter_ids) {
                    // Verify chapter belongs to this book
                    const chapter = await this.db.query(
                        'SELECT id, chapter_number, title FROM chapters WHERE id = $1 AND book_id = $2',
                        [chapterId, book_id]
                    );
                    
                    if (chapter.rows.length === 0) {
                        results.push({
                            id: chapterId,
                            error: `Chapter ID ${chapterId} not found in book ${book_id}`
                        });
                        continue;
                    }
                    
                    await this.db.update('chapters', chapterId, { status: operation_data.status });
                    
                    results.push({
                        id: chapterId,
                        chapter_number: chapter.rows[0].chapter_number,
                        title: chapter.rows[0].title,
                        status: operation_data.status
                    });
                }
                
                return {
                    operation: 'update_status_batch',
                    chapters_updated: results.filter(r => !r.error).length,
                    chapters: results,
                    message: `Updated status to "${operation_data.status}" for ${results.filter(r => !r.error).length} chapters`
                };
            }
            
            case 'reorder_chapters': {
                // Reorder chapters by reassigning chapter numbers
                this.validateRequired(operation_data, ['chapter_order']);
                
                if (!Array.isArray(operation_data.chapter_order)) {
                    throw new Error('chapter_order must be an array');
                }
                
                const results = [];
                
                for (let i = 0; i < operation_data.chapter_order.length; i++) {
                    const chapterId = operation_data.chapter_order[i];
                    const newChapterNumber = i + 1;
                    
                    // Verify chapter belongs to this book
                    const chapter = await this.db.query(
                        'SELECT id, chapter_number, title FROM chapters WHERE id = $1 AND book_id = $2',
                        [chapterId, book_id]
                    );
                    
                    if (chapter.rows.length === 0) {
                        results.push({
                            id: chapterId,
                            error: `Chapter ID ${chapterId} not found in book ${book_id}`
                        });
                        continue;
                    }
                    
                    const oldChapterNumber = chapter.rows[0].chapter_number;
                    
                    if (oldChapterNumber !== newChapterNumber) {
                        await this.db.update('chapters', chapterId, { chapter_number: newChapterNumber });
                        
                        results.push({
                            id: chapterId,
                            title: chapter.rows[0].title,
                            old_chapter_number: oldChapterNumber,
                            new_chapter_number: newChapterNumber
                        });
                    } else {
                        results.push({
                            id: chapterId,
                            title: chapter.rows[0].title,
                            chapter_number: newChapterNumber,
                            changed: false
                        });
                    }
                }
                
                return {
                    operation: 'reorder_chapters',
                    chapters_reordered: results.filter(r => !r.error && r.changed !== false).length,
                    chapters: results,
                    message: `Reordered ${results.filter(r => !r.error && r.changed !== false).length} chapters`
                };
            }
            
            case 'split_chapter':
            case 'merge_chapters':
                // These operations are more complex and would require specific implementations
                throw new Error(`Operation ${operation} is not yet implemented`);
                
            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    }

    async wordCountTracking(args) {
        const { book_id, series_id, tracking_type = 'daily_progress', date_range } = args;
        
        // Check that at least one of book_id or series_id is provided
        if (!book_id && !series_id) {
            throw new Error('Either book_id or series_id must be provided');
        }
        
        // Validate IDs if provided
        if (book_id) {
            await this.validateBookExists(book_id);
        }
        
        if (series_id) {
            await this.validateSeriesExists(series_id);
        }
        
        // Build date filters if provided
        let dateFilter = '';
        let params = [];
        let paramIndex = 1;
        
        if (date_range) {
            if (date_range.start_date) {
                dateFilter += ` AND ws.session_start >= $${paramIndex}`;
                params.push(date_range.start_date);
                paramIndex++;
            }
            
            if (date_range.end_date) {
                dateFilter += ` AND ws.session_start <= $${paramIndex}`;
                params.push(date_range.end_date);
                paramIndex++;
            }
        }
        
        // Build base query depending on whether book_id or series_id is provided
        let baseQuery, idFilter;
        
        if (book_id) {
            idFilter = `ws.book_id = $${paramIndex}`;
            params.push(book_id);
            paramIndex++;
        } else {
            idFilter = `b.series_id = $${paramIndex}`;
            params.push(series_id);
            paramIndex++;
        }
        
        // Execute the appropriate tracking analysis
        switch (tracking_type) {
            case 'daily_progress': {
                // Track daily word count progress
                const query = `
                    SELECT 
                        DATE_TRUNC('day', ws.session_start) as day,
                        SUM(ws.words_written) as words_written,
                        COUNT(DISTINCT ws.id) as session_count,
                        STRING_AGG(DISTINCT ws.session_type, ', ') as session_types
                    FROM writing_sessions ws
                    JOIN books b ON ws.book_id = b.id
                    WHERE ${idFilter}${dateFilter}
                    GROUP BY day
                    ORDER BY day
                `;
                
                const result = await this.db.query(query, params);
                
                // Calculate cumulative and moving averages
                let cumulativeWords = 0;
                const enrichedData = result.rows.map((day, index) => {
                    cumulativeWords += parseInt(day.words_written || 0);
                    
                    // Calculate 7-day moving average
                    let movingAvg = null;
                    if (index >= 6) {  // need at least 7 days of data
                        let sum = 0;
                        for (let i = index; i > index - 7; i--) {
                            sum += parseInt(result.rows[i].words_written || 0);
                        }
                        movingAvg = Math.round(sum / 7);
                    }
                    
                    return {
                        ...day,
                        cumulative_words: cumulativeWords,
                        moving_avg_7day: movingAvg
                    };
                });
                
                return {
                    tracking_type: 'daily_progress',
                    data: enrichedData,
                    summary: {
                        total_days: result.rows.length,
                        total_words: cumulativeWords,
                        avg_daily_words: Math.round(cumulativeWords / (result.rows.length || 1)),
                        most_productive_day: enrichedData.reduce((max, day) => 
                            parseInt(day.words_written) > parseInt(max.words_written || 0) ? day : max, enrichedData[0] || {})
                    }
                };
            }
            
            case 'chapter_breakdown': {
                // Analyze word count distribution across chapters
                if (!book_id) {
                    throw new Error('book_id is required for chapter_breakdown tracking');
                }
                
                const query = `
                    SELECT 
                        c.id,
                        c.chapter_number,
                        c.title,
                        c.word_count,
                        c.target_word_count,
                        CASE WHEN c.target_word_count > 0 
                             THEN ROUND((c.word_count::float / c.target_word_count) * 100, 1)
                             ELSE NULL 
                        END as completion_percentage,
                        c.status,
                        char.name as pov_character_name
                    FROM chapters c
                    LEFT JOIN characters char ON c.pov_character_id = char.id
                    WHERE c.book_id = $1
                    ORDER BY c.chapter_number
                `;
                
                const result = await this.db.query(query, [book_id]);
                
                // Get writing sessions per chapter data
                const sessionsQuery = `
                    SELECT 
                        chapter_id,
                        COUNT(id) as session_count,
                        SUM(words_written) as total_words
                    FROM writing_sessions
                    WHERE book_id = $1 AND chapter_id IS NOT NULL
                    GROUP BY chapter_id
                `;
                
                const sessionsResult = await this.db.query(sessionsQuery, [book_id]);
                
                // Map session data to chapters
                const sessionsMap = {};
                sessionsResult.rows.forEach(row => {
                    sessionsMap[row.chapter_id] = row;
                });
                
                const chapters = result.rows.map(chapter => ({
                    ...chapter,
                    session_count: sessionsMap[chapter.id]?.session_count || 0,
                    words_from_sessions: sessionsMap[chapter.id]?.total_words || 0
                }));
                
                // Calculate completion statistics
                const totalWords = chapters.reduce((sum, chapter) => sum + (parseInt(chapter.word_count) || 0), 0);
                const targetWords = chapters.reduce((sum, chapter) => sum + (parseInt(chapter.target_word_count) || 0), 0);
                const completionPercentage = targetWords > 0 ? (totalWords / targetWords) * 100 : null;
                
                return {
                    tracking_type: 'chapter_breakdown',
                    chapters,
                    summary: {
                        total_chapters: chapters.length,
                        completed_chapters: chapters.filter(c => c.status === 'final').length,
                        total_words: totalWords,
                        target_words: targetWords,
                        overall_completion: completionPercentage ? Math.round(completionPercentage) + '%' : 'N/A'
                    }
                };
            }
            
            case 'pov_distribution': {
                // Analyze word count distribution by POV character
                let query;
                
                if (book_id) {
                    query = `
                        SELECT 
                            char.id as character_id,
                            char.name as character_name,
                            COUNT(c.id) as chapter_count,
                            SUM(c.word_count) as total_words,
                            ROUND((SUM(c.word_count)::float / b.word_count) * 100, 1) as percentage
                        FROM chapters c
                        JOIN books b ON c.book_id = b.id
                        JOIN characters char ON c.pov_character_id = char.id
                        WHERE c.book_id = $1 AND c.pov_character_id IS NOT NULL
                        GROUP BY char.id, char.name, b.word_count
                        ORDER BY total_words DESC
                    `;
                    
                    params = [book_id];
                } else {
                    query = `
                        SELECT 
                            char.id as character_id,
                            char.name as character_name,
                            COUNT(c.id) as chapter_count,
                            SUM(c.word_count) as total_words,
                            ROUND((SUM(c.word_count)::float / 
                                  (SELECT SUM(word_count) FROM books WHERE series_id = $1)) * 100, 1) as percentage,
                            STRING_AGG(DISTINCT b.title, ', ') as books
                        FROM chapters c
                        JOIN books b ON c.book_id = b.id
                        JOIN characters char ON c.pov_character_id = char.id
                        WHERE b.series_id = $1 AND c.pov_character_id IS NOT NULL
                        GROUP BY char.id, char.name
                        ORDER BY total_words DESC
                    `;
                    
                    params = [series_id];
                }
                
                const result = await this.db.query(query, params);
                
                return {
                    tracking_type: 'pov_distribution',
                    pov_characters: result.rows,
                    summary: {
                        total_pov_characters: result.rows.length,
                        total_words_with_pov: result.rows.reduce((sum, char) => sum + (parseInt(char.total_words) || 0), 0),
                        primary_pov: result.rows.length > 0 ? result.rows[0].character_name : null
                    }
                };
            }
            
            case 'scene_analysis': {
                throw new Error('Scene analysis tracking is not yet implemented');
            }
            
            default:
                throw new Error(`Unknown tracking type: ${tracking_type}`);
        }
    }

    async validateChapterStructure(args) {
        this.validateRequired(args, [
            'chapter_id', 'initial_goal', 'disturbance', 'new_goal', 
            'complications', 'turning_point', 'choice', 'consequences'
        ]);
        
        const chapter = await this.db.findById('chapters', args.chapter_id);
        if (!chapter) {
            throw new Error(`Chapter with ID ${args.chapter_id} not found`);
        }
        
        // Save the chapter structure in the database
        const structureData = {
            chapter_id: args.chapter_id,
            initial_goal: args.initial_goal,
            disturbance: args.disturbance,
            new_goal: args.new_goal,
            complications: Array.isArray(args.complications) ? args.complications : [args.complications],
            turning_point: args.turning_point,
            choice: args.choice,
            consequences: args.consequences,
            next_setup: args.next_setup || null
        };
        
        // Check if structure already exists for this chapter
        const existingStructure = await this.db.query(
            'SELECT id FROM chapter_structures WHERE chapter_id = $1',
            [args.chapter_id]
        );
        
        let structure;
        
        if (existingStructure.rows.length > 0) {
            structure = await this.db.update('chapter_structures', existingStructure.rows[0].id, structureData);
        } else {
            structure = await this.db.create('chapter_structures', structureData);
        }
        
        // Get validation rules from the story structure controller
        const validationResult = this.storyStructureController.validateStructure(structureData);
        
        return {
            structure,
            validation: validationResult,
            message: validationResult.valid ? 
                'Chapter structure is valid and follows best practices' : 
                `Chapter structure validation failed: ${validationResult.issues.join(', ')}`
        };
    }
    
    async checkStructureViolations(args) {
        this.validateRequired(args, ['chapter_id']);
        
        const chapter = await this.db.findById('chapters', args.chapter_id);
        if (!chapter) {
            throw new Error(`Chapter with ID ${args.chapter_id} not found`);
        }
        
        // Get chapter structure
        const structureResult = await this.db.query(
            'SELECT * FROM chapter_structures WHERE chapter_id = $1',
            [args.chapter_id]
        );
        
        if (structureResult.rows.length === 0) {
            return {
                message: 'No structure defined for this chapter',
                violations: [{
                    type: 'missing_structure',
                    message: 'Chapter has no structure defined. Use validate_chapter_structure to define one.'
                }]
            };
        }
        
        const structure = structureResult.rows[0];
        
        // Get chapter content
        const chapterContent = chapter.content;
        
        if (!chapterContent) {
            return {
                message: 'Chapter has no content to check against structure',
                violations: [{
                    type: 'no_content',
                    message: 'Chapter has no content to validate against structure'
                }]
            };
        }
        
        // Use the controller to check for violations
        const violations = this.storyStructureController.findStructureViolations(structure, chapterContent);
        
        return {
            message: violations.length === 0 ? 
                'No structure violations found' : 
                `Found ${violations.length} structure violations`,
            violations
        };
    }
    
    async validateBeatPlacement(args) {
        this.validateRequired(args, ['chapter_id', 'chapter_word_count', 'beats']);
        
        const chapter = await this.db.findById('chapters', args.chapter_id);
        if (!chapter) {
            throw new Error(`Chapter with ID ${args.chapter_id} not found`);
        }
        
        const { chapter_word_count, beats } = args;
        
        // Calculate ideal beat placement based on the 8-point structure
        const idealBeats = this.storyStructureController.calculateIdealBeatPlacement(chapter_word_count);
        
        // Compare actual beats with ideal beats
        const comparison = this.storyStructureController.compareBeats(beats, idealBeats);
        
        // Save beat placement in the database
        const beatData = {
            chapter_id: args.chapter_id,
            word_count: chapter_word_count,
            goal_start: beats.goal.start,
            goal_end: beats.goal.end,
            disturbance_start: beats.disturbance.start,
            disturbance_end: beats.disturbance.end,
            new_goal_start: beats.new_goal.start,
            new_goal_end: beats.new_goal.end,
            complications_start: beats.complications.start,
            complications_end: beats.complications.end,
            turning_point_start: beats.turning_point.start,
            turning_point_end: beats.turning_point.end,
            choice_start: beats.choice.start,
            choice_end: beats.choice.end,
            consequences_start: beats.consequences.start,
            consequences_end: beats.consequences.end
        };
        
        if (beats.next_setup) {
            beatData.next_setup_start = beats.next_setup.start;
            beatData.next_setup_end = beats.next_setup.end;
        }
        
        // Check if beats already exist for this chapter
        const existingBeats = await this.db.query(
            'SELECT id FROM chapter_beat_placements WHERE chapter_id = $1',
            [args.chapter_id]
        );
        
        let beatPlacement;
        
        if (existingBeats.rows.length > 0) {
            beatPlacement = await this.db.update('chapter_beat_placements', existingBeats.rows[0].id, beatData);
        } else {
            beatPlacement = await this.db.create('chapter_beat_placements', beatData);
        }
        
        return {
            actual: beats,
            ideal: idealBeats,
            comparison,
            message: comparison.overall_alignment >= 80 ? 
                `Beat placement is good (${comparison.overall_alignment}% alignment with ideal structure)` : 
                `Beat placement needs improvement (${comparison.overall_alignment}% alignment with ideal structure)`
        };
    }

    formatGoalTracking(goals, progress) {
        return {
            goals,
            actual_progress: progress,
            goal_achievement: {
                daily_goal_met: goals.daily_word_goal ? 
                    parseInt(progress.avg_daily_words || 0) >= goals.daily_word_goal : null,
                weekly_goal_progress: goals.weekly_word_goal ? 
                    Math.round((parseInt(progress.total_words || 0) / goals.weekly_word_goal) * 100) : null,
                milestone_tracking: goals.milestone_goals ? 
                    goals.milestone_goals.map(milestone => ({
                        name: milestone.milestone_name,
                        target_date: milestone.target_date,
                        target_words: milestone.target_words,
                        current_progress: Math.round((parseInt(progress.total_words || 0) / milestone.target_words) * 100) + '%'
                    })) : []
            }
        };
    }
}

export { WritingProductionServer };

// Start the server
const server = new WritingProductionServer();
server.run().catch(console.error);