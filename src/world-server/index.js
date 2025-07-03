// src/world-server/index.js - World Building MCP Server
import { BaseMCPServer } from '../shared/base-server.js';

class WorldBuildingServer extends BaseMCPServer {
    constructor() {
        super('world-building-server', '1.0.0');
        
        this.tools = [
            {
                name: 'create_location',
                description: 'Create a new location in the series world',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        name: { type: 'string', description: 'Location name' },
                        location_type: { 
                            type: 'string',
                            description: 'Type of location',
                            enum: ['city', 'building', 'neighborhood', 'crime_scene', 'police_station', 'corporate_office', 'underground', 'virtual_space', 'safe_house', 'bar', 'restaurant', 'residential', 'industrial', 'government']
                        },
                        address: { type: 'string', description: 'Physical address or location identifier' },
                        coordinates: { type: 'string', description: 'GPS coordinates or city grid reference' },
                        description: { type: 'string', description: 'Detailed location description' },
                        atmosphere: { type: 'string', description: 'Mood and atmosphere of the location' },
                        cyberpunk_elements: { type: 'string', description: 'Technology integration, corporate influence, etc.' },
                        fantasy_elements: { type: 'string', description: 'Magical aspects, non-human populations, etc.' },
                        security_level: { 
                            type: 'string',
                            enum: ['public', 'restricted', 'classified', 'corporate', 'underground'],
                            default: 'public'
                        },
                        significance_to_plot: { type: 'string', description: 'How this location relates to the overall story' },
                        recurring_location: { type: 'boolean', description: 'Will this location appear multiple times?', default: false },
                        access_requirements: { type: 'string', description: 'What is needed to access this location' },
                        notable_features: { type: 'string', description: 'Distinctive features or landmarks' }
                    },
                    required: ['series_id', 'name', 'location_type', 'description']
                }
            },
            {
                name: 'update_location',
                description: 'Update location information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        location_id: { type: 'integer', description: 'Location ID' },
                        description: { type: 'string' },
                        atmosphere: { type: 'string' },
                        cyberpunk_elements: { type: 'string' },
                        fantasy_elements: { type: 'string' },
                        security_level: { type: 'string' },
                        significance_to_plot: { type: 'string' },
                        notable_features: { type: 'string' }
                    },
                    required: ['location_id']
                }
            },
            {
                name: 'get_locations',
                description: 'Get locations for a series with optional filtering',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        location_type: { type: 'string', description: 'Filter by location type' },
                        security_level: { type: 'string', description: 'Filter by security level' },
                        recurring_only: { type: 'boolean', description: 'Show only recurring locations', default: false },
                        search_name: { type: 'string', description: 'Search by name' },
                        book_id: { type: 'integer', description: 'Locations that appear in specific book' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'create_world_element',
                description: 'Create a world building element (technology, magic system, organization, etc.)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        category: { 
                            type: 'string',
                            description: 'Category of world element',
                            enum: ['technology', 'magic_system', 'politics', 'corporations', 'law_enforcement', 'underground_groups', 'social_structure', 'economy', 'transportation', 'communication', 'surveillance', 'weapons', 'medical']
                        },
                        element_name: { type: 'string', description: 'Name of the world element' },
                        description: { type: 'string', description: 'Detailed description' },
                        rules_and_mechanics: { type: 'string', description: 'How this element works in your world' },
                        limitations: { type: 'string', description: 'What are the limits or restrictions' },
                        impact_on_society: { type: 'string', description: 'How this affects society in your world' },
                        impact_on_story: { type: 'string', description: 'How this element affects the story' },
                        consistency_notes: { type: 'string', description: 'Important consistency rules to remember' },
                        related_characters: { type: 'array', items: { type: 'integer' }, description: 'Characters who interact with this element' },
                        related_locations: { type: 'array', items: { type: 'integer' }, description: 'Locations where this element is present' }
                    },
                    required: ['series_id', 'category', 'element_name', 'description']
                }
            },
            {
                name: 'update_world_element',
                description: 'Update world building element',
                inputSchema: {
                    type: 'object',
                    properties: {
                        element_id: { type: 'integer', description: 'World element ID' },
                        description: { type: 'string' },
                        rules_and_mechanics: { type: 'string' },
                        limitations: { type: 'string' },
                        impact_on_society: { type: 'string' },
                        impact_on_story: { type: 'string' },
                        consistency_notes: { type: 'string' }
                    },
                    required: ['element_id']
                }
            },
            {
                name: 'get_world_elements',
                description: 'Get world building elements for a series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        category: { type: 'string', description: 'Filter by category' },
                        search_term: { type: 'string', description: 'Search in names and descriptions' },
                        character_id: { type: 'integer', description: 'Elements related to specific character' },
                        location_id: { type: 'integer', description: 'Elements related to specific location' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'check_world_consistency',
                description: 'Check for consistency issues in world building',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        check_type: { 
                            type: 'string',
                            description: 'Type of consistency check',
                            enum: ['technology', 'geography', 'organizations', 'timeline', 'character_abilities', 'all'],
                            default: 'all'
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
                name: 'create_organization',
                description: 'Create an organization (police dept, corporation, criminal group, etc.)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        name: { type: 'string', description: 'Organization name' },
                        org_type: { 
                            type: 'string',
                            description: 'Type of organization',
                            enum: ['law_enforcement', 'corporation', 'criminal', 'government', 'underground', 'medical', 'educational', 'religious', 'military', 'mercenary']
                        },
                        description: { type: 'string', description: 'Organization description' },
                        hierarchy: { type: 'string', description: 'Organizational structure and ranks' },
                        goals: { type: 'string', description: 'Organization goals and mission' },
                        methods: { type: 'string', description: 'How they operate' },
                        resources: { type: 'string', description: 'Financial and material resources' },
                        territory: { type: 'string', description: 'Geographic area of influence' },
                        allies: { type: 'string', description: 'Allied organizations' },
                        enemies: { type: 'string', description: 'Enemy organizations' },
                        secrets: { type: 'string', description: 'Hidden aspects or agendas' },
                        influence_level: { type: 'integer', description: 'Influence (1-10)', minimum: 1, maximum: 10, default: 5 },
                        headquarters_location_id: { type: 'integer', description: 'Main headquarters location' },
                        key_members: { type: 'array', items: { type: 'integer' }, description: 'Key member character IDs' }
                    },
                    required: ['series_id', 'name', 'org_type', 'description']
                }
            },
            {
                name: 'get_organizations',
                description: 'Get organizations in the series',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        org_type: { type: 'string', description: 'Filter by organization type' },
                        influence_min: { type: 'integer', description: 'Minimum influence level' },
                        character_id: { type: 'integer', description: 'Organizations this character belongs to' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'map_world_connections',
                description: 'Generate a map of connections between locations, organizations, and elements',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        focus_type: { 
                            type: 'string',
                            description: 'What to focus the map on',
                            enum: ['locations', 'organizations', 'technology', 'character_movements', 'all'],
                            default: 'all'
                        },
                        center_element_id: { type: 'integer', description: 'Center map on specific element' },
                        book_filter: { type: 'integer', description: 'Show only elements active in specific book' }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'generate_world_guide',
                description: 'Generate a comprehensive world guide for reference',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        guide_type: { 
                            type: 'string',
                            description: 'Type of guide to generate',
                            enum: ['complete', 'locations_only', 'technology_only', 'organizations_only', 'character_reference'],
                            default: 'complete'
                        },
                        include_secrets: { type: 'boolean', description: 'Include secret/hidden information', default: false },
                        format: { 
                            type: 'string',
                            enum: ['markdown', 'json', 'summary'],
                            default: 'markdown'
                        }
                    },
                    required: ['series_id']
                }
            },
            {
                name: 'track_location_usage',
                description: 'Track how often and where locations are used',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID' },
                        book_id: { type: 'integer', description: 'Optional: specific book' },
                        usage_type: { 
                            type: 'string',
                            description: 'Type of usage tracking',
                            enum: ['frequency', 'character_visits', 'plot_importance', 'scene_types'],
                            default: 'frequency'
                        }
                    },
                    required: ['series_id']
                }
            }
        ];
    }

    getToolHandler(toolName) {
        const handlers = {
            'create_location': this.createLocation,
            'update_location': this.updateLocation,
            'get_locations': this.getLocations,
            'create_world_element': this.createWorldElement,
            'update_world_element': this.updateWorldElement,
            'get_world_elements': this.getWorldElements,
            'check_world_consistency': this.checkWorldConsistency,
            'create_organization': this.createOrganization,
            'get_organizations': this.getOrganizations,
            'map_world_connections': this.mapWorldConnections,
            'generate_world_guide': this.generateWorldGuide,
            'track_location_usage': this.trackLocationUsage
        };

        return handlers[toolName];
    }

    async createLocation(args) {
        this.validateRequired(args, ['series_id', 'name', 'location_type', 'description']);
        
        await this.validateSeriesExists(args.series_id);
        
        const location = await this.db.create('locations', args);
        
        return {
            location,
            message: `Created location "${location.name}" (${location.location_type}) with ID ${location.id}`
        };
    }

    async updateLocation(args) {
        this.validateRequired(args, ['location_id']);
        
        const location = await this.db.findById('locations', args.location_id);
        if (!location) {
            throw new Error(`Location with ID ${args.location_id} not found`);
        }
        
        const { location_id, ...updateData } = args;
        const updatedLocation = await this.db.update('locations', location_id, updateData);
        
        return {
            location: updatedLocation,
            message: `Updated location "${updatedLocation.name}"`
        };
    }

    async getLocations(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT l.*, 
                   COUNT(DISTINCT te.id) as timeline_events,
                   COUNT(DISTINCT ce.id) as evidence_found_here,
                   array_agg(DISTINCT b.book_number) FILTER (WHERE b.id IS NOT NULL) as books_appeared
            FROM locations l
            LEFT JOIN timeline_events te ON l.id = te.location_id
            LEFT JOIN clues_evidence ce ON l.id = ce.location_found
            LEFT JOIN books b ON te.book_id = b.id OR ce.book_id = b.id
            WHERE l.series_id = $1
        `;
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.location_type) {
            query += ` AND l.location_type = $${paramIndex}`;
            params.push(args.location_type);
            paramIndex++;
        }

        if (args.security_level) {
            query += ` AND l.security_level = $${paramIndex}`;
            params.push(args.security_level);
            paramIndex++;
        }

        if (args.recurring_only) {
            query += ` AND l.recurring_location = true`;
        }

        if (args.search_name) {
            query += ` AND l.name ILIKE $${paramIndex}`;
            params.push(`%${args.search_name}%`);
            paramIndex++;
        }

        if (args.book_id) {
            query += ` AND (te.book_id = $${paramIndex} OR ce.book_id = $${paramIndex})`;
            params.push(args.book_id);
            paramIndex++;
        }

        query += ` GROUP BY l.id ORDER BY l.recurring_location DESC, l.name`;
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async createWorldElement(args) {
        this.validateRequired(args, ['series_id', 'category', 'element_name', 'description']);
        
        await this.validateSeriesExists(args.series_id);
        
        // Validate related characters and locations if provided
        if (args.related_characters) {
            for (const charId of args.related_characters) {
                await this.validateCharacterExists(charId);
            }
        }
        
        if (args.related_locations) {
            for (const locId of args.related_locations) {
                const location = await this.db.findById('locations', locId);
                if (!location) {
                    throw new Error(`Location with ID ${locId} not found`);
                }
            }
        }
        
        const worldElement = await this.db.create('world_building_elements', args);
        
        return {
            world_element: worldElement,
            message: `Created ${args.category} element "${worldElement.element_name}" with ID ${worldElement.id}`
        };
    }

    async updateWorldElement(args) {
        this.validateRequired(args, ['element_id']);
        
        const element = await this.db.findById('world_building_elements', args.element_id);
        if (!element) {
            throw new Error(`World element with ID ${args.element_id} not found`);
        }
        
        const { element_id, ...updateData } = args;
        const updatedElement = await this.db.update('world_building_elements', element_id, updateData);
        
        return {
            world_element: updatedElement,
            message: `Updated world element "${updatedElement.element_name}"`
        };
    }

    async getWorldElements(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT we.*,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as related_character_names,
                   array_agg(DISTINCT l.name) FILTER (WHERE l.id IS NOT NULL) as related_location_names
            FROM world_building_elements we
            LEFT JOIN characters c ON c.id = ANY(we.related_characters)
            LEFT JOIN locations l ON l.id = ANY(we.related_locations)
            WHERE we.series_id = $1
        `;
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.category) {
            query += ` AND we.category = $${paramIndex}`;
            params.push(args.category);
            paramIndex++;
        }

        if (args.search_term) {
            query += ` AND (we.element_name ILIKE $${paramIndex} OR we.description ILIKE $${paramIndex})`;
            params.push(`%${args.search_term}%`);
            paramIndex++;
        }

        if (args.character_id) {
            query += ` AND $${paramIndex} = ANY(we.related_characters)`;
            params.push(args.character_id);
            paramIndex++;
        }

        if (args.location_id) {
            query += ` AND $${paramIndex} = ANY(we.related_locations)`;
            params.push(args.location_id);
            paramIndex++;
        }

        query += ` GROUP BY we.id ORDER BY we.category, we.element_name`;
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async checkWorldConsistency(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const consistencyIssues = {
            technology_issues: [],
            geography_issues: [],
            organization_issues: [],
            timeline_issues: [],
            character_ability_issues: [],
            general_issues: []
        };

        if (args.check_type === 'all' || args.check_type === 'technology') {
            const techIssues = await this.checkTechnologyConsistency(args.series_id, args.book_range);
            consistencyIssues.technology_issues = techIssues;
        }

        if (args.check_type === 'all' || args.check_type === 'geography') {
            const geoIssues = await this.checkGeographyConsistency(args.series_id, args.book_range);
            consistencyIssues.geography_issues = geoIssues;
        }

        if (args.check_type === 'all' || args.check_type === 'organizations') {
            const orgIssues = await this.checkOrganizationConsistency(args.series_id, args.book_range);
            consistencyIssues.organization_issues = orgIssues;
        }

        if (args.check_type === 'all' || args.check_type === 'timeline') {
            const timelineIssues = await this.checkTimelineConsistency(args.series_id, args.book_range);
            consistencyIssues.timeline_issues = timelineIssues;
        }

        if (args.check_type === 'all' || args.check_type === 'character_abilities') {
            const abilityIssues = await this.checkCharacterAbilityConsistency(args.series_id, args.book_range);
            consistencyIssues.character_ability_issues = abilityIssues;
        }

        return {
            consistency_check: consistencyIssues,
            summary: {
                total_issues: Object.values(consistencyIssues).flat().length,
                critical_issues: Object.values(consistencyIssues).flat().filter(issue => issue.severity === 'critical').length,
                check_type: args.check_type,
                series_id: args.series_id
            }
        };
    }

    async checkTechnologyConsistency(seriesId, bookRange) {
        const issues = [];
        
        // Check for technology elements with conflicting rules
        const techQuery = `
            SELECT * FROM world_building_elements 
            WHERE series_id = $1 AND category = 'technology'
            ORDER BY first_introduced_book
        `;
        
        const techElements = await this.db.query(techQuery, [seriesId]);
        
        // Look for potential conflicts
        for (let i = 0; i < techElements.rows.length; i++) {
            for (let j = i + 1; j < techElements.rows.length; j++) {
                const tech1 = techElements.rows[i];
                const tech2 = techElements.rows[j];
                
                // Check for similar names but different mechanics
                if (tech1.element_name.toLowerCase().includes(tech2.element_name.toLowerCase()) ||
                    tech2.element_name.toLowerCase().includes(tech1.element_name.toLowerCase())) {
                    if (tech1.rules_and_mechanics !== tech2.rules_and_mechanics) {
                        issues.push({
                            type: 'technology_conflict',
                            severity: 'medium',
                            description: `Similar technology elements "${tech1.element_name}" and "${tech2.element_name}" have different mechanics`,
                            elements: [tech1.id, tech2.id]
                        });
                    }
                }
            }
        }
        
        return issues;
    }

    async checkGeographyConsistency(seriesId, bookRange) {
        const issues = [];
        
        // Check for locations with inconsistent descriptions
        const locationQuery = `
            SELECT l.*, COUNT(te.id) as usage_count
            FROM locations l
            LEFT JOIN timeline_events te ON l.id = te.location_id
            WHERE l.series_id = $1
            GROUP BY l.id
        `;
        
        const locations = await this.db.query(locationQuery, [seriesId]);
        
        // Check for duplicate locations (similar names, same type)
        for (let i = 0; i < locations.rows.length; i++) {
            for (let j = i + 1; j < locations.rows.length; j++) {
                const loc1 = locations.rows[i];
                const loc2 = locations.rows[j];
                
                if (loc1.location_type === loc2.location_type &&
                    this.calculateStringSimilarity(loc1.name, loc2.name) > 0.8) {
                    issues.push({
                        type: 'duplicate_location',
                        severity: 'medium',
                        description: `Potentially duplicate locations: "${loc1.name}" and "${loc2.name}"`,
                        locations: [loc1.id, loc2.id]
                    });
                }
            }
        }
        
        return issues;
    }

    async checkOrganizationConsistency(seriesId, bookRange) {
        const issues = [];
        
        // This would need an organizations table - for now return empty
        // In a full implementation, we'd check for conflicting org hierarchies, etc.
        
        return issues;
    }

    async checkTimelineConsistency(seriesId, bookRange) {
        const issues = [];
        
        // Check for timeline events that happen in impossible order
        const timelineQuery = `
            SELECT te.*, b.book_number
            FROM timeline_events te
            JOIN books b ON te.book_id = b.id
            WHERE b.series_id = $1
            ORDER BY te.event_datetime
        `;
        
        const events = await this.db.query(timelineQuery, [seriesId]);
        
        // Check for events happening in wrong book order
        for (let i = 1; i < events.rows.length; i++) {
            const prevEvent = events.rows[i - 1];
            const currentEvent = events.rows[i];
            
            if (prevEvent.book_number > currentEvent.book_number) {
                issues.push({
                    type: 'timeline_book_order',
                    severity: 'high',
                    description: `Event in book ${currentEvent.book_number} happens after event in book ${prevEvent.book_number} but has earlier timestamp`,
                    events: [prevEvent.id, currentEvent.id]
                });
            }
        }
        
        return issues;
    }

    async checkCharacterAbilityConsistency(seriesId, bookRange) {
        const issues = [];
        
        // Check for characters gaining/losing abilities inconsistently
        const characterQuery = `
            SELECT c.*, we.element_name, we.rules_and_mechanics
            FROM characters c
            LEFT JOIN world_building_elements we ON c.id = ANY(we.related_characters)
            WHERE c.series_id = $1 AND c.abilities IS NOT NULL
        `;
        
        const characters = await this.db.query(characterQuery, [seriesId]);
        
        // Basic check for protagonist's non-human nature consistency
        const protagonist = characters.rows.find(c => c.character_type === 'protagonist');
        if (protagonist && protagonist.secrets && protagonist.secrets.includes('non-human')) {
            if (!protagonist.abilities || protagonist.abilities.trim() === '') {
                issues.push({
                    type: 'ability_inconsistency',
                    severity: 'medium',
                    description: `Protagonist is non-human but has no special abilities defined`,
                    character_id: protagonist.id
                });
            }
        }
        
        return issues;
    }

    async createOrganization(args) {
        this.validateRequired(args, ['series_id', 'name', 'org_type', 'description']);
        
        await this.validateSeriesExists(args.series_id);
        
        // For now, we'll store organizations as world building elements with category 'organizations'
        // In a full implementation, you might want a separate organizations table
        const orgElement = await this.db.create('world_building_elements', {
            series_id: args.series_id,
            category: 'organizations',
            element_name: args.name,
            description: `${args.description}\n\nType: ${args.org_type}\nHierarchy: ${args.hierarchy || 'Not specified'}\nGoals: ${args.goals || 'Not specified'}\nMethods: ${args.methods || 'Not specified'}`,
            rules_and_mechanics: `Resources: ${args.resources || 'Unknown'}\nTerritory: ${args.territory || 'Unknown'}\nInfluence Level: ${args.influence_level || 5}`,
            impact_on_society: `Allies: ${args.allies || 'None specified'}\nEnemies: ${args.enemies || 'None specified'}`,
            impact_on_story: args.significance_to_plot || 'To be determined',
            consistency_notes: `Secrets: ${args.secrets || 'None specified'}`,
            related_characters: args.key_members || [],
            related_locations: args.headquarters_location_id ? [args.headquarters_location_id] : []
        });
        
        return {
            organization: orgElement,
            message: `Created ${args.org_type} organization "${args.name}" with ID ${orgElement.id}`
        };
    }

    async getOrganizations(args) {
        this.validateRequired(args, ['series_id']);
        
        let query = `
            SELECT we.*,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as key_member_names,
                   array_agg(DISTINCT l.name) FILTER (WHERE l.id IS NOT NULL) as location_names
            FROM world_building_elements we
            LEFT JOIN characters c ON c.id = ANY(we.related_characters)
            LEFT JOIN locations l ON l.id = ANY(we.related_locations)
            WHERE we.series_id = $1 AND we.category = 'organizations'
        `;
        let params = [args.series_id];
        let paramIndex = 2;

        if (args.org_type) {
            query += ` AND we.description LIKE $${paramIndex}`;
            params.push(`%Type: ${args.org_type}%`);
            paramIndex++;
        }

        if (args.character_id) {
            query += ` AND $${paramIndex} = ANY(we.related_characters)`;
            params.push(args.character_id);
            paramIndex++;
        }

        query += ` GROUP BY we.id ORDER BY we.element_name`;
        
        const result = await this.db.query(query, params);
        return result.rows;
    }

    async mapWorldConnections(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const connections = {
            locations: [],
            world_elements: [],
            characters: [],
            relationships: []
        };

        // Get all locations and their connections
        const locationQuery = `
            SELECT l.*, 
                   COUNT(DISTINCT te.id) as event_count,
                   COUNT(DISTINCT ce.id) as evidence_count,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as characters_present
            FROM locations l
            LEFT JOIN timeline_events te ON l.id = te.location_id
            LEFT JOIN clues_evidence ce ON l.id = ce.location_found
            LEFT JOIN characters c ON c.id = ANY(te.characters_involved)
            WHERE l.series_id = $1
            GROUP BY l.id
        `;
        
        const locations = await this.db.query(locationQuery, [args.series_id]);
        connections.locations = locations.rows;

        // Get world elements and their connections
        const elementsQuery = `
            SELECT we.*,
                   array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL) as related_character_names,
                   array_agg(DISTINCT l.name) FILTER (WHERE l.id IS NOT NULL) as related_location_names
            FROM world_building_elements we
            LEFT JOIN characters c ON c.id = ANY(we.related_characters)
            LEFT JOIN locations l ON l.id = ANY(we.related_locations)
            WHERE we.series_id = $1
            GROUP BY we.id
        `;
        
        const elements = await this.db.query(elementsQuery, [args.series_id]);
        connections.world_elements = elements.rows;

        // Get character movement patterns
        const characterMovementQuery = `
            SELECT c.name as character_name, c.id as character_id,
                   l.name as location_name, l.id as location_id,
                   COUNT(te.id) as visit_count
            FROM characters c
            JOIN timeline_events te ON c.id = ANY(te.characters_involved)
            JOIN locations l ON te.location_id = l.id
            WHERE c.series_id = $1
            GROUP BY c.id, c.name, l.id, l.name
            ORDER BY c.name, visit_count DESC
        `;
        
        const movements = await this.db.query(characterMovementQuery, [args.series_id]);
        connections.character_movements = movements.rows;

        return {
            world_connections: connections,
            connection_summary: {
                total_locations: connections.locations.length,
                total_world_elements: connections.world_elements.length,
                most_active_location: connections.locations.reduce((max, loc) => 
                    parseInt(loc.event_count) > parseInt(max.event_count || 0) ? loc : max, connections.locations[0]),
                connection_density: this.calculateConnectionDensity(connections)
            }
        };
    }

    async generateWorldGuide(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        const guide = {
            series_info: await this.db.getSeriesOverview(args.series_id),
            locations: [],
            world_elements: [],
            organizations: [],
            consistency_rules: []
        };

        if (args.guide_type === 'complete' || args.guide_type === 'locations_only') {
            const locations = await this.getLocations({ series_id: args.series_id });
            guide.locations = locations;
        }

        if (args.guide_type === 'complete' || args.guide_type === 'technology_only') {
            const techElements = await this.getWorldElements({ 
                series_id: args.series_id, 
                category: 'technology' 
            });
            guide.world_elements.push(...techElements);
        }

        if (args.guide_type === 'complete' || args.guide_type === 'organizations_only') {
            const orgs = await this.getOrganizations({ series_id: args.series_id });
            guide.organizations = orgs;
        }

        if (args.guide_type === 'complete') {
            const allElements = await this.getWorldElements({ series_id: args.series_id });
            guide.world_elements = allElements;
            
            // Extract consistency rules
            guide.consistency_rules = allElements
                .filter(el => el.consistency_notes && el.consistency_notes.trim() !== '')
                .map(el => ({
                    element: el.element_name,
                    rule: el.consistency_notes
                }));
        }

        if (args.format === 'markdown') {
            return this.formatGuideAsMarkdown(guide, args.include_secrets);
        } else if (args.format === 'summary') {
            return this.formatGuideAsSummary(guide, args.include_secrets);
        }

        return guide;
    }

    formatGuideAsMarkdown(guide, includeSecrets = false) {
        let markdown = `# World Guide: ${guide.series_info[0]?.name || 'Unknown Series'}\n\n`;
        
        if (guide.locations.length > 0) {
            markdown += `## Locations\n\n`;
            guide.locations.forEach(loc => {
                markdown += `### ${loc.name}\n`;
                markdown += `**Type:** ${loc.location_type}\n`;
                markdown += `**Security:** ${loc.security_level}\n`;
                markdown += `${loc.description}\n\n`;
                if (loc.cyberpunk_elements) {
                    markdown += `**Tech Elements:** ${loc.cyberpunk_elements}\n`;
                }
                if (loc.fantasy_elements) {
                    markdown += `**Fantasy Elements:** ${loc.fantasy_elements}\n`;
                }
                markdown += `\n`;
            });
        }

        if (guide.world_elements.length > 0) {
            markdown += `## World Elements\n\n`;
            const byCategory = {};
            guide.world_elements.forEach(el => {
                if (!byCategory[el.category]) byCategory[el.category] = [];
                byCategory[el.category].push(el);
            });
            
            Object.keys(byCategory).forEach(category => {
                markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}\n\n`;
                byCategory[category].forEach(el => {
                    markdown += `#### ${el.element_name}\n`;
                    markdown += `${el.description}\n\n`;
                    if (el.rules_and_mechanics) {
                        markdown += `**How it works:** ${el.rules_and_mechanics}\n\n`;
                    }
                });
            });
        }

        return { world_guide_markdown: markdown };
    }

    formatGuideAsSummary(guide, includeSecrets = false) {
        return {
            world_guide_summary: {
                total_locations: guide.locations.length,
                recurring_locations: guide.locations.filter(l => l.recurring_location).length,
                world_elements_by_category: guide.world_elements.reduce((acc, el) => {
                    acc[el.category] = (acc[el.category] || 0) + 1;
                    return acc;
                }, {}),
                organizations: guide.organizations.length,
                key_consistency_rules: guide.consistency_rules.length
            }
        };
    }

    async trackLocationUsage(args) {
        this.validateRequired(args, ['series_id']);
        
        await this.validateSeriesExists(args.series_id);
        
        let query = `
            SELECT l.*, 
                   COUNT(DISTINCT te.id) as timeline_events,
                   COUNT(DISTINCT ce.id) as evidence_count,
                   COUNT(DISTINCT te.book_id) as books_used_in,
                   array_agg(DISTINCT b.book_number ORDER BY b.book_number) as book_numbers
            FROM locations l
            LEFT JOIN timeline_events te ON l.id = te.location_id
            LEFT JOIN clues_evidence ce ON l.id = ce.location_found
            LEFT JOIN books b ON te.book_id = b.id OR ce.book_id = b.id
            WHERE l.series_id = $1
        `;
        let params = [args.series_id];

        if (args.book_id) {
            query += ` AND (te.book_id = $2 OR ce.book_id = $2)`;
            params.push(args.book_id);
        }

        query += ` GROUP BY l.id ORDER BY timeline_events DESC, evidence_count DESC`;
        
        const result = await this.db.query(query, params);
        
        return {
            location_usage: result.rows.map(loc => ({
                location_name: loc.name,
                location_type: loc.location_type,
                usage_frequency: parseInt(loc.timeline_events) + parseInt(loc.evidence_count),
                timeline_events: parseInt(loc.timeline_events),
                evidence_count: parseInt(loc.evidence_count),
                books_used_in: parseInt(loc.books_used_in),
                book_numbers: loc.book_numbers,
                recurring: loc.recurring_location
            })),
            usage_summary: {
                most_used_location: result.rows[0]?.name || 'None',
                total_locations: result.rows.length,
                average_usage: this.calculateAverage(result.rows.map(l => 
                    parseInt(l.timeline_events) + parseInt(l.evidence_count)
                ))
            }
        };
    }

    // Helper methods
    calculateStringSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.calculateEditDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    calculateEditDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    calculateConnectionDensity(connections) {
        const totalElements = connections.locations.length + connections.world_elements.length;
        const totalConnections = connections.world_elements.reduce((sum, el) => {
            return sum + (el.related_characters?.length || 0) + (el.related_locations?.length || 0);
        }, 0);
        
        return totalElements > 0 ? totalConnections / totalElements : 0;
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }
}

// Start the server
const server = new WorldBuildingServer();
server.run().catch(console.error);