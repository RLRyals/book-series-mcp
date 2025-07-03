// src/plot-server/index.js - Plot Management MCP Server
import { BaseMCPServer } from '../shared/base-server.js';
import { setupTimelineChronologyRoutes } from './routes/timeline-chronology-routes.js';
import { TimelineChronologyController } from './controllers/timeline-chronology-controller.js';

class PlotManagementServer extends BaseMCPServer {
    constructor() {
        super('plot-management-server', '1.0.0');
        
        this.timelineChronologyController = new TimelineChronologyController(this.db);
        this.setupRoutes();
        this.tools = [
            {
                name: 'create_plot_thread',
                description: 'Create a new plot thread (main arc, mini arc, subplot)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        thread_type: { 
                            type: 'string', 
                            description: 'Type of plot thread',
                            enum: ['series_arc', 'mini_arc', 'main_case', 'subplot', 'character_arc', 'mystery_element']
                        },
                        title: { type: 'string', description: 'Plot thread title' },
                        description: { type: 'string', description: 'Plot thread description' },
                        start_book: { type: 'integer', description: 'Starting book number' },
                        end_book: { type: 'integer', description: 'Ending book number' },
                        importance_level: { type: 'integer', description: 'Importance (1-10)', minimum: 1, maximum: 10, default: 5 },
                        complexity_level: { type: 'integer', description: 'Complexity (1-10)', minimum: 1, maximum: 10, default: 5 },
                        related_characters: { type: 'array', items: { type: 'integer' }, description: 'Related character IDs' },
                        parent_thread_id: { type: 'integer', description: 'Parent thread ID for sub-plots' }
                    },
                    required: ['series_id', 'thread_type', 'title', 'description']
                }
            },
            {
                name: 'update_plot_thread',
                description: 'Update plot thread information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        thread_id: { type: 'integer', description: 'Plot thread ID' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        current_status: { 
                            type: 'string',
                            enum: ['active', 'resolved', 'on_hold', 'abandoned']
                        },
                        resolution_notes: { type: 'string' },
                        end_book: { type: 'integer' }
                    },
                    required: ['thread_id']
                }
            },
            {
                name: 'get_plot_threads',
                description: 'Get plot threads for a series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        thread_type: { type: 'string', description: 'Filter by thread type' },
                        status: { type: 'string', description: 'Filter by status' },
                        book_number: { type: 'integer', description: 'Filter threads active in specific book' },
                        importance_min: { type: 'integer', description: 'Minimum importance level' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'create_case',
                description: 'Create a new case for a book',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Book ID' },
                        case_number: { type: 'string', description: 'Police case number' },
                        case_name: { type: 'string', description: 'Case name/title' },
                        case_type: { 
                            type: 'string',
                            description: 'Type of case',
                            enum: ['murder', 'missing_person', 'conspiracy', 'fraud', 'robbery', 'assault', 'cybercrime', 'supernatural', 'terrorism', 'corruption']
                        },
                        priority_level: { 
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'urgent'],
                            default: 'medium'
                        },
                        victim_count: { type: 'integer', description: 'Number of victims', default: 1 },
                        victim_info: { type: 'string', description: 'Information about victim(s)' },
                        suspects: { type: 'string', description: 'Information about suspects' },
                        evidence_summary: { type: 'string', description: 'Summary of evidence' },
                        supernatural_elements: { type: 'string', description: 'Any supernatural aspects' },
                        tech_elements: { type: 'string', description: 'Technology/cyberpunk elements' },
                        connection_to_series_arc: { type: 'string', description: 'How this connects to main series arc' },
                        connection_to_mini_arc: { type: 'string', description: 'How this connects to mini arc' },
                        assigned_detectives: { type: 'array', items: { type: 'integer' }, description: 'Detective character IDs' }
                    },
                    required: ['book_id', 'case_name', 'case_type']
                }
            },
            {
                name: 'update_case',
                description: 'Update case information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        case_id: { type: 'integer', description: 'Case ID' },
                        case_status: { 
                            type: 'string',
                            enum: ['open', 'solved', 'cold', 'closed']
                        },
                        investigation_notes: { type: 'string' },
                        forensic_details: { type: 'string' },
                        resolution: { type: 'string' },
                        case_closed_date: { type: 'string', format: 'date' }
                    },
                    required: ['case_id']
                }
            },
            {
                name: 'get_cases',
                description: 'Get cases for a book or series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Optional: specific book ID' },
                        series_id: { type: 'integer', description: 'Optional: all cases in series' },
                        case_status: { type: 'string', description: 'Filter by case status' },
                        case_type: { type: 'string', description: 'Filter by case type' },
                        detective_id: { type: 'integer', description: 'Filter by assigned detective' }
                    }
                }
            },
            {
                name: 'add_evidence',
                description: 'Add evidence or clue to a case',
                inputSchema: {
                    type: 'object',
                    properties: {
                        case_id: { type: 'integer', description: 'Case ID' },
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_id: { type: 'integer', description: 'Optional: Chapter ID where found' },
                        evidence_type: { 
                            type: 'string',
                            description: 'Type of evidence',
                            enum: ['physical', 'digital', 'testimony', 'forensic', 'supernatural', 'financial', 'surveillance']
                        },
                        evidence_name: { type: 'string', description: 'Name/title of evidence' },
                        description: { type: 'string', description: 'Detailed description' },
                        location_found: { type: 'integer', description: 'Location ID where found' },
                        discovered_by: { type: 'integer', description: 'Character ID who discovered it' },
                        discovered_datetime: { type: 'string', format: 'date-time', description: 'When discovered' },
                        forensic_analysis: { type: 'string', description: 'Forensic analysis results' },
                        significance_to_case: { type: 'string', description: 'How this relates to the case' },
                        reliability_level: { type: 'integer', description: 'Reliability (1-10)', minimum: 1, maximum: 10, default: 5 },
                        red_herring: { type: 'boolean', description: 'Is this a red herring?', default: false }
                    },
                    required: ['case_id', 'book_id', 'evidence_type', 'evidence_name', 'description']
                }
            },
            {
                name: 'get_evidence',
                description: 'Get evidence for a case',
                inputSchema: {
                    type: 'object',
                    properties: {
                        case_id: { type: 'integer', description: 'Case ID' },
                        evidence_type: { type: 'string', description: 'Filter by evidence type' },
                        red_herrings_only: { type: 'boolean', description: 'Show only red herrings', default: false },
                        discovered_by: { type: 'integer', description: 'Filter by who discovered it' }
                    },
                    required: ['case_id']
                }
            },
            {
                name: 'create_timeline_event',
                description: 'Create a timeline event',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        book_id: { type: 'integer', description: 'Book ID' },
                        chapter_id: { type: 'integer', description: 'Optional: Chapter ID' },
                        case_id: { type: 'integer', description: 'Optional: Related case ID' },
                        event_datetime: { type: 'string', format: 'date-time', description: 'When event occurred' },
                        event_description: { type: 'string', description: 'Event description' },
                        event_type: { 
                            type: 'string',
                            enum: ['crime', 'investigation', 'revelation', 'character_development', 'plot_advancement', 'clue_discovery']
                        },
                        characters_involved: { type: 'array', items: { type: 'integer' }, description: 'Character IDs involved' },
                        location_id: { type: 'integer', description: 'Where event occurred' },
                        plot_thread_ids: { type: 'array', items: { type: 'integer' }, description: 'Related plot thread IDs' },
                        significance: { 
                            type: 'string',
                            enum: ['low', 'medium', 'high', 'critical'],
                            default: 'medium'
                        },
                        public_knowledge: { type: 'boolean', description: 'Is this public knowledge?', default: false },
                        police_knowledge: { type: 'boolean', description: 'Do police know about this?', default: false }
                    },
                    required: ['series_id', 'book_id', 'event_datetime', 'event_description', 'event_type']
                }
            },
            {
                name: 'get_timeline',
                description: 'Get timeline events for series, book, or case',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Optional: Series ID' },
                        book_id: { type: 'integer', description: 'Optional: Book ID' },
                        case_id: { type: 'integer', description: 'Optional: Case ID' },
                        character_id: { type: 'integer', description: 'Optional: Events involving character' },
                        start_date: { type: 'string', format: 'date-time', description: 'Filter from date' },
                        end_date: { type: 'string', format: 'date-time', description: 'Filter to date' },
                        event_type: { type: 'string', description: 'Filter by event type' },
                        significance: { type: 'string', description: 'Filter by significance level' }
                    }
                }
            },
            {
                name: 'analyze_plot_structure',
                description: 'Analyze plot structure and pacing for a book or series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        book_id: { type: 'integer', description: 'Optional: Analyze specific book' },
                        series_id: { type: 'integer', description: 'Optional: Analyze entire series' },
                        analysis_type: { 
                            type: 'string',
                            enum: ['pacing', 'thread_resolution', 'character_involvement', 'case_complexity', 'arc_progression'],
                            default: 'pacing'
                        }
                    }
                }
            },
            {
                name: 'validate_timeline_event',
                description: 'Validate event against established timeline',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer' },
                        book_id: { type: 'integer' },
                        chapter_id: { type: 'integer' },
                        event_datetime: { type: 'string', format: 'date-time' },
                        event_description: { type: 'string' },
                        character_ids: { type: 'array', items: { type: 'integer' } },
                        location_id: { type: 'integer' },
                        previous_event_reference: { type: 'string' }
                    },
                    required: ['series_id', 'book_id', 'chapter_id', 'event_datetime', 'event_description', 'character_ids']
                }
            },
            {
                name: 'get_character_status_at_time',
                description: 'Check character location/status at specific time',
                inputSchema: {
                    type: 'object',
                    properties: {
                        character_id: { type: 'integer' },
                        datetime: { type: 'string', format: 'date-time' }
                    },
                    required: ['character_id', 'datetime']
                }
            },
            {
                name: 'get_chapter_chronology',
                description: 'Generate chronology report for chapter',
                inputSchema: {
                    type: 'object',
                    properties: {
                        chapter_id: { type: 'integer' }
                    },
                    required: ['chapter_id']
                }
            },
            {
                name: 'validate_chapter_timeline',
                description: 'Validate chapter against series timeline',
                inputSchema: {
                    type: 'object',
                    properties: {
                        chapter_id: { type: 'integer' },
                        events: { type: 'array', items: { type: 'object' } }
                    },
                    required: ['chapter_id', 'events']
                }
            }
        ];
    }

    setupRoutes() {
        setupTimelineChronologyRoutes(this.httpApp, this.db);
    }

    getToolHandler(toolName) {
        const handlers = {
            'create_plot_thread': this.createPlotThread,
            'update_plot_thread': this.updatePlotThread,
            'get_plot_threads': this.getPlotThreads,
            'create_case': this.createCase,
            'update_case': this.updateCase,
            'get_cases': this.getCases,
            'add_evidence': this.addEvidence,
            'get_evidence': this.getEvidence,
            'create_timeline_event': this.createTimelineEvent,
            'get_timeline': this.getTimeline,
            'analyze_plot_structure': this.analyzePlotStructure,
            'validate_timeline_event': this.validateTimelineEvent,
            'get_character_status_at_time': this.getCharacterStatusAtTime,
            'get_chapter_chronology': this.getChapterChronology,
            'validate_chapter_timeline': this.validateChapterTimeline
        };

        return handlers[toolName] || super.getToolHandler(toolName);
    }

    async createPlotThread(args) {
        this.validateRequired(args, ['series_id', 'thread_type', 'title', 'description']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Validate parent thread if specified
        if (args.parent_thread_id) {
            const parentThread = await this.db.findById('plot_threads', args.parent_thread_id);
            if (!parentThread) {
                throw new Error(`Parent thread with ID ${args.parent_thread_id} not found`);
            }
        }
        
        const plotThread = await this.db.create('plot_threads', args);
        
        return {
            plot_thread: plotThread,
            message: `Created ${args.thread_type} "${plotThread.title}" with ID ${plotThread.id}`
        };
    }

    async updatePlotThread(args) {
        this.validateRequired(args, ['thread_id']);
        
        const thread = await this.db.findById('plot_threads', args.thread_id);
        if (!thread) {
            throw new Error(`Plot thread with ID ${args.thread_id} not found`);
        }
        
        const { thread_id, ...updateData } = args;
        const updatedThread = await this.db.update('plot_threads', thread_id, updateData);
        
        return {
            plot_thread: updatedThread,
            message: `Updated plot thread "${updatedThread.title}"`
        };
    }

    async getPlotThreads(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT pt.*, 
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as related_character_names
            FROM plot_threads pt
            LEFT JOIN characters c ON c.id = ANY(pt.related_characters)
            WHERE pt.series_id = $1
        `;
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.thread_type) {
            query += ` AND pt.thread_type = $${paramIndex}`;
            params.push(args.thread_type);
            paramIndex++;
        }

        if (args.status) {
            query += ` AND pt.current_status = $${paramIndex}`;
            params.push(args.status);
            paramIndex++;
        }

        if (args.book_number) {
            query += ` AND (pt.start_book <= $${paramIndex} AND (pt.end_book >= $${paramIndex} OR pt.end_book IS NULL))`;
            params.push(args.book_number);
            paramIndex++;
        }

        if (args.importance_min) {
            query += ` AND pt.importance_level >= $${paramIndex}`;
            params.push(args.importance_min);
            paramIndex++;
        }

        query += ' GROUP BY pt.id ORDER BY pt.importance_level DESC, pt.start_book';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createCase(args) {
        this.validateRequired(args, ['book_id', 'case_name', 'case_type']);
        
        await this.validateBookExists(args.book_id);
        
        // Validate assigned detectives exist
        if (args.assigned_detectives && args.assigned_detectives.length > 0) {
            for (const detectiveId of args.assigned_detectives) {
                await this.validateCharacterExists(detectiveId);
            }
        }
        
        const caseData = {
            ...args,
            case_opened_date: new Date().toISOString().split('T')[0] // Today's date
        };
        
        const newCase = await this.db.create('cases', caseData);
        
        return {
            case: newCase,
            message: `Created case "${newCase.case_name}" with ID ${newCase.id}`
        };
    }

    async updateCase(args) {
        this.validateRequired(args, ['case_id']);
        
        const existingCase = await this.db.findById('cases', args.case_id);
        if (!existingCase) {
            throw new Error(`Case with ID ${args.case_id} not found`);
        }
        
        const { case_id, ...updateData } = args;
        const updatedCase = await this.db.update('cases', case_id, updateData);
        
        return {
            case: updatedCase,
            message: `Updated case "${updatedCase.case_name}"`
        };
    }

    async getCases(args) {
        let query, params;

        if (args.book_id) {
            query = `
                SELECT c.*, b.title as book_title, b.book_number,
                       array_agg(DISTINCT ch.name) FILTER (WHERE ch.id IS NOT NULL) as assigned_detective_names
                FROM cases c
                JOIN books b ON c.book_id = b.id
                LEFT JOIN characters ch ON ch.id = ANY(c.assigned_detectives)
                WHERE c.book_id = $1
            `;
            params = [args.book_id];
        } else if (args.series_id) {
            query = `
                SELECT c.*, b.title as book_title, b.book_number,
                       array_agg(DISTINCT ch.name) FILTER (WHERE ch.id IS NOT NULL) as assigned_detective_names
                FROM cases c
                JOIN books b ON c.book_id = b.id
                LEFT JOIN characters ch ON ch.id = ANY(c.assigned_detectives)
                WHERE b.series_id = $1
            `;
            params = [args.series_id];
        } else {
            throw new Error('Must provide either book_id or series_id');
        }

        let paramIndex = 2;

        if (args.case_status) {
            query += ` AND c.case_status = $${paramIndex}`;
            params.push(args.case_status);
            paramIndex++;
        }

        if (args.case_type) {
            query += ` AND c.case_type = $${paramIndex}`;
            params.push(args.case_type);
            paramIndex++;
        }

        if (args.detective_id) {
            query += ` AND $${paramIndex} = ANY(c.assigned_detectives)`;
            params.push(args.detective_id);
            paramIndex++;
        }

        query += ' GROUP BY c.id, b.title, b.book_number ORDER BY b.book_number, c.created_at';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async addEvidence(args) {
        this.validateRequired(args, ['case_id', 'book_id', 'evidence_type', 'evidence_name', 'description']);
        
        await this.db.findById('cases', args.case_id);
        await this.validateBookExists(args.book_id);
        
        if (args.discovered_by) {
            await this.validateCharacterExists(args.discovered_by);
        }
        
        const evidence = await this.db.create('clues_evidence', args);
        
        return {
            evidence,
            message: `Added ${args.evidence_type} evidence "${evidence.evidence_name}" to case`
        };
    }

    async getEvidence(args) {
        this.validateRequired(args, ['case_id']);
        
        let query = `
            SELECT ce.*, l.name as location_name, c.name as discovered_by_name
            FROM clues_evidence ce
            LEFT JOIN locations l ON ce.location_found = l.id
            LEFT JOIN characters c ON ce.discovered_by = c.id
            WHERE ce.case_id = $1
        `;
        let params = [args.case_id];
        let paramIndex = 2;

        if (args.evidence_type) {
            query += ` AND ce.evidence_type = $${paramIndex}`;
            params.push(args.evidence_type);
            paramIndex++;
        }

        if (args.red_herrings_only) {
            query += ` AND ce.red_herring = true`;
        }

        if (args.discovered_by) {
            query += ` AND ce.discovered_by = $${paramIndex}`;
            params.push(args.discovered_by);
            paramIndex++;
        }

        query += ' ORDER BY ce.discovered_datetime, ce.reliability_level DESC';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createTimelineEvent(args) {
        this.validateRequired(args, ['series_id', 'book_id', 'event_datetime', 'event_description', 'event_type']);
        
        await this.validateSeriesExists(args.series_id);
        await this.validateBookExists(args.book_id);
        
        const timelineEvent = await this.db.create('timeline_events', args);
        
        return {
            timeline_event: timelineEvent,
            message: `Created timeline event "${timelineEvent.event_description.substring(0, 50)}..."`
        };
    }

    async getTimeline(args) {
        let query = `
            SELECT te.*, b.title as book_title, b.book_number,
                   ch.title as chapter_title, ch.chapter_number,
                   c.case_name, l.name as location_name,
                   array_agg(DISTINCT char.name) FILTER (WHERE char.id IS NOT NULL) as character_names
            FROM timeline_events te
            LEFT JOIN books b ON te.book_id = b.id
            LEFT JOIN chapters ch ON te.chapter_id = ch.id
            LEFT JOIN cases c ON te.case_id = c.id
            LEFT JOIN locations l ON te.location_id = l.id
            LEFT JOIN characters char ON char.id = ANY(te.characters_involved)
            WHERE 1=1
        `;
        let params = [];
        let paramIndex = 1;

        if (args.series_id) {
            query += ` AND te.series_id = $${paramIndex}`;
            params.push(args.series_id);
            paramIndex++;
        }

        if (args.book_id) {
            query += ` AND te.book_id = $${paramIndex}`;
            params.push(args.book_id);
            paramIndex++;
        }

        if (args.case_id) {
            query += ` AND te.case_id = $${paramIndex}`;
            params.push(args.case_id);
            paramIndex++;
        }

        if (args.character_id) {
            query += ` AND $${paramIndex} = ANY(te.characters_involved)`;
            params.push(args.character_id);
            paramIndex++;
        }

        if (args.start_date) {
            query += ` AND te.event_datetime >= $${paramIndex}`;
            params.push(args.start_date);
            paramIndex++;
        }

        if (args.end_date) {
            query += ` AND te.event_datetime <= $${paramIndex}`;
            params.push(args.end_date);
            paramIndex++;
        }

        if (args.event_type) {
            query += ` AND te.event_type = $${paramIndex}`;
            params.push(args.event_type);
            paramIndex++;
        }

        if (args.significance) {
            query += ` AND te.significance = $${paramIndex}`;
            params.push(args.significance);
            paramIndex++;
        }

        query += ' GROUP BY te.id, b.title, b.book_number, ch.title, ch.chapter_number, c.case_name, l.name';
        query += ' ORDER BY te.event_datetime';
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async analyzePlotStructure(args) {
        if (!args.book_id && !args.series_id) {
            throw new Error('Must provide either book_id or series_id');
        }

        const analysisType = args.analysis_type || 'pacing';
        
        switch (analysisType) {
            case 'pacing':
                return await this.analyzePacing(args);
            case 'thread_resolution':
                return await this.analyzeThreadResolution(args);
            case 'character_involvement':
                return await this.analyzeCharacterInvolvement(args);
            case 'case_complexity':
                return await this.analyzeCaseComplexity(args);
            case 'arc_progression':
                return await this.analyzeArcProgression(args);
            default:
                throw new Error(`Unknown analysis type: ${analysisType}`);
        }
    }

    async analyzePacing(args) {
        let query, params;
        
        if (args.book_id) {
            query = `
                SELECT te.event_type, te.significance, 
                       DATE_PART('day', te.event_datetime - LAG(te.event_datetime) OVER (ORDER BY te.event_datetime)) as days_since_last,
                       ch.chapter_number
                FROM timeline_events te
                LEFT JOIN chapters ch ON te.chapter_id = ch.id
                WHERE te.book_id = $1
                ORDER BY te.event_datetime
            `;
            params = [args.book_id];
        } else {
            query = `
                SELECT te.event_type, te.significance, b.book_number,
                       DATE_PART('day', te.event_datetime - LAG(te.event_datetime) OVER (PARTITION BY b.id ORDER BY te.event_datetime)) as days_since_last
                FROM timeline_events te
                JOIN books b ON te.book_id = b.id
                WHERE b.series_id = $1
                ORDER BY b.book_number, te.event_datetime
            `;
            params = [args.series_id];
        }
        
        const result = await this.db.query(query, params);
        
        // Analyze pacing patterns
        const events = result.rows;
        const pacingAnalysis = {
            total_events: events.length,
            high_significance_events: events.filter(e => e.significance === 'high' || e.significance === 'critical').length,
            average_days_between_events: this.calculateAverage(events.map(e => e.days_since_last).filter(d => d !== null)),
            event_type_distribution: this.countByProperty(events, 'event_type'),
            pacing_notes: []
        };
        
        // Generate pacing insights
        if (pacingAnalysis.average_days_between_events > 7) {
            pacingAnalysis.pacing_notes.push('Events are spread out - consider tightening pacing');
        }
        
        if (pacingAnalysis.high_significance_events / pacingAnalysis.total_events < 0.2) {
            pacingAnalysis.pacing_notes.push('Low ratio of high-impact events - consider raising stakes');
        }
        
        return pacingAnalysis;
    }

    async analyzeThreadResolution(args) {
        let query, params;
        
        if (args.book_id) {
            // Get all threads that should be active in this book
            query = `
                SELECT pt.*, b.book_number
                FROM plot_threads pt, books b
                WHERE b.id = $1 
                AND pt.series_id = b.series_id
                AND pt.start_book <= b.book_number 
                AND (pt.end_book >= b.book_number OR pt.end_book IS NULL)
            `;
            params = [args.book_id];
        } else {
            query = `
                SELECT * FROM plot_threads 
                WHERE series_id = $1
                ORDER BY thread_type, start_book
            `;
            params = [args.series_id];
        }
        
        const result = await this.db.query(query, params);
        const threads = result.rows;
        
        return {
            total_threads: threads.length,
            resolved_threads: threads.filter(t => t.current_status === 'resolved').length,
            active_threads: threads.filter(t => t.current_status === 'active').length,
            on_hold_threads: threads.filter(t => t.current_status === 'on_hold').length,
            thread_types: this.countByProperty(threads, 'thread_type'),
            resolution_analysis: threads.map(t => ({
                title: t.title,
                type: t.thread_type,
                status: t.current_status,
                books_span: t.end_book ? (t.end_book - t.start_book + 1) : 'ongoing',
                importance: t.importance_level
            }))
        };
    }

    async analyzeCharacterInvolvement(args) {
        let query, params;
        
        if (args.book_id) {
            query = `
                SELECT c.name, c.character_type, c.importance_level,
                       COUNT(te.id) as timeline_events,
                       COUNT(DISTINCT cd.id) as development_events
                FROM characters c
                LEFT JOIN timeline_events te ON c.id = ANY(te.characters_involved) AND te.book_id = $1
                LEFT JOIN character_development cd ON c.id = cd.character_id AND cd.book_id = $1
                WHERE c.series_id = (SELECT series_id FROM books WHERE id = $1)
                GROUP BY c.id, c.name, c.character_type, c.importance_level
                ORDER BY c.importance_level DESC
            `;
            params = [args.book_id];
        } else {
            query = `
                SELECT c.name, c.character_type, c.importance_level,
                       COUNT(DISTINCT te.id) as timeline_events,
                       COUNT(DISTINCT cd.id) as development_events,
                       COUNT(DISTINCT b.id) as books_appeared
                FROM characters c
                LEFT JOIN timeline_events te ON c.id = ANY(te.characters_involved)
                LEFT JOIN character_development cd ON c.id = cd.character_id
                LEFT JOIN books b ON cd.book_id = b.id
                WHERE c.series_id = $1
                GROUP BY c.id, c.name, c.character_type, c.importance_level
                ORDER BY c.importance_level DESC
            `;
            params = [args.series_id];
        }
        
        const result = await this.db.query(query, params);
        
        return {
            character_involvement: result.rows,
            involvement_analysis: {
                highly_involved: result.rows.filter(c => c.timeline_events > 5).length,
                under_utilized: result.rows.filter(c => c.importance_level > 5 && c.timeline_events < 3).length,
                character_types: this.countByProperty(result.rows, 'character_type')
            }
        };
    }

    async analyzeCaseComplexity(args) {
        let query, params;
        
        if (args.book_id) {
            query = `
                SELECT c.*, COUNT(ce.id) as evidence_count,
                       COUNT(DISTINCT te.id) as related_events
                FROM cases c
                LEFT JOIN clues_evidence ce ON c.id = ce.case_id
                LEFT JOIN timeline_events te ON c.id = te.case_id
                WHERE c.book_id = $1
                GROUP BY c.id
            `;
            params = [args.book_id];
        } else {
            query = `
                SELECT c.*, COUNT(ce.id) as evidence_count,
                       COUNT(DISTINCT te.id) as related_events,
                       b.book_number
                FROM cases c
                JOIN books b ON c.book_id = b.id
                LEFT JOIN clues_evidence ce ON c.id = ce.case_id
                LEFT JOIN timeline_events te ON c.id = te.case_id
                WHERE b.series_id = $1
                GROUP BY c.id, b.book_number
                ORDER BY b.book_number
            `;
            params = [args.series_id];
        }
        
        const result = await this.db.query(query, params);
        
        return {
            cases: result.rows.map(c => ({
                case_name: c.case_name,
                case_type: c.case_type,
                status: c.case_status,
                evidence_count: parseInt(c.evidence_count),
                related_events: parseInt(c.related_events),
                complexity_score: this.calculateCaseComplexity(c)
            })),
            complexity_analysis: {
                average_evidence_per_case: this.calculateAverage(result.rows.map(c => parseInt(c.evidence_count))),
                case_types: this.countByProperty(result.rows, 'case_type'),
                resolution_rate: result.rows.filter(c => c.case_status === 'solved').length / result.rows.length
            }
        };
    }

    async analyzeArcProgression(args) {
        if (!args.series_id) {
            throw new Error('Arc progression analysis requires series_id');
        }
        
        const query = `
            SELECT pt.*, 
                   COUNT(DISTINCT te.id) as timeline_events,
                   COUNT(DISTINCT cd.character_id) as characters_involved
            FROM plot_threads pt
            LEFT JOIN timeline_events te ON pt.id = ANY(te.plot_thread_ids)
            LEFT JOIN character_development cd ON cd.book_id IN (
                SELECT id FROM books WHERE series_id = pt.series_id 
                AND book_number BETWEEN pt.start_book AND COALESCE(pt.end_book, 999)
            )
            WHERE pt.series_id = $1 AND pt.thread_type IN ('series_arc', 'mini_arc')
            GROUP BY pt.id
            ORDER BY pt.thread_type, pt.start_book
        `;
        
        const result = await this.db.query(query, [args.series_id]);
        
        return {
            arc_progression: result.rows.map(arc => ({
                title: arc.title,
                type: arc.thread_type,
                books_span: `${arc.start_book}-${arc.end_book || 'ongoing'}`,
                status: arc.current_status,
                timeline_events: parseInt(arc.timeline_events),
                characters_involved: parseInt(arc.characters_involved),
                progression_score: this.calculateProgressionScore(arc)
            })),
            series_overview: {
                total_arcs: result.rows.length,
                completed_arcs: result.rows.filter(a => a.current_status === 'resolved').length,
                active_arcs: result.rows.filter(a => a.current_status === 'active').length
            }
        };
    }

    // Helper methods
    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    countByProperty(items, property) {
        return items.reduce((counts, item) => {
            const value = item[property];
            counts[value] = (counts[value] || 0) + 1;
            return counts;
        }, {});
    }

    calculateCaseComplexity(caseData) {
        let score = 0;
        score += parseInt(caseData.evidence_count) * 2;
        score += parseInt(caseData.related_events);
        score += caseData.victim_count * 3;
        if (caseData.supernatural_elements) score += 5;
        if (caseData.tech_elements) score += 3;
        return score;
    }

    calculateProgressionScore(arc) {
        let score = 0;
        score += parseInt(arc.timeline_events);
        score += parseInt(arc.characters_involved) * 2;
        score += arc.importance_level;
        if (arc.current_status === 'resolved') score += 10;
        return score;
    }
}

// Start the server
const server = new PlotManagementServer();
server.run().catch(console.error);