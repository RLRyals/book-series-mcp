// src/plot-server/routes/timeline-chronology-routes.js
// REST API routes for Timeline Chronology Enforcer

import express from 'express';
import { TimelineChronologyController } from '../controllers/timeline-chronology-controller.js';

export function setupTimelineChronologyRoutes(app, db) {
    const router = express.Router();
    const controller = new TimelineChronologyController(db);

    // 1. Validate event against established timeline
    router.post('/validate-event', async (req, res) => {
        try {
            const result = await controller.validateEvent(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 2. Check character location/status at specific time
    router.get('/character-status', async (req, res) => {
        try {
            const result = await controller.getCharacterStatus(req.query);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 3. Generate chronology report for chapter
    router.get('/chapter-chronology/:chapter_id', async (req, res) => {
        try {
            const result = await controller.getChapterChronology(req.params.chapter_id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 4. Validate chapter against series timeline
    router.post('/validate-chapter', async (req, res) => {
        try {
            const result = await controller.validateChapter(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    app.use('/api/timeline', router);
    console.error('Timeline chronology routes initialized');
    return router;
}
