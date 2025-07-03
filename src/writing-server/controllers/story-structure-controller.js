// src/writing-server/controllers/story-structure-controller.js
// Controller for story structure validation

export class StoryStructureController {
    constructor(db) {
        this.db = db;
    }

    /**
     * Validate a chapter structure plan against story structure rules
     * @param {Object} chapterPlan - The chapter plan with structure elements
     * @returns {Promise<Object>} Validation result
     */
    async validateChapterPlan(chapterPlan) {
        try {
            const {
                chapter_id, initial_goal, disturbance, new_goal,
                complications, turning_point, choice, consequences, next_setup
            } = chapterPlan;

            // Verify chapter exists
            const chapterExists = await this.db.query(
                'SELECT id FROM chapters WHERE id = $1',
                [chapter_id]
            );

            if (chapterExists.rowCount === 0) {
                throw new Error(`Chapter with ID ${chapter_id} not found`);
            }

            // Check for existing plan
            const existingPlan = await this.db.query(
                'SELECT id FROM chapter_structure_plans WHERE chapter_id = $1',
                [chapter_id]
            );

            // Insert or update the plan
            let result;
            if (existingPlan.rowCount > 0) {
                result = await this.db.query(
                    `UPDATE chapter_structure_plans 
                     SET initial_goal = $1, disturbance = $2, new_goal = $3, 
                         complications = $4, turning_point = $5, choice = $6, 
                         consequences = $7, next_setup = $8, updated_at = NOW()
                     WHERE chapter_id = $9
                     RETURNING *`,
                    [initial_goal, disturbance, new_goal, JSON.stringify(complications), 
                     turning_point, choice, consequences, next_setup, chapter_id]
                );
            } else {
                result = await this.db.query(
                    `INSERT INTO chapter_structure_plans 
                     (chapter_id, initial_goal, disturbance, new_goal, complications, 
                      turning_point, choice, consequences, next_setup)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING *`,
                    [chapter_id, initial_goal, disturbance, new_goal, JSON.stringify(complications), 
                     turning_point, choice, consequences, next_setup]
                );
            }

            // Perform structure validation
            const validationResults = this.validateStructure(chapterPlan);
            
            // Record any violations found
            if (validationResults.violations && validationResults.violations.length > 0) {
                await this.recordViolations(chapter_id, validationResults.violations);
            }

            return {
                success: true,
                plan: result.rows[0],
                validation: validationResults
            };
        } catch (error) {
            console.error('Error validating chapter plan:', error);
            throw error;
        }
    }

    /**
     * Check for structural violations in a chapter
     * @param {number} chapterId - Chapter ID to check
     * @returns {Promise<Object>} Violations found
     */
    async checkViolations(chapterId) {
        try {
            // Get the chapter plan
            const planResult = await this.db.query(
                'SELECT * FROM chapter_structure_plans WHERE chapter_id = $1',
                [chapterId]
            );

            if (planResult.rowCount === 0) {
                return {
                    success: false,
                    message: 'No structure plan found for this chapter',
                    violations: []
                };
            }

            // Get any recorded violations
            const violationsResult = await this.db.query(
                'SELECT * FROM structure_violations WHERE chapter_id = $1 AND resolved = FALSE',
                [chapterId]
            );

            return {
                success: true,
                violations: violationsResult.rows
            };
        } catch (error) {
            console.error('Error checking violations:', error);
            throw error;
        }
    }

