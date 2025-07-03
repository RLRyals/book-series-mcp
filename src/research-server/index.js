// src/research-server/index.js - Research & Continuity MCP Server
import { BaseMCPServer } from '../shared/base-server.js';
import { CharacterKnowledgeController } from './controllers/character-knowledge-controller.js';
import { setupCharacterKnowledgeRoutes } from './routes/character-knowledge-routes.js';

class ResearchContinuityServer extends BaseMCPServer {
    constructor() {
        super('research-continuity-server', '1.0.0');
        
        // Set up the character knowledge routes
        setupCharacterKnowledgeRoutes(this.httpApp, this.db);
        
        this.tools = [
            // Character Knowledge State Tracker tools
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
            },
            {
                name: 'search_series_content',
                description: 'Search across all series content with advanced filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        search_term: { type: 'string', description: 'Term to search for' },
                        search_type: { 
                            type: 'string',
                            description: 'Type of search',
                            enum: ['exact_match', 'fuzzy_match', 'keyword_search', 'semantic_search'],
                            default: 'keyword_search'
                        },
                        content_types: { 
                            type: 'array',
                            items: { 
                                type: 'string',
                                enum: ['characters', 'plot_threads', 'locations', 'world_elements', 'cases', 'evidence', 'notes', 'chapters', 'timeline_events']
                            },
                            description: 'Types of content to search in'
                        },
                        book_range: {
                            type: 'object',
                            properties: {
                                start_book: { type: 'integer' },
                                end_book: { type: 'integer' }
                            }
                        },
                        include_secrets: { type: 'boolean', description: 'Include secret/hidden information', default: false },
                        max_results: { type: 'integer', description: 'Maximum number of results per content type', default: 20 }
                    },
                    required: ['series_id', 'search_term']
                }
            },
            {
                name: 'create_research_note',
                description: 'Create a research or reference note',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        note_type: { 
                            type: 'string',
                            description: 'Type of note',
                            enum: ['research', 'continuity', 'ideas', 'character_notes', 'plot_notes', 'world_building', 'inspiration', 'todo', 'reference']
                        },
                        title: { type: 'string', description: 'Note title' },
                        content: { type: 'string', description: 'Note content' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for organization' },
                        priority: { type: 'integer', description: 'Priority (1-5)', minimum: 1, maximum: 5, default: 3 },
                        related_characters: { type: 'array', items: { type: 'integer' }, description: 'Related character IDs' },
                        related_books: { type: 'array', items: { type: 'integer' }, description: 'Related book IDs' },
                        related_plot_threads: { type: 'array', items: { type: 'integer' }, description: 'Related plot thread IDs' },
                        source_url: { type: 'string', description: 'Source URL if researched from web' },
                        deadline: { type: 'string', format: 'date', description: 'Deadline for action items' }
                    },
                    required: ['series_id', 'note_type', 'title', 'content']
                }
            },
            {
                name: 'get_research_notes',
                description: 'Get research notes with filtering and sorting',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        note_type: { type: 'string', description: 'Filter by note type' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Filter by tags' },
                        priority: { type: 'integer', description: 'Filter by priority level' },
                        status: { type: 'string', enum: ['active', 'resolved', 'archived'], description: 'Filter by status' },
                        character_id: { type: 'integer', description: 'Notes related to specific character' },
                        book_id: { type: 'integer', description: 'Notes related to specific book' },
                        search_content: { type: 'string', description: 'Search within note content' },
                        sort_by: { 
                            type: 'string',
                            enum: ['priority', 'created_at', 'updated_at', 'title'],
                            default: 'priority'
                        },
                        include_resolved: { type: 'boolean', description: 'Include resolved notes', default: false }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'check_series_continuity',
                description: 'Comprehensive continuity check across the entire series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        check_type: { 
                            type: 'string',
                            description: 'Type of continuity check',
                            enum: ['character_consistency', 'timeline_consistency', 'world_consistency', 'plot_consistency', 'all'],
                            default: 'all'
                        },
                        book_range: {
                            type: 'object',
                            properties: {
                                start_book: { type: 'integer' },
                                end_book: { type: 'integer' }
                            }
                        },
                        severity_threshold: { 
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical'],
                            default: 'medium'
                        },
                        auto_fix_suggestions: { type: 'boolean', description: 'Generate suggestions for fixing issues', default: true }
                    },
                    required: ['series_id']
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
                        reference_types: {
                            type: 'array',
                            items: { 
                                type: 'string',
                                enum: ['direct_mentions', 'implied_connections', 'timeline_overlap', 'shared_locations', 'relationship_chains']
                            },
                            description: 'Types of references to look for'
                        },
                        depth_level: { type: 'integer', description: 'How many degrees of separation to explore', minimum: 1, maximum: 5, default: 2 }
                    },
                    required: ['series_id', 'element_type', 'element_id']
                }
            },
            {
                name: 'generate_series_report',
                description: 'Generate comprehensive reports about the series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        report_type: { 
                            type: 'string',
                            description: 'Type of report to generate',
                            enum: ['series_bible', 'character_profiles', 'plot_summary', 'world_guide', 'continuity_report', 'progress_report', 'publishing_timeline']
                        },
                        include_secrets: { type: 'boolean', description: 'Include confidential information', default: false },
                        format: { 
                            type: 'string',
                            enum: ['markdown', 'json', 'html', 'summary'],
                            default: 'markdown'
                        },
                        book_range: {
                            type: 'object',
                            properties: {
                                start_book: { type: 'integer' },
                                end_book: { type: 'integer' }
                            }
                        }
                    },
                    required: ['series_id', 'report_type']
                }
            },
            {
                name: 'track_character_mentions',
                description: 'Track where and how characters are mentioned throughout the series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        character_id: { type: 'integer', description: 'Optional: specific character ID' },
                        mention_type: { 
                            type: 'string',
                            enum: ['all_mentions', 'first_appearances', 'major_scenes', 'relationship_developments'],
                            default: 'all_mentions'
                        },
                        book_range: {
                            type: 'object',
                            properties: {
                                start_book: { type: 'integer' },
                                end_book: { type: 'integer' }
                            }
                        }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'analyze_plot_consistency',
                description: 'Analyze plot threads for consistency and resolution',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        thread_type: { type: 'string', description: 'Filter by thread type' },
                        analysis_focus: { 
                            type: 'string',
                            enum: ['resolution_tracking', 'pacing_analysis', 'character_involvement', 'timeline_consistency'],
                            default: 'resolution_tracking'
                        },
                        include_subplots: { type: 'boolean', description: 'Include subplot analysis', default: true }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'find_research_gaps',
                description: 'Identify areas that need more research or development',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        gap_type: { 
                            type: 'string',
                            enum: ['character_development', 'world_building', 'plot_details', 'technical_accuracy', 'historical_accuracy'],
                            default: 'character_development'
                        },
                        priority_threshold: { type: 'integer', description: 'Minimum priority level to include', minimum: 1, maximum: 5, default: 3 }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'create_fact_database',
                description: 'Create and maintain a database of established facts',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        fact_category: { 
                            type: 'string',
                            enum: ['character_facts', 'world_facts', 'historical_facts', 'technical_facts', 'timeline_facts']
                        },
                        fact_statement: { type: 'string', description: 'The established fact' },
                        source_book_id: { type: 'integer', description: 'Book where this fact is established' },
                        source_chapter_id: { type: 'integer', description: 'Chapter where this fact is established' },
                        confidence_level: { type: 'integer', description: 'Confidence in this fact (1-10)', minimum: 1, maximum: 10, default: 10 },
                        contradicts_fact_id: { type: 'integer', description: 'If this contradicts another fact, reference it' },
                        verification_notes: { type: 'string', description: 'Notes about verification or sources' }
                    },
                    required: ['series_id', 'fact_category', 'fact_statement']
                }
            },
            {
                name: 'verify_fact_consistency',
                description: 'Verify consistency of established facts across the series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        fact_category: { type: 'string', description: 'Optional: specific category to check' },
                        auto_resolve_conflicts: { type: 'boolean', description: 'Attempt to resolve conflicts automatically', default: false }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'export_series_data',
                description: 'Export comprehensive series data for backup or analysis',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        export_format: { 
                            type: 'string',
                            enum: ['json', 'xml', 'csv', 'sql_dump'],
                            default: 'json'
                        },
                        include_content: { type: 'boolean', description: 'Include chapter content', default: false },
                        include_secrets: { type: 'boolean', description: 'Include secret information', default: false },
                        data_types: {
                            type: 'array',
                            items: { 
                                type: 'string',
                                enum: ['books', 'chapters', 'characters', 'plot_threads', 'locations', 'world_elements', 'cases', 'evidence', 'timeline', 'notes', 'sessions']
                            },
                            description: 'Types of data to include in export'
                        }
                    },
                    required: ['series_id']
                }
            }
        ];
    }

    getToolHandler(toolName) {
        // Character Knowledge State Tracker tools
        if (toolName === 'set_character_knowledge_state') {
            return this.handleSetCharacterKnowledgeState;
        } else if (toolName === 'check_character_can_reference') {
            return this.handleCheckCharacterCanReference;
        } else if (toolName === 'get_character_knowledge_state') {
            return this.handleGetCharacterKnowledgeState;
        } else if (toolName === 'validate_scene_against_knowledge') {
            return this.handleValidateSceneAgainstKnowledge;
        }
        // Handle other tools
        const handlers = {
            'set_character_knowledge_state': this.setCharacterKnowledgeState,
            'check_character_can_reference': this.checkCharacterCanReference,
            'get_character_knowledge_state': this.getCharacterKnowledgeState,
            'validate_scene_against_knowledge': this.validateSceneAgainstKnowledge,
            'search_series_content': this.searchSeriesContent,
            'create_research_note': this.createResearchNote,
            'get_research_notes': this.getResearchNotes,
            'check_series_continuity': this.checkSeriesContinuity,
            'cross_reference_elements': this.crossReferenceElements,
            'generate_series_report': this.generateSeriesReport,
            'track_character_mentions': this.trackCharacterMentions,
            'analyze_plot_consistency': this.analyzePlotConsistency,
            'find_research_gaps': this.findResearchGaps,
            'create_fact_database': this.createFactDatabase,
            'verify_fact_consistency': this.verifyFactConsistency,
            'export_series_data': this.exportSeriesData
        };

        return handlers[toolName];
    }

    // Character Knowledge State Tracker handlers
    async handleSetCharacterKnowledgeState(args) {
        try {
            const characterKnowledgeController = new CharacterKnowledgeController(this.db);
            const result = await characterKnowledgeController.setKnowledgeState(args);
            return result;
        } catch (error) {
            console.error('Error in set_character_knowledge_state:', error);
            throw error;
        }
    }

    async handleCheckCharacterCanReference(args) {
        try {
            const characterKnowledgeController = new CharacterKnowledgeController(this.db);
            const result = await characterKnowledgeController.canReference(args);
            return result;
        } catch (error) {
            console.error('Error in check_character_can_reference:', error);
            throw error;
        }
    }

    async handleGetCharacterKnowledgeState(args) {
        try {
            const characterKnowledgeController = new CharacterKnowledgeController(this.db);
            const result = await characterKnowledgeController.getCharacterKnowledgeState(args);
            return result;
        } catch (error) {
            console.error('Error in get_character_knowledge_state:', error);
            throw error;
        }
    }

    async handleValidateSceneAgainstKnowledge(args) {
        try {
            const characterKnowledgeController = new CharacterKnowledgeController(this.db);
            const result = await characterKnowledgeController.validateScene(args);
            return result;
        } catch (error) {
            console.error('Error in validate_scene_against_knowledge:', error);
            throw error;
        }
    }

    async setCharacterKnowledgeState(args) {
        this.validateRequired(args, ['character_id', 'book_id', 'chapter_id', 'knowledge_item', 'knowledge_state']);
        
        await this.validateCharacterExists(args.character_id);
        await this.validateBookExists(args.book_id);
        await this.validateChapterExists(args.chapter_id);
        
        const knowledgeData = {
            ...args,
            created_by: 'research-continuity-server',
            series_id: await this.getSeriesIdByBook(args.book_id)
        };
        
        // Upsert the knowledge state
        const result = await this.db.upsert('character_knowledge', knowledgeData, ['character_id', 'book_id', 'chapter_id', 'knowledge_item']);
        
        return {
            knowledge_state: result,
            message: `Set knowledge state for character ${args.character_id} in ${args.book_id}#${args.chapter_id}`
        };
    }

    async checkCharacterCanReference(args) {
        this.validateRequired(args, ['character_id', 'knowledge_item', 'at_chapter']);
        
        await this.validateCharacterExists(args.character_id);
        
        const knowledgeState = await this.getCharacterKnowledgeStateInternal(args.character_id, args.at_chapter);
        
        const canReference = this.evaluateReferenceAbility(knowledgeState, args.knowledge_item);
        
        return {
            character_id: args.character_id,
            knowledge_item: args.knowledge_item,
            at_chapter: args.at_chapter,
            can_reference: canReference
        };
    }

    async getCharacterKnowledgeState(args) {
        this.validateRequired(args, ['character_id', 'chapter_id']);
        
        await this.validateCharacterExists(args.character_id);
        
        const knowledgeState = await this.getCharacterKnowledgeStateInternal(args.character_id, args.chapter_id);
        
        return {
            character_id: args.character_id,
            chapter_id: args.chapter_id,
            knowledge_state: knowledgeState
        };
    }

    async validateSceneAgainstKnowledge(args) {
        this.validateRequired(args, ['character_id', 'chapter_id', 'scene_content']);
        
        await this.validateCharacterExists(args.character_id);
        
        const knowledgeState = await this.getCharacterKnowledgeStateInternal(args.character_id, args.chapter_id);
        
        const validationResults = this.validateSceneContent(knowledgeState, args.scene_content, args.content_type);
        
        return {
            character_id: args.character_id,
            chapter_id: args.chapter_id,
            scene_content: args.scene_content,
            validation_results: validationResults
        };
    }

    async searchSeriesContent(args) {
        this.validateRequired(args, ['series_id', 'search_term']);
        
        await this.validateSeriesExists(args.series_id);
        
        const contentTypes = args.content_types || ['characters', 'plot_threads', 'locations', 'world_elements', 'cases', 'evidence', 'notes'];
        const results = await this.db.searchContent(args.series_id, args.search_term, contentTypes);
        
        // Apply advanced filtering based on search type
        const filteredResults = this.applySearchFiltering(results, args);
        
        // Apply book range filter if specified
        if (args.book_range) {
            this.applyBookRangeFilter(filteredResults, args.book_range);
        }
        
        // Limit results per content type
        const maxResults = args.max_results || 20;
        Object.keys(filteredResults).forEach(key => {
            if (Array.isArray(filteredResults[key])) {
                filteredResults[key] = filteredResults[key].slice(0, maxResults);
            }
        });
        
        return {
            search_results: filteredResults,
            search_metadata: {
                search_term: args.search_term,
                search_type: args.search_type,
                content_types_searched: contentTypes,
                total_results: Object.values(filteredResults).flat().length
            }
        };
    }

    async createResearchNote(args) {
        this.validateRequired(args, ['series_id', 'note_type', 'title', 'content']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Validate related entities if provided
        if (args.related_characters) {
            for (const charId of args.related_characters) {
                await this.validateCharacterExists(charId);
            }
        }
        
        if (args.related_books) {
            for (const bookId of args.related_books) {
                await this.validateBookExists(bookId);
            }
        }
        
        const noteData = {
            ...args,
            created_by: 'research-continuity-server'
        };
        
        const note = await this.db.create('series_notes', noteData);
        
        return {
            note,
            message: `Created ${args.note_type} note "${note.title}" with ID ${note.id}`
        };
    }

    async getResearchNotes(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT sn.*, 
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as related_character_names,
                   array_agg(DISTINCT b.title) FILTER (WHERE b.id IS NOT NULL) as related_book_titles
            FROM series_notes sn
            LEFT JOIN characters c ON c.id = ANY(sn.related_characters)
            LEFT JOIN books b ON b.id = ANY(sn.related_books)
            WHERE sn.series_id = $1
        `;
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.note_type) {
            query += ` AND sn.note_type = $${paramIndex}`;
            params.push(args.note_type);
            paramIndex++;
        }

        if (args.priority) {
            query += ` AND sn.priority = $${paramIndex}`;
            params.push(args.priority);
            paramIndex++;
        }

        if (args.status) {
            query += ` AND sn.status = $${paramIndex}`;
            params.push(args.status);
            paramIndex++;
        } else if (!args.include_resolved) {
            query += ` AND sn.status != 'resolved'`;
        }

        if (args.character_id) {
            query += ` AND $${paramIndex} = ANY(sn.related_characters)`;
            params.push(args.character_id);
            paramIndex++;
        }

        if (args.book_id) {
            query += ` AND $${paramIndex} = ANY(sn.related_books)`;
            params.push(args.book_id);
            paramIndex++;
        }

        if (args.tags && args.tags.length > 0) {
            query += ` AND sn.tags && $${paramIndex}`;
            params.push(args.tags);
            paramIndex++;
        }

        if (args.search_content) {
            query += ` AND (sn.title ILIKE $${paramIndex} OR sn.content ILIKE $${paramIndex})`;
            params.push(`%${args.search_content}%`);
            paramIndex++;
        }

        query += ` GROUP BY sn.id`;
        
        // Apply sorting
        const sortBy = args.sort_by || 'priority';
        if (sortBy === 'priority') {
            query += ' ORDER BY sn.priority DESC, sn.created_at DESC';
        } else {
            query += ` ORDER BY sn.${sortBy} DESC`;
        }
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async checkSeriesContinuity(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const continuityIssues = {
            character_issues: [],
            timeline_issues: [],
            world_issues: [],
            plot_issues: [],
            general_issues: []
        };

        if (args.check_type === 'all' || args.check_type === 'character_consistency') {
            continuityIssues.character_issues = await this.checkCharacterContinuity(args.series_id, args.book_range);
        }

        if (args.check_type === 'all' || args.check_type === 'timeline_consistency') {
            continuityIssues.timeline_issues = await this.checkTimelineContinuity(args.series_id, args.book_range);
        }

        if (args.check_type === 'all' || args.check_type === 'world_consistency') {
            continuityIssues.world_issues = await this.checkWorldContinuity(args.series_id, args.book_range);
        }

        if (args.check_type === 'all' || args.check_type === 'plot_consistency') {
            continuityIssues.plot_issues = await this.checkPlotContinuity(args.series_id, args.book_range);
        }

        // Filter by severity threshold
        const threshold = args.severity_threshold || 'medium';
        const filteredIssues = this.filterBySeverity(continuityIssues, threshold);

        // Generate fix suggestions if requested
        let fixSuggestions = {};
        if (args.auto_fix_suggestions) {
            fixSuggestions = this.generateFixSuggestions(filteredIssues);
        }

        return {
            continuity_analysis: filteredIssues,
            fix_suggestions: fixSuggestions,
            summary: {
                total_issues: Object.values(filteredIssues).flat().length,
                critical_issues: Object.values(filteredIssues).flat().filter(issue => issue.severity === 'critical').length,
                check_scope: args.check_type,
                series_id: args.series_id
            }
        };
    }

    async crossReferenceElements(args) {
        this.validateRequired(args, ['series_id', 'element_type', 'element_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Validate the element exists
        const elementTable = this.getTableForElementType(args.element_type);
        const element = await this.db.findById(elementTable, args.element_id);
        if (!element) {
            throw new Error(`${args.element_type} with ID ${args.element_id} not found`);
        }
        
        const references = {};
        const referenceTypes = args.reference_types || ['direct_mentions', 'timeline_overlap', 'shared_locations'];
        
        for (const refType of referenceTypes) {
            references[refType] = await this.findReferences(
                args.series_id, 
                args.element_type, 
                args.element_id, 
                refType, 
                args.depth_level || 2
            );
        }
        
        return {
            element_info: {
                type: args.element_type,
                id: args.element_id,
                name: element.name || element.title || element.element_name || `${args.element_type} ${args.element_id}`
            },
            cross_references: references,
            reference_summary: {
                total_connections: Object.values(references).flat().length,
                strongest_connections: this.identifyStrongestConnections(references)
            }
        };
    }

    async generateSeriesReport(args) {
        this.validateRequired(args, ['series_id', 'report_type']);
        
        await this.validateSeriesExists(args.series_id);
        
        let report = {};
        
        switch (args.report_type) {
            case 'series_bible':
                report = await this.generateSeriesBible(args);
                break;
            case 'character_profiles':
                report = await this.generateCharacterProfiles(args);
                break;
            case 'plot_summary':
                report = await this.generatePlotSummary(args);
                break;
            case 'world_guide':
                report = await this.generateWorldGuide(args);
                break;
            case 'continuity_report':
                report = await this.generateContinuityReport(args);
                break;
            case 'progress_report':
                report = await this.generateProgressReport(args);
                break;
            case 'publishing_timeline':
                report = await this.generatePublishingTimeline(args);
                break;
            default:
                throw new Error(`Unknown report type: ${args.report_type}`);
        }
        
        if (args.format === 'markdown') {
            return { report_markdown: this.formatReportAsMarkdown(report, args.report_type) };
        } else if (args.format === 'html') {
            return { report_html: this.formatReportAsHTML(report, args.report_type) };
        } else if (args.format === 'summary') {
            return { report_summary: this.createReportSummary(report, args.report_type) };
        }
        
        return { report };
    }

    async trackCharacterMentions(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT c.id, c.name, c.character_type, c.importance_level,
                   COUNT(DISTINCT te.id) as timeline_mentions,
                   COUNT(DISTINCT cd.id) as development_events,
                   COUNT(DISTINCT cr.id) as relationship_events,
                   array_agg(DISTINCT b.book_number ORDER BY b.book_number) as books_appeared,
                   MIN(b.book_number) as first_book_appearance,
                   MAX(b.book_number) as last_book_appearance
            FROM characters c
            LEFT JOIN timeline_events te ON c.id = ANY(te.characters_involved)
            LEFT JOIN character_development cd ON c.id = cd.character_id
            LEFT JOIN character_relationships cr ON c.id = cr.character1_id OR c.id = cr.character2_id
            LEFT JOIN books b ON te.book_id = b.id OR cd.book_id = b.id
            WHERE c.series_id = $1
        `;
        let params = [args.series_id];

        if (args.character_id) {
            query += ` AND c.id = $2`;
            params.push(args.character_id);
        }

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

        query += ` GROUP BY c.id, c.name, c.character_type, c.importance_level ORDER BY c.importance_level DESC, timeline_mentions DESC`;
        
        const result = await this.db.query(query, params);
        
        return {
            character_mentions: result.rows.map(char => ({
                ...char,
                total_mentions: parseInt(char.timeline_mentions) + parseInt(char.development_events),
                mention_density: this.calculateMentionDensity(char),
                mention_analysis: this.analyzeMentionPattern(char)
            })),
            mention_summary: {
                most_mentioned_character: result.rows[0]?.name || 'None',
                total_characters_tracked: result.rows.length,
                mention_distribution: this.calculateMentionDistribution(result.rows)
            }
        };
    }

    async analyzePlotConsistency(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const analysis = {};
        
        switch (args.analysis_focus) {
            case 'resolution_tracking':
                analysis = await this.analyzeResolutionTracking(args);
                break;
            case 'pacing_analysis':
                analysis = await this.analyzePacingConsistency(args);
                break;
            case 'character_involvement':
                analysis = await this.analyzeCharacterInvolvement(args);
                break;
            case 'timeline_consistency':
                analysis = await this.analyzeTimelineConsistency(args);
                break;
            default:
                analysis = await this.analyzeResolutionTracking(args);
        }
        
        return {
            plot_analysis: analysis,
            consistency_score: this.calculateConsistencyScore(analysis),
            recommendations: this.generatePlotRecommendations(analysis)
        };
    }

    async findResearchGaps(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const gaps = {};
        
        switch (args.gap_type) {
            case 'character_development':
                gaps = await this.findCharacterDevelopmentGaps(args);
                break;
            case 'world_building':
                gaps = await this.findWorldBuildingGaps(args);
                break;
            case 'plot_details':
                gaps = await this.findPlotDetailGaps(args);
                break;
            case 'technical_accuracy':
                gaps = await this.findTechnicalAccuracyGaps(args);
                break;
            case 'historical_accuracy':
                gaps = await this.findHistoricalAccuracyGaps(args);
                break;
            default:
                gaps = await this.findCharacterDevelopmentGaps(args);
        }
        
        return {
            research_gaps: gaps,
            priority_gaps: gaps.filter(gap => gap.priority >= (args.priority_threshold || 3)),
            gap_summary: {
                total_gaps: gaps.length,
                high_priority_gaps: gaps.filter(gap => gap.priority >= 4).length,
                research_suggestions: this.generateResearchSuggestions(gaps)
            }
        };
    }

    async createFactDatabase(args) {
        this.validateRequired(args, ['series_id', 'fact_category', 'fact_statement']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Store facts as special research notes
        const factNote = await this.db.create('series_notes', {
            series_id: args.series_id,
            note_type: 'established_fact',
            category: args.fact_category,
            title: `Fact: ${args.fact_statement.substring(0, 50)}...`,
            content: JSON.stringify({
                fact_statement: args.fact_statement,
                confidence_level: args.confidence_level || 10,
                source_book_id: args.source_book_id,
                source_chapter_id: args.source_chapter_id,
                contradicts_fact_id: args.contradicts_fact_id,
                verification_notes: args.verification_notes
            }),
            priority: 5,
            created_by: 'research-continuity-server'
        });
        
        return {
            fact_record: factNote,
            message: `Created fact record for ${args.fact_category}: "${args.fact_statement.substring(0, 50)}..."`
        };
    }

    async verifyFactConsistency(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Get all established facts
        let query = `
            SELECT * FROM series_notes 
            WHERE series_id = $1 AND note_type = 'established_fact'
        `;
        let params = [args.series_id];
        
        if (args.fact_category) {
            query += ` AND category = $2`;
            params.push(args.fact_category);
        }
        
        query += ` ORDER BY created_at`;
        
        const facts = await this.db.query(query, params);
        
        const conflicts = [];
        const verificationResults = [];
        
        for (const fact of facts.rows) {
            let factData;
            try {
                factData = JSON.parse(fact.content);
            } catch (e) {
                continue;
            }
            
            // Check for contradictions with other facts
            const contradictions = await this.findFactContradictions(fact, facts.rows);
            if (contradictions.length > 0) {
                conflicts.push({
                    fact_id: fact.id,
                    fact_statement: factData.fact_statement,
                    contradictions: contradictions
                });
            }
            
            verificationResults.push({
                fact_id: fact.id,
                fact_statement: factData.fact_statement,
                confidence_level: factData.confidence_level,
                verification_status: contradictions.length === 0 ? 'consistent' : 'conflicted',
                source_verification: await this.verifyFactSource(factData)
            });
        }
        
        return {
            fact_verification: verificationResults,
            conflicts_found: conflicts,
            verification_summary: {
                total_facts: facts.rows.length,
                consistent_facts: verificationResults.filter(f => f.verification_status === 'consistent').length,
                conflicted_facts: conflicts.length,
                overall_consistency_score: this.calculateFactConsistencyScore(verificationResults)
            }
        };
    }

    async exportSeriesData(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const dataTypes = args.data_types || ['books', 'chapters', 'characters', 'plot_threads', 'locations', 'world_elements', 'cases', 'evidence', 'timeline', 'notes'];
        const exportData = {};
        
        // Get series info
        const seriesInfo = await this.db.getSeriesOverview(args.series_id);
        exportData.series_info = seriesInfo[0];
        
        // Export each requested data type
        for (const dataType of dataTypes) {
            switch (dataType) {
                case 'books':
                    exportData.books = await this.exportBooks(args);
                    break;
                case 'chapters':
                    exportData.chapters = await this.exportChapters(args);
                    break;
                case 'characters':
                    exportData.characters = await this.exportCharacters(args);
                    break;
                case 'plot_threads':
                    exportData.plot_threads = await this.exportPlotThreads(args);
                    break;
                case 'locations':
                    exportData.locations = await this.exportLocations(args);
                    break;
                case 'world_elements':
                    exportData.world_elements = await this.exportWorldElements(args);
                    break;
                case 'cases':
                    exportData.cases = await this.exportCases(args);
                    break;
                case 'evidence':
                    exportData.evidence = await this.exportEvidence(args);
                    break;
                case 'timeline':
                    exportData.timeline_events = await this.exportTimelineEvents(args);
                    break;
                case 'notes':
                    exportData.notes = await this.exportNotes(args);
                    break;
                case 'sessions':
                    exportData.writing_sessions = await this.exportWritingSessions(args);
                    break;
            }
        }
        
        // Add metadata
        exportData.export_metadata = {
            exported_at: new Date().toISOString(),
            series_id: args.series_id,
            export_format: args.export_format,
            data_types_included: dataTypes,
            includes_content: args.include_content || false,
            includes_secrets: args.include_secrets || false
        };
        
        if (args.export_format === 'json') {
            return { export_data: JSON.stringify(exportData, null, 2) };
        } else if (args.export_format === 'csv') {
            return { export_data: this.convertToCSV(exportData) };
        }
        
        return { export_data: exportData };
    }

    // Helper methods
    applySearchFiltering(results, args) {
        // Apply different search type filtering logic here
        // For now, return results as-is
        return results;
    }

    applyBookRangeFilter(results, bookRange) {
        // Filter results by book range
        // Implementation would depend on the data structure
        return results;
    }

    getTableForElementType(elementType) {
        const tableMap = {
            'character': 'characters',
            'location': 'locations',
            'plot_thread': 'plot_threads',
            'world_element': 'world_building_elements',
            'case': 'cases'
        };
        return tableMap[elementType] || elementType;
    }

    async findReferences(seriesId, elementType, elementId, refType, depthLevel) {
        // Implement reference finding logic based on reference type
        const references = [];
        
        switch (refType) {
            case 'direct_mentions':
                // Find direct mentions in timeline events, notes, etc.
                break;
            case 'timeline_overlap':
                // Find events that overlap in time
                break;
            case 'shared_locations':
                // Find other elements that share locations
                break;
        }
        
        return references;
    }

    identifyStrongestConnections(references) {
        // Analyze references to identify the strongest connections
        const connections = [];
        Object.entries(references).forEach(([refType, refs]) => {
            refs.forEach(ref => {
                connections.push({
                    type: refType,
                    target: ref,
                    strength: this.calculateConnectionStrength(refType, ref)
                });
            });
        });
        
        return connections.sort((a, b) => b.strength - a.strength).slice(0, 5);
    }

    calculateConnectionStrength(refType, ref) {
        // Calculate connection strength based on reference type and frequency
        let baseStrength = {
            'direct_mentions': 10,
            'timeline_overlap': 7,
            'shared_locations': 5,
            'implied_connections': 3,
            'relationship_chains': 2
        }[refType] || 1;
        
        return baseStrength * (ref.frequency || 1);
    }

    filterBySeverity(issues, threshold) {
        const severityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        const minLevel = severityLevels[threshold] || 2;
        
        const filtered = {};
        Object.entries(issues).forEach(([category, issueList]) => {
            filtered[category] = issueList.filter(issue => 
                severityLevels[issue.severity] >= minLevel
            );
        });
        
        return filtered;
    }

    generateFixSuggestions(issues) {
        const suggestions = {};
        
        Object.entries(issues).forEach(([category, issueList]) => {
            suggestions[category] = issueList.map(issue => ({
                issue_id: issue.id || 'unknown',
                suggestion: this.generateSuggestionForIssue(issue),
                complexity: this.assessFixComplexity(issue),
                automated_fix_possible: this.canAutoFix(issue)
            }));
        });
        
        return suggestions;
    }

    generateSuggestionForIssue(issue) {
        // Generate specific suggestions based on issue type and content
        const suggestionMap = {
            'character_inconsistency': 'Review character descriptions and update for consistency',
            'timeline_conflict': 'Verify event dates and adjust timeline as needed',
            'world_rule_violation': 'Check world building rules and update descriptions',
            'plot_hole': 'Add connecting events or explanation to bridge plot gap'
        };
        
        return suggestionMap[issue.type] || 'Manual review and correction needed';
    }

    assessFixComplexity(issue) {
        // Assess how complex it would be to fix this issue
        const complexityFactors = {
            'character_inconsistency': 2,
            'timeline_conflict': 3,
            'world_rule_violation': 2,
            'plot_hole': 4
        };
        
        return complexityFactors[issue.type] || 3;
    }

    canAutoFix(issue) {
        // Determine if this issue can be automatically fixed
        const autoFixable = ['minor_timeline_conflict', 'character_name_inconsistency'];
        return autoFixable.includes(issue.type);
    }

    async checkCharacterContinuity(seriesId, bookRange) {
        // Implementation for character continuity checking
        return [];
    }

    async checkTimelineContinuity(seriesId, bookRange) {
        // Implementation for timeline continuity checking
        return [];
    }

    async checkWorldContinuity(seriesId, bookRange) {
        // Implementation for world continuity checking
        return [];
    }

    async checkPlotContinuity(seriesId, bookRange) {
        // Implementation for plot continuity checking
        return [];
    }

    calculateMentionDensity(character) {
        const booksAppeared = character.books_appeared ? character.books_appeared.length : 0;
        const totalMentions = parseInt(character.timeline_mentions || 0) + parseInt(character.development_events || 0);
        return booksAppeared > 0 ? Math.round(totalMentions / booksAppeared) : 0;
    }

    analyzeMentionPattern(character) {
        const analysis = [];
        
        if (character.importance_level > 7 && parseInt(character.timeline_mentions) < 5) {
            analysis.push('High importance character with low mention count');
        }
        
        if (character.first_book_appearance && character.last_book_appearance) {
            const span = character.last_book_appearance - character.first_book_appearance + 1;
            const booksAppeared = character.books_appeared ? character.books_appeared.length : 0;
            if (span > booksAppeared * 2) {
                analysis.push('Character has long gaps between appearances');
            }
        }
        
        return analysis;
    }

    calculateMentionDistribution(characters) {
        const total = characters.reduce((sum, char) => sum + parseInt(char.timeline_mentions || 0), 0);
        return {
            protagonist_mentions: characters.filter(c => c.character_type === 'protagonist')
                .reduce((sum, char) => sum + parseInt(char.timeline_mentions || 0), 0),
            total_mentions: total,
            average_mentions_per_character: characters.length > 0 ? Math.round(total / characters.length) : 0
        };
    }

    async generateSeriesBible(args) {
        // Generate comprehensive series bible
        return { type: 'series_bible', content: 'Series bible content would be generated here' };
    }

    async generateCharacterProfiles(args) {
        // Generate character profiles
        return { type: 'character_profiles', content: 'Character profiles would be generated here' };
    }

    async generatePlotSummary(args) {
        // Generate plot summary
        return { type: 'plot_summary', content: 'Plot summary would be generated here' };
    }

    async generateWorldGuide(args) {
        // Generate world guide
        return { type: 'world_guide', content: 'World guide would be generated here' };
    }

    async generateContinuityReport(args) {
        // Generate continuity report
        return { type: 'continuity_report', content: 'Continuity report would be generated here' };
    }

    async generateProgressReport(args) {
        // Generate progress report
        return { type: 'progress_report', content: 'Progress report would be generated here' };
    }

    async generatePublishingTimeline(args) {
        // Generate publishing timeline
        return { type: 'publishing_timeline', content: 'Publishing timeline would be generated here' };
    }

    formatReportAsMarkdown(report, reportType) {
        return `# ${reportType.replace('_', ' ').toUpperCase()}\n\n${JSON.stringify(report, null, 2)}`;
    }

    formatReportAsHTML(report, reportType) {
        return `<h1>${reportType.replace('_', ' ').toUpperCase()}</h1><pre>${JSON.stringify(report, null, 2)}</pre>`;
    }

    createReportSummary(report, reportType) {
        return {
            report_type: reportType,
            generated_at: new Date().toISOString(),
            summary: `${reportType} report generated successfully`
        };
    }

    // Export helper methods
    async exportBooks(args) {
        const result = await this.db.query('SELECT * FROM books WHERE series_id = $1 ORDER BY book_number', [args.series_id]);
        return result.rows;
    }

    async exportChapters(args) {
        let selectFields = 'c.*';
        if (!args.include_content) {
            selectFields = 'c.id, c.book_id, c.chapter_number, c.title, c.word_count, c.target_word_count, c.summary, c.outline, c.status, c.created_at, c.updated_at';
        }
        
        const result = await this.db.query(
            `SELECT ${selectFields} FROM chapters c JOIN books b ON c.book_id = b.id WHERE b.series_id = $1 ORDER BY b.book_number, c.chapter_number`,
            [args.series_id]
        );
        return result.rows;
    }

    async exportCharacters(args) {
        let query = 'SELECT * FROM characters WHERE series_id = $1';
        if (!args.include_secrets) {
            query = 'SELECT id, name, character_type, species, occupation, department, rank_title, age, physical_description, personality_traits, background_story, abilities, goals, moral_alignment, importance_level, status, created_at, updated_at FROM characters WHERE series_id = $1';
        }
        
        const result = await this.db.query(query + ' ORDER BY importance_level DESC, name', [args.series_id]);
        return result.rows;
    }

    async exportPlotThreads(args) {
        const result = await this.db.query('SELECT * FROM plot_threads WHERE series_id = $1 ORDER BY thread_type, start_book', [args.series_id]);
        return result.rows;
    }

    async exportLocations(args) {
        const result = await this.db.query('SELECT * FROM locations WHERE series_id = $1 ORDER BY name', [args.series_id]);
        return result.rows;
    }

    async exportWorldElements(args) {
        const result = await this.db.query('SELECT * FROM world_building_elements WHERE series_id = $1 ORDER BY category, element_name', [args.series_id]);
        return result.rows;
    }

    async exportCases(args) {
        const result = await this.db.query(
            'SELECT c.* FROM cases c JOIN books b ON c.book_id = b.id WHERE b.series_id = $1 ORDER BY b.book_number',
            [args.series_id]
        );
        return result.rows;
    }

    async exportEvidence(args) {
        const result = await this.db.query(
            'SELECT ce.* FROM clues_evidence ce JOIN cases c ON ce.case_id = c.id JOIN books b ON c.book_id = b.id WHERE b.series_id = $1 ORDER BY b.book_number',
            [args.series_id]
        );
        return result.rows;
    }

    async exportTimelineEvents(args) {
        const result = await this.db.query('SELECT * FROM timeline_events WHERE series_id = $1 ORDER BY event_datetime', [args.series_id]);
        return result.rows;
    }

    async exportNotes(args) {
        const result = await this.db.query('SELECT * FROM series_notes WHERE series_id = $1 ORDER BY priority DESC, created_at DESC', [args.series_id]);
        return result.rows;
    }

    async exportWritingSessions(args) {
        const result = await this.db.query(
            'SELECT ws.* FROM writing_sessions ws JOIN books b ON ws.book_id = b.id WHERE b.series_id = $1 ORDER BY ws.session_start DESC',
            [args.series_id]
        );
        return result.rows;
    }

    convertToCSV(data) {
        // Basic CSV conversion - in a real implementation, this would be more sophisticated
        return 'CSV conversion not fully implemented - use JSON export';
    }

    async findFactContradictions(fact, allFacts) {
        // Find contradictions between facts
        return [];
    }

    async verifyFactSource(factData) {
        // Verify the source of a fact
        return { verified: true, source_exists: true };
    }

    calculateFactConsistencyScore(verificationResults) {
        const consistent = verificationResults.filter(f => f.verification_status === 'consistent').length;
        return verificationResults.length > 0 ? Math.round((consistent / verificationResults.length) * 100) : 100;
    }

    // Internal methods
    async getCharacterKnowledgeStateInternal(characterId, chapterId) {
        const result = await this.db.query(
            `SELECT * FROM character_knowledge 
             WHERE character_id = $1 AND chapter_id <= $2 
             ORDER BY chapter_id DESC 
             LIMIT 1`,
            [characterId, chapterId]
        );
        
        return result.rows[0] || null;
    }

    evaluateReferenceAbility(knowledgeState, knowledgeItem) {
        if (!knowledgeState) return false;
        
        // Check if the knowledge item is within the character's knowledge
        const knowsDirectly = knowledgeState.knowledge_item === knowledgeItem && knowledgeState.knowledge_state === 'knows';
        const knowsWithProtection = knowledgeState.knowledge_item === knowledgeItem && knowledgeState.knowledge_state === 'knows_with_oz_protection';
        const suspects = knowledgeState.knowledge_item === knowledgeItem && knowledgeState.knowledge_state === 'suspects';
        
        return knowsDirectly || knowsWithProtection || suspects;
    }

    validateSceneContent(knowledgeState, sceneContent, contentType) {
        if (!knowledgeState) return { valid: true, issues: [] };
        
        const issues = [];
        
        // Check dialogue restrictions
        if (contentType === 'dialogue' && knowledgeState.dialogue_restriction) {
            issues.push(`Dialogue restricted: ${knowledgeState.dialogue_restriction}`);
        }
        
        // Check internal thought restrictions
        if (contentType === 'internal_thought' && !knowledgeState.internal_thought_ok) {
            issues.push(`Internal thought reference not allowed`);
        }
        
        // Add more content validation rules as needed
        
        return {
            valid: issues.length === 0,
            issues
        };
    }
}

// Start the server
const server = new ResearchContinuityServer();
server.run().catch(console.error);