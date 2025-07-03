-- Story Structure Validator
-- Adds tables to track chapter structure and validate against story structure rules

-- Chapter Structure Plans
CREATE TABLE chapter_structure_plans (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    initial_goal TEXT NOT NULL,
    disturbance TEXT NOT NULL,
    new_goal TEXT NOT NULL,
    complications JSONB NOT NULL, -- Array of complication strings
    turning_point TEXT NOT NULL,
    choice TEXT NOT NULL,
    consequences TEXT NOT NULL,
    next_setup TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id)
);

-- Beat Placement Tracking
CREATE TABLE beat_placements (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_word_count INTEGER NOT NULL,
    goal_start INTEGER NOT NULL,
    goal_end INTEGER NOT NULL,
    disturbance_start INTEGER NOT NULL,
    disturbance_end INTEGER NOT NULL,
    new_goal_start INTEGER NOT NULL,
    new_goal_end INTEGER NOT NULL,
    complications_start INTEGER NOT NULL,
    complications_end INTEGER NOT NULL,
    turning_point_start INTEGER NOT NULL,
    turning_point_end INTEGER NOT NULL,
    choice_start INTEGER NOT NULL,
    choice_end INTEGER NOT NULL,
    consequences_start INTEGER NOT NULL,
    consequences_end INTEGER NOT NULL,
    next_setup_start INTEGER,
    next_setup_end INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id)
);

-- Structure Violations
CREATE TABLE structure_violations (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    violation_type VARCHAR(100) NOT NULL, -- goal_sequence_error, missing_beat, etc.
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- high, medium, low
    suggestion TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_chapter_structure_plans_chapter_id ON chapter_structure_plans(chapter_id);
CREATE INDEX idx_beat_placements_chapter_id ON beat_placements(chapter_id);
CREATE INDEX idx_structure_violations_chapter_id ON structure_violations(chapter_id);
CREATE INDEX idx_structure_violations_unresolved ON structure_violations(chapter_id) WHERE resolved = FALSE;
