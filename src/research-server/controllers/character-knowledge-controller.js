// src/research-server/controllers/character-knowledge-controller.js
// Controller for character knowledge state tracking

export class CharacterKnowledgeController {
    constructor(db) {
        this.db = db;
    }

    /**
     * Set or update a character's knowledge state for a specific item
     */
    async setKnowledgeState(params) {
        try {
            const {
                character_id,
                book_id,
                chapter_id,
                knowledge_item,
                knowledge_state,
                source,
                confidence_level,
                can_act_on,
                can_reference_directly,
                can_reference_indirectly,
                restrictions,
                internal_thought_ok,
                dialogue_restriction
            } = params;

            // Check if the character exists
            const character = await this.db.findById('characters', character_id);
            if (!character) {
                throw new Error(`Character with ID ${character_id} not found`);
            }

            // Check if the book exists
            const book = await this.db.findById('books', book_id);
            if (!book) {
                throw new Error(`Book with ID ${book_id} not found`);
            }

            // Check if the chapter exists
            const chapter = await this.db.findById('chapters', chapter_id);
            if (!chapter) {
                throw new Error(`Chapter with ID ${chapter_id} not found`);
            }

            // Check if this knowledge state already exists
            const existingQuery = `
                SELECT id FROM character_knowledge_states 
                WHERE character_id = $1 AND book_id = $2 AND chapter_id = $3 AND knowledge_item = $4
            `;
            const existing = await this.db.query(existingQuery, [character_id, book_id, chapter_id, knowledge_item]);

            let result;
            if (existing.rows.length > 0) {
                // Update existing knowledge state
                const updateQuery = `
                    UPDATE character_knowledge_states 
                    SET knowledge_state = $1,
                        source = $2,
                        confidence_level = $3,
                        can_act_on = $4,
                        can_reference_directly = $5,
                        can_reference_indirectly = $6,
                        restrictions = $7,
                        internal_thought_ok = $8,
                        dialogue_restriction = $9
                    WHERE id = $10
                    RETURNING *
                `;
                result = await this.db.query(updateQuery, [
                    knowledge_state,
                    source,
                    confidence_level,
                    can_act_on !== undefined ? can_act_on : true,
                    can_reference_directly !== undefined ? can_reference_directly : true,
                    can_reference_indirectly !== undefined ? can_reference_indirectly : true,
                    restrictions,
                    internal_thought_ok !== undefined ? internal_thought_ok : true,
                    dialogue_restriction,
                    existing.rows[0].id
                ]);
            } else {
                // Create new knowledge state
                const insertQuery = `
                    INSERT INTO character_knowledge_states (
                        character_id, book_id, chapter_id, knowledge_item, knowledge_state,
                        source, confidence_level, can_act_on, can_reference_directly,
                        can_reference_indirectly, restrictions, internal_thought_ok, dialogue_restriction
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    RETURNING *
                `;
                result = await this.db.query(insertQuery, [
                    character_id,
                    book_id,
                    chapter_id,
                    knowledge_item,
                    knowledge_state,
                    source,
                    confidence_level,
                    can_act_on !== undefined ? can_act_on : true,
                    can_reference_directly !== undefined ? can_reference_directly : true,
                    can_reference_indirectly !== undefined ? can_reference_indirectly : true,
                    restrictions,
                    internal_thought_ok !== undefined ? internal_thought_ok : true,
                    dialogue_restriction
                ]);
            }

            return {
                success: true,
                knowledge_state: result.rows[0],
                message: `Character knowledge state for '${knowledge_item}' successfully ${existing.rows.length > 0 ? 'updated' : 'created'}`
            };
        } catch (error) {
            console.error('Error setting character knowledge state:', error);
            throw error;
        }
    }

    /**
     * Check if a character can reference specific knowledge
     */
    async canReference(params) {
        try {
            const { character_id, knowledge_item, at_chapter } = params;

            // Find the book for the chapter
            const chapterQuery = `SELECT book_id FROM chapters WHERE id = $1`;
            const chapterResult = await this.db.query(chapterQuery, [at_chapter]);
            
            if (chapterResult.rows.length === 0) {
                throw new Error(`Chapter with ID ${at_chapter} not found`);
            }
            
            const bookId = chapterResult.rows[0].book_id;

            // Get the character's knowledge state for this item up to this chapter
            const query = `
                SELECT * FROM character_knowledge_states 
                WHERE character_id = $1 
                AND knowledge_item = $2
                AND (book_id < $3 OR (book_id = $3 AND chapter_id <= $4))
                ORDER BY book_id DESC, chapter_id DESC
                LIMIT 1
            `;
            const result = await this.db.query(query, [character_id, knowledge_item, bookId, at_chapter]);

            if (result.rows.length === 0) {
                // Character doesn't have this knowledge at this point
                return {
                    can_reference: false,
                    reason: 'Character does not have this knowledge at this point in the story',
                    internal_thought_ok: false,
                    dialogue_restriction: 'cannot_reference_at_all'
                };
            }

            const knowledge = result.rows[0];
            
            // Check if the character knows this information
            const knowsInformation = knowledge.knowledge_state === 'knows' || 
                                    knowledge.knowledge_state === 'knows_with_oz_protection';
            
            // Determine what type of reference is allowed
            return {
                can_reference: knowsInformation && (knowledge.can_reference_directly || knowledge.can_reference_indirectly),
                limitation: knowledge.restrictions || null,
                internal_thought_ok: knowledge.internal_thought_ok,
                dialogue_restriction: knowledge.dialogue_restriction || (knowsInformation ? null : 'cannot_reference'),
                knowledge_state: knowledge.knowledge_state,
                confidence_level: knowledge.confidence_level
            };
        } catch (error) {
            console.error('Error checking if character can reference knowledge:', error);
            throw error;
        }
    }

