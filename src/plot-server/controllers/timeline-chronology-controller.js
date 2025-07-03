// src/plot-server/controllers/timeline-chronology-controller.js
// Controller for Timeline Chronology Enforcer

export class TimelineChronologyController {
    constructor(db) {
        this.db = db;
    }

    // 1. Validate event against established timeline
    async validateEvent(eventData) {
        const {
            series_id, book_id, chapter_id, event_datetime, event_description,
            character_ids, location_id, previous_event_reference
        } = eventData;

        // Insert the event
        const result = await this.db.query(
            `INSERT INTO timeline_events (series_id, book_id, chapter_id, event_datetime, event_description, character_ids, location_id, previous_event_reference)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [series_id, book_id, chapter_id, event_datetime, event_description, character_ids, location_id, previous_event_reference]
        );

        // TODO: Add logic to check for timeline conflicts, overlaps, or logical errors
        // For now, just return the inserted event
        return {
            success: true,
            event: result.rows[0],
            conflicts: []
        };
    }

    // 2. Check character location/status at specific time
    async getCharacterStatus(query) {
        const { character_id, datetime } = query;
        // Find the latest status snapshot before or at the given time
        const result = await this.db.query(
            `SELECT * FROM character_status_snapshots WHERE character_id = $1 AND snapshot_time <= $2 ORDER BY snapshot_time DESC LIMIT 1`,
            [character_id, datetime]
        );
        if (result.rowCount === 0) {
            return {
                location: 'Unknown',
                status: 'Unknown',
                last_known_event: null,
                conflicts: [],
                plausible_activities: []
            };
        }
        return result.rows[0];
    }

    // 3. Generate chronology report for chapter
    async getChapterChronology(chapter_id) {
        const result = await this.db.query(
            `SELECT * FROM chapter_chronology_reports WHERE chapter_id = $1`,
            [chapter_id]
        );
        if (result.rowCount === 0) {
            return {
                success: false,
                message: 'No chronology report found for this chapter.'
            };
        }
        return result.rows[0];
    }

    // 4. Validate chapter against series timeline
    async validateChapter(chapterData) {
        const { chapter_id, events } = chapterData;
        // Insert or update the chronology report
        const result = await this.db.query(
            `INSERT INTO chapter_chronology_reports (chapter_id, events, created_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (chapter_id) DO UPDATE SET events = $2, updated_at = NOW()
             RETURNING *`,
            [chapter_id, JSON.stringify(events)]
        );
        // TODO: Add logic to check for timeline gaps/conflicts
        return {
            success: true,
            report: result.rows[0],
            potential_conflicts: []
        };
    }
}
