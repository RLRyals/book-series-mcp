// src/research-server/routes/character-knowledge-routes.js
// API routes for character knowledge state tracking
import express from 'express';
import { CharacterKnowledgeController } from '../controllers/character-knowledge-controller.js';

export function setupCharacterKnowledgeRoutes(app, db) {
    const router = express.Router();
    const controller = new CharacterKnowledgeController(db);

    // Middleware to enforce series boundary checks
    const enforceSeriesBoundary = async (req, res, next) => {
        const seriesId = req.headers['x-series-id'] || req.query.series_id;
        if (!seriesId) {
            return res.status(400).json({ error: 'Series ID required in header x-series-id or query parameter series_id' });
        }
        
        // Add series validation logic here
        req.seriesId = seriesId;
        next();
    };

    // Apply middleware to all routes
    router.use(enforceSeriesBoundary);

    // 1. Track what character knows at specific story point
    router.post('/set-state', async (req, res) => {
        try {
            const result = await controller.setKnowledgeState(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // 2. Validate if character can reference specific information
    router.get('/can-reference', async (req, res) => {
        try {
            const { character_id, knowledge_item, at_chapter } = req.query;
            const result = await controller.canReference({
                character_id: parseInt(character_id),
                knowledge_item,
                at_chapter: parseInt(at_chapter)
            });
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // 3. Get complete knowledge state for character
    router.get('/state/:character_id/at-chapter/:chapter_id', async (req, res) => {
        try {
            const { character_id, chapter_id } = req.params;
            const result = await controller.getCharacterKnowledgeState({
                character_id: parseInt(character_id),
                chapter_id: parseInt(chapter_id)
            });
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // 4. Validate scene dialogue/thoughts against knowledge boundaries
    router.post('/validate-scene', async (req, res) => {
        try {
            const result = await controller.validateScene(req.body);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // Mount the router
    app.use('/api/character-knowledge', router);
    
    console.error('Character Knowledge routes initialized');
    return router;
}
