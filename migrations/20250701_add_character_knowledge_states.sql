-- Migration: Add character knowledge states table for tracking what characters know at each point in the story
-- Date: 2025-07-01

CREATE TABLE IF NOT EXISTS character_knowledge_states (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id),
    book_id INTEGER REFERENCES books(id),
    chapter_id INTEGER REFERENCES chapters(id),
    knowledge_item VARCHAR(255) NOT NULL,
    knowledge_state VARCHAR(100), -- knows, suspects, unaware, memory_gap, knows_with_oz_protection
    source TEXT, -- how they learned this
    confidence_level VARCHAR(50), -- certain, probable, suspected
    can_act_on BOOLEAN DEFAULT true,
    can_reference_directly BOOLEAN DEFAULT true,
    can_reference_indirectly BOOLEAN DEFAULT true,
    restrictions TEXT, -- specific limitations on usage
    internal_thought_ok BOOLEAN DEFAULT true,
    dialogue_restriction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_character_knowledge_character_id ON character_knowledge_states(character_id);
CREATE INDEX idx_character_knowledge_book_chapter ON character_knowledge_states(book_id, chapter_id);
CREATE INDEX idx_character_knowledge_item ON character_knowledge_states(knowledge_item);

-- Add a constraint to ensure unique knowledge items per character per chapter
ALTER TABLE character_knowledge_states 
ADD CONSTRAINT unique_character_knowledge_item 
UNIQUE (character_id, book_id, chapter_id, knowledge_item);

-- Add comments for documentation
COMMENT ON TABLE character_knowledge_states IS 'Tracks what each character knows at specific story points';
COMMENT ON COLUMN character_knowledge_states.knowledge_state IS 'States include: knows, suspects, unaware, memory_gap, knows_with_oz_protection';
COMMENT ON COLUMN character_knowledge_states.confidence_level IS 'How certain the character is about this knowledge';
COMMENT ON COLUMN character_knowledge_states.restrictions IS 'Any specific limitations on how the character can use or reference this knowledge';