    /**
     * Validate beat placement percentages in a chapter
     * @param {Object} beatData - Beat placement data
     * @returns {Promise<Object>} Validation result
     */
    async validateBeatPlacement(beatData) {
        try {
            const { chapter_id, chapter_word_count, beats } = beatData;

            // Verify chapter exists
            const chapterExists = await this.db.query(
                'SELECT id FROM chapters WHERE id = $1',
                [chapter_id]
            );

            if (chapterExists.rowCount === 0) {
                throw new Error(`Chapter with ID ${chapter_id} not found`);
            }

            // Check for existing beat placement
            const existingBeats = await this.db.query(
                'SELECT id FROM beat_placements WHERE chapter_id = $1',
                [chapter_id]
            );

            // Insert or update the beat placement
            let result;
            if (existingBeats.rowCount > 0) {
                result = await this.db.query(
                    `UPDATE beat_placements 
                     SET chapter_word_count = $1, 
                         goal_start = $2, goal_end = $3,
                         disturbance_start = $4, disturbance_end = $5,
                         new_goal_start = $6, new_goal_end = $7,
                         complications_start = $8, complications_end = $9,
                         turning_point_start = $10, turning_point_end = $11,
                         choice_start = $12, choice_end = $13,
                         consequences_start = $14, consequences_end = $15,
                         next_setup_start = $16, next_setup_end = $17,
                         updated_at = NOW()
                     WHERE chapter_id = $18
                     RETURNING *`,
                    [
                        chapter_word_count,
                        beats.goal.start, beats.goal.end,
                        beats.disturbance.start, beats.disturbance.end,
                        beats.new_goal.start, beats.new_goal.end,
                        beats.complications.start, beats.complications.end,
                        beats.turning_point.start, beats.turning_point.end,
                        beats.choice.start, beats.choice.end,
                        beats.consequences.start, beats.consequences.end,
                        beats.next_setup?.start || null, beats.next_setup?.end || null,
                        chapter_id
                    ]
                );
            } else {
                result = await this.db.query(
                    `INSERT INTO beat_placements 
                     (chapter_id, chapter_word_count, 
                      goal_start, goal_end,
                      disturbance_start, disturbance_end,
                      new_goal_start, new_goal_end,
                      complications_start, complications_end,
                      turning_point_start, turning_point_end,
                      choice_start, choice_end,
                      consequences_start, consequences_end,
                      next_setup_start, next_setup_end)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                     RETURNING *`,
                    [
                        chapter_id, chapter_word_count,
                        beats.goal.start, beats.goal.end,
                        beats.disturbance.start, beats.disturbance.end,
                        beats.new_goal.start, beats.new_goal.end,
                        beats.complications.start, beats.complications.end,
                        beats.turning_point.start, beats.turning_point.end,
                        beats.choice.start, beats.choice.end,
                        beats.consequences.start, beats.consequences.end,
                        beats.next_setup?.start || null, beats.next_setup?.end || null
                    ]
                );
            }

            // Validate the beat placement
            const beatValidation = this.validateBeats(beatData);
            
            // Record any violations found
            if (beatValidation.violations && beatValidation.violations.length > 0) {
                await this.recordViolations(chapter_id, beatValidation.violations);
            }

            return {
                success: true,
                beatPlacement: result.rows[0],
                validation: beatValidation
            };
        } catch (error) {
            console.error('Error validating beat placement:', error);
            throw error;
        }
    }

    /**
     * Validate the structure of a chapter plan
     * @param {Object} chapterPlan - The chapter plan
     * @returns {Object} Validation results
     */
    validateStructure(chapterPlan) {
        const violations = [];

        // Check if all required elements are present
        const requiredElements = ['initial_goal', 'disturbance', 'new_goal', 'complications', 
                                 'turning_point', 'choice', 'consequences'];
        
        for (const element of requiredElements) {
            if (!chapterPlan[element] || 
                (Array.isArray(chapterPlan[element]) && chapterPlan[element].length === 0)) {
                violations.push({
                    type: 'missing_element',
                    description: `Missing required element: ${element}`,
                    severity: 'high',
                    suggestion: `Add a ${element.replace('_', ' ')} to the chapter plan`
                });
            }
        }

        // Check if new goal is meaningfully different from initial goal
        if (chapterPlan.initial_goal && chapterPlan.new_goal && 
            this.stringSimilarity(chapterPlan.initial_goal, chapterPlan.new_goal) > 0.7) {
            violations.push({
                type: 'goal_similarity_error',
                description: 'New goal is too similar to initial goal',
                severity: 'high',
                suggestion: 'Ensure the disturbance creates a significant change in character goals'
            });
        }

        // Check if complications are substantive
        if (Array.isArray(chapterPlan.complications) && chapterPlan.complications.length < 2) {
            violations.push({
                type: 'insufficient_complications',
                description: 'Need at least two complications for dramatic tension',
                severity: 'medium',
                suggestion: 'Add more obstacles in the pursuit of the new goal'
            });
        }

        // Check if turning point leads to a meaningful choice
        if (chapterPlan.turning_point && chapterPlan.choice &&
            !this.isRelated(chapterPlan.turning_point, chapterPlan.choice)) {
            violations.push({
                type: 'turning_point_disconnect',
                description: 'Choice doesn\'t clearly relate to the turning point',
                severity: 'medium',
                suggestion: 'Ensure the turning point forces the character into making the choice'
            });
        }

        // Check if consequences flow from the choice
        if (chapterPlan.choice && chapterPlan.consequences &&
            !this.isRelated(chapterPlan.choice, chapterPlan.consequences)) {
            violations.push({
                type: 'consequence_disconnect',
                description: 'Consequences don\'t clearly flow from the choice made',
                severity: 'medium',
                suggestion: 'Make sure consequences directly result from the character\'s choice'
            });
        }

        return {
            valid: violations.length === 0,
            violations: violations
        };
    }

