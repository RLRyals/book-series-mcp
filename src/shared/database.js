// src/shared/database.js - Shared database connection and utilities
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export class DatabaseManager {
    constructor() {
        // Debug environment variables when MCP server starts
           console.error('=== DATABASE DEBUG ===');
           console.error('NODE_ENV:', process.env.NODE_ENV);
           console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
           console.error('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0);
           console.error('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...' || 'undefined');
           console.error('Working directory:', process.cwd());
           console.error('====================');
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Database pool error:', err);
        });
    }

    async query(text, params = []) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW()');
            return { healthy: true, timestamp: result.rows[0].now };
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    async close() {
        await this.pool.end();
    }

    // Common query helpers
    async findById(table, id) {
        const result = await this.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        return result.rows[0];
    }

    async findBySeriesId(table, seriesId, orderBy = 'id') {
        const result = await this.query(
            `SELECT * FROM ${table} WHERE series_id = $1 ORDER BY ${orderBy}`,
            [seriesId]
        );
        return result.rows;
    }

    async create(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table} (${keys.join(', ')}) 
            VALUES (${placeholders}) 
            RETURNING *
        `;
        
        const result = await this.query(query, values);
        return result.rows[0];
    }

    async update(table, id, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
        
        const query = `
            UPDATE ${table} 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING *
        `;
        
        const result = await this.query(query, [id, ...values]);
        return result.rows[0];
    }

    async delete(table, id) {
        const result = await this.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [id]);
        return result.rows[0];
    }

    // Series-specific helpers
    async getSeriesOverview(seriesId = null) {
        let query = 'SELECT * FROM series_overview';
        let params = [];
        
        if (seriesId) {
            query += ' WHERE id = $1';
            params = [seriesId];
        }
        
        const result = await this.query(query, params);
        return result.rows;
    }

    async getBookProgress(seriesId) {
        const result = await this.query(
            'SELECT * FROM book_progress WHERE series_id = $1 ORDER BY book_number',
            [seriesId]
        );
        return result.rows;
    }

    async getCharacterAppearances(seriesId) {
        const result = await this.query(
            'SELECT * FROM character_appearances WHERE series_id = $1 ORDER BY importance_level DESC',
            [seriesId]
        );
        return result.rows;
    }

    // Search functionality
    async searchContent(seriesId, searchTerm, contentTypes = []) {
        const searchPattern = `%${searchTerm}%`;
        const results = {};

        if (contentTypes.length === 0 || contentTypes.includes('characters')) {
            const charResult = await this.query(
                `SELECT id, name, character_type, background_story, secrets, importance_level
                 FROM characters 
                 WHERE series_id = $1 AND (
                   name ILIKE $2 OR background_story ILIKE $2 OR secrets ILIKE $2 OR
                   personality_traits ILIKE $2 OR goals ILIKE $2
                 )
                 ORDER BY importance_level DESC`,
                [seriesId, searchPattern]
            );
            results.characters = charResult.rows;
        }

        if (contentTypes.length === 0 || contentTypes.includes('plot_threads')) {
            const plotResult = await this.query(
                `SELECT id, title, thread_type, description, importance_level
                 FROM plot_threads 
                 WHERE series_id = $1 AND (
                   title ILIKE $2 OR description ILIKE $2
                 )
                 ORDER BY importance_level DESC`,
                [seriesId, searchPattern]
            );
            results.plot_threads = plotResult.rows;
        }

        if (contentTypes.length === 0 || contentTypes.includes('locations')) {
            const locationResult = await this.query(
                `SELECT id, name, location_type, description, significance_to_plot
                 FROM locations 
                 WHERE series_id = $1 AND (
                   name ILIKE $2 OR description ILIKE $2 OR significance_to_plot ILIKE $2
                 )`,
                [seriesId, searchPattern]
            );
            results.locations = locationResult.rows;
        }

        if (contentTypes.length === 0 || contentTypes.includes('notes')) {
            const noteResult = await this.query(
                `SELECT id, title, content, note_type, tags, priority
                 FROM series_notes 
                 WHERE series_id = $1 AND (
                   title ILIKE $2 OR content ILIKE $2 OR $2 = ANY(tags)
                 )
                 ORDER BY priority DESC, created_at DESC`,
                [seriesId, searchPattern]
            );
            results.notes = noteResult.rows;
        }

        if (contentTypes.length === 0 || contentTypes.includes('cases')) {
            const caseResult = await this.query(
                `SELECT c.id, c.case_name, c.case_type, c.victim_info, c.case_status,
                        b.title as book_title, b.book_number
                 FROM cases c
                 JOIN books b ON c.book_id = b.id
                 WHERE b.series_id = $1 AND (
                   c.case_name ILIKE $2 OR c.victim_info ILIKE $2 OR 
                   c.investigation_notes ILIKE $2
                 )
                 ORDER BY b.book_number`,
                [seriesId, searchPattern]
            );
            results.cases = caseResult.rows;
        }

        return results;
    }

    // Continuity checking helpers
    async checkCharacterContinuity(characterId) {
        const character = await this.findById('characters', characterId);
        if (!character) return { error: 'Character not found' };

        // Get all appearances
        const appearances = await this.query(
            `SELECT cd.*, b.title as book_title, b.book_number, ch.title as chapter_title
             FROM character_development cd
             JOIN books b ON cd.book_id = b.id
             LEFT JOIN chapters ch ON cd.chapter_id = ch.id
             WHERE cd.character_id = $1
             ORDER BY b.book_number, ch.chapter_number`,
            [characterId]
        );

        // Get relationships
        const relationships = await this.query(
            `SELECT cr.*, c1.name as character1_name, c2.name as character2_name
             FROM character_relationships cr
             JOIN characters c1 ON cr.character1_id = c1.id
             JOIN characters c2 ON cr.character2_id = c2.id
             WHERE cr.character1_id = $1 OR cr.character2_id = $1`,
            [characterId]
        );

        return {
            character,
            appearances: appearances.rows,
            relationships: relationships.rows,
            continuity_notes: this.generateContinuityNotes(character, appearances.rows)
        };
    }

    generateContinuityNotes(character, appearances) {
        const notes = [];
        
        // Check for timeline consistency
        if (appearances.length > 1) {
            notes.push(`Character appears in ${appearances.length} chapters across ${new Set(appearances.map(a => a.book_number)).size} books`);
        }

        // Check for character development progression
        const developmentTypes = appearances.map(a => a.development_type);
        if (developmentTypes.includes('death') && developmentTypes.some(type => 
            appearances.findIndex(a => a.development_type === type) > 
            appearances.findIndex(a => a.development_type === 'death')
        )) {
            notes.push('⚠️ WARNING: Character appears after death event - check timeline');
        }

        // Check secrets revelation
        if (character.secrets && character.secrets.length > 0) {
            const revelations = appearances.filter(a => a.development_type === 'revelation');
            if (revelations.length === 0) {
                notes.push('Character has secrets but no revelation events recorded');
            }
        }

        return notes;
    }
}