// src/writing-server/routes/story-structure-routes.js
// REST API routes for story structure validation

import express from 'express';
import { StoryStructureController } from '../controllers/story-structure-controller.js';

export function setupStoryStructureRoutes(app, db) {
    const router = express.Router();
    const controller = new StoryStructureController(db);

    // 1. Validate chapter structure plan
    router.post('/validate-chapter-plan', async (req, res) => {
        try {
            const result = await controller.validateChapterPlan(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 2. Check for structure violations
    router.get('/check-violations/:chapter_id', async (req, res) => {
        try {
            const result = await controller.checkViolations(parseInt(req.params.chapter_id));
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 3. Validate beat placement
    router.post('/validate-beat-placement', async (req, res) => {
        try {
            const result = await controller.validateBeatPlacement(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Use the router
    app.use('/api/story-structure', router);
    
    console.error('Story structure routes initialized');
    
    return router;
}