    /**
     * Validate the beat placements in a chapter
     * @param {Object} beatData - Beat placement data
     * @returns {Object} Validation results
     */
    validateBeats(beatData) {
        const { chapter_word_count, beats } = beatData;
        const violations = [];

        // Check for sequence errors
        const beatSequence = [
            { name: 'goal', beat: beats.goal },
            { name: 'disturbance', beat: beats.disturbance },
            { name: 'new_goal', beat: beats.new_goal },
            { name: 'complications', beat: beats.complications },
            { name: 'turning_point', beat: beats.turning_point },
            { name: 'choice', beat: beats.choice },
            { name: 'consequences', beat: beats.consequences }
        ];

        if (beats.next_setup) {
            beatSequence.push({ name: 'next_setup', beat: beats.next_setup });
        }

        // Check for sequence errors
        for (let i = 0; i < beatSequence.length - 1; i++) {
            const current = beatSequence[i];
            const next = beatSequence[i + 1];
            
            if (current.beat.end > next.beat.start) {
                violations.push({
                    type: 'beat_sequence_error',
                    description: `${current.name} overlaps with ${next.name}`,
                    severity: 'high',
                    suggestion: `Ensure ${current.name} ends before ${next.name} starts`
                });
            }
        }

        // Check for proportion errors
        const proportions = {
            goal: { ideal: 0.1, min: 0.05, max: 0.15 },
            disturbance: { ideal: 0.05, min: 0.03, max: 0.1 },
            new_goal: { ideal: 0.05, min: 0.03, max: 0.1 },
            complications: { ideal: 0.4, min: 0.3, max: 0.5 },
            turning_point: { ideal: 0.1, min: 0.05, max: 0.15 },
            choice: { ideal: 0.1, min: 0.05, max: 0.15 },
            consequences: { ideal: 0.1, min: 0.05, max: 0.15 },
            next_setup: { ideal: 0.1, min: 0.05, max: 0.15 }
        };

        beatSequence.forEach(({ name, beat }) => {
            const proportion = (beat.end - beat.start) / chapter_word_count;
            const ideal = proportions[name];

            if (proportion < ideal.min || proportion > ideal.max) {
                violations.push({
                    type: 'beat_proportion_error',
                    description: `${name} proportion (${Math.round(proportion * 100)}%) outside ideal range (${Math.round(ideal.min * 100)}%-${Math.round(ideal.max * 100)}%)`,
                    severity: 'medium',
                    suggestion: `Adjust ${name} to be closer to ideal proportion (${Math.round(ideal.ideal * 100)}%)`
                });
            }
        });

        return {
            valid: violations.length === 0,
            violations: violations
        };
    }

    /**
     * Record structure violations in the database
     * @param {number} chapterId - Chapter ID
     * @param {Array} violations - List of violations
     */
    async recordViolations(chapterId, violations) {
        try {
            // Clear existing unresolved violations for this chapter
            await this.db.query(
                'UPDATE structure_violations SET resolved = TRUE WHERE chapter_id = $1 AND resolved = FALSE',
                [chapterId]
            );

            // Insert new violations
            for (const violation of violations) {
                await this.db.query(
                    `INSERT INTO structure_violations 
                     (chapter_id, violation_type, description, severity, suggestion)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [chapterId, violation.type, violation.description, 
                     violation.severity, violation.suggestion]
                );
            }
        } catch (error) {
            console.error('Error recording violations:', error);
            throw error;
        }
    }

    /**
     * Calculate string similarity (simplified)
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {number} Similarity score (0-1)
     */
    stringSimilarity(a, b) {
        // Simple implementation - for production, use a proper string similarity algorithm
        const aWords = new Set(a.toLowerCase().split(/\s+/));
        const bWords = new Set(b.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...aWords].filter(x => bWords.has(x)));
        const union = new Set([...aWords, ...bWords]);
        
        return intersection.size / union.size;
    }

    /**
     * Check if two strings are semantically related (simplified)
     * @param {string} a - First string
     * @param {string} b - Second string
     * @returns {boolean} Whether they're related
     */
    isRelated(a, b) {
        // Simple implementation - in production, use a more sophisticated algorithm
        const aWords = new Set(a.toLowerCase().split(/\s+/));
        const bWords = new Set(b.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...aWords].filter(x => bWords.has(x)));
        
        // If they share at least 20% of words, consider them related
        return intersection.size >= Math.min(aWords.size, bWords.size) * 0.2;
    }
}