    /**
     * Get complete knowledge state for a character at a specific chapter
     */
    async getCharacterKnowledgeState(params) {
        try {
            const { character_id, chapter_id } = params;

            // Find the book for the chapter
            const chapterQuery = `SELECT book_id FROM chapters WHERE id = $1`;
            const chapterResult = await this.db.query(chapterQuery, [chapter_id]);
            
            if (chapterResult.rows.length === 0) {
                throw new Error(`Chapter with ID ${chapter_id} not found`);
            }
            
            const bookId = chapterResult.rows[0].book_id;

            // Get all knowledge states for this character up to this chapter
            const query = `
                WITH latest_knowledge AS (
                    SELECT DISTINCT ON (knowledge_item) 
                        knowledge_item, knowledge_state, confidence_level, 
                        can_act_on, can_reference_directly, can_reference_indirectly,
                        restrictions, internal_thought_ok, dialogue_restriction,
                        source, created_at
                    FROM character_knowledge_states 
                    WHERE character_id = $1
                    AND (book_id < $2 OR (book_id = $2 AND chapter_id <= $3))
                    ORDER BY knowledge_item, book_id DESC, chapter_id DESC
                )
                SELECT * FROM latest_knowledge
            `;
            const result = await this.db.query(query, [character_id, bookId, chapter_id]);

            // Group knowledge by state
            const confirmed = [];
            const suspected = [];
            const unaware = [];
            const memoryGaps = [];

            for (const item of result.rows) {
                switch (item.knowledge_state) {
                    case 'knows':
                    case 'knows_with_oz_protection':
                        confirmed.push(item);
                        break;
                    case 'suspects':
                        suspected.push(item);
                        break;
                    case 'unaware':
                        unaware.push(item);
                        break;
                    case 'memory_gap':
                        memoryGaps.push(item);
                        break;
                }
            }

            return {
                character_id,
                at_chapter: chapter_id,
                confirmed_knowledge: confirmed,
                suspected_but_unconfirmed: suspected,
                explicitly_doesnt_know: unaware,
                memory_gaps: memoryGaps
            };
        } catch (error) {
            console.error('Error getting character knowledge state:', error);
            throw error;
        }
    }

    /**
     * Validate if scene content (dialogue/thoughts) respects knowledge boundaries
     */
    async validateScene(params) {
        try {
            const { character_id, chapter_id, scene_content, content_type } = params;

            // First, get the character's complete knowledge state at this chapter
            const knowledgeState = await this.getCharacterKnowledgeState({ character_id, chapter_id });

            // For a real implementation, we would use NLP/AI to analyze the content
            // For now, this is a simplified check that looks for specific knowledge items
            
            const validationResults = {
                valid: true,
                violations: [],
                warnings: []
            };

            // Get all the knowledge items the character doesn't know or has restrictions on
            const restrictedItems = [
                ...knowledgeState.explicitly_doesnt_know,
                ...knowledgeState.memory_gaps,
                ...knowledgeState.confirmed_knowledge.filter(k => 
                    !k.can_reference_directly || 
                    (content_type === 'dialogue' && !k.internal_thought_ok)
                ),
                ...knowledgeState.suspected_but_unconfirmed.filter(k => k.confidence_level !== 'certain')
            ];

            // Check for each restricted item in the content
            for (const item of restrictedItems) {
                if (scene_content.toLowerCase().includes(item.knowledge_item.toLowerCase())) {
                    // Determine violation severity based on knowledge state
                    if (item.knowledge_state === 'unaware' || item.knowledge_state === 'memory_gap') {
                        validationResults.valid = false;
                        validationResults.violations.push({
                            knowledge_item: item.knowledge_item,
                            violation_type: 'referencing_unknown_information',
                            severity: 'critical',
                            suggestion: `Character does not know about '${item.knowledge_item}' at this point`
                        });
                    } else if (content_type === 'dialogue' && !item.internal_thought_ok) {
                        validationResults.valid = false;
                        validationResults.violations.push({
                            knowledge_item: item.knowledge_item,
                            violation_type: 'inappropriate_dialogue_reference',
                            severity: 'high',
                            suggestion: `Character cannot discuss '${item.knowledge_item}' in dialogue, only in thoughts`
                        });
                    } else if (!item.can_reference_directly) {
                        validationResults.warnings.push({
                            knowledge_item: item.knowledge_item,
                            warning_type: 'direct_reference_to_restricted_knowledge',
                            severity: 'medium',
                            suggestion: `Character should be more vague when referencing '${item.knowledge_item}'`
                        });
                    }
                }
            }

            return validationResults;
        } catch (error) {
            console.error('Error validating scene against knowledge boundaries:', error);
            throw error;
        }
    }
}
