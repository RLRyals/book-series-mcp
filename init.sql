-- Book Series Management Database Schema
-- Initialize database for complex multi-book series management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function for percentage calculation to ensure consistent behavior
CREATE OR REPLACE FUNCTION calculate_percentage(value numeric, total numeric)
RETURNS numeric AS $$
BEGIN
    IF total = 0 OR total IS NULL THEN
        RETURN 0;
    END IF;
    RETURN ROUND((value / total * 100)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- Series and Books
CREATE TABLE series (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pen_name VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    world_type VARCHAR(100),
    description TEXT,
    total_planned_books INTEGER DEFAULT 20,
    current_book_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    main_arc_description TEXT,
    target_total_words INTEGER DEFAULT 2000000, -- 20 books * 100k words
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    book_number INTEGER NOT NULL,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    word_count INTEGER DEFAULT 0,
    target_word_count INTEGER DEFAULT 100000,
    chapter_count INTEGER DEFAULT 0,
    target_chapters INTEGER DEFAULT 40,
    main_case_description TEXT,
    mini_arc_position VARCHAR(100), -- "book 1 of 3 in arc", etc.
    status VARCHAR(50) DEFAULT 'planning', -- planning, writing, editing, complete
    publication_date DATE,
    outline_complete BOOLEAN DEFAULT FALSE,
    first_draft_complete BOOLEAN DEFAULT FALSE,
    editing_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(series_id, book_number)
);

CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(255),
    word_count INTEGER DEFAULT 0,
    target_word_count INTEGER DEFAULT 2500,
    summary TEXT,
    outline TEXT,
    content TEXT,
    pov_character_id INTEGER, -- References characters(id), set up later
    scene_setting_id INTEGER, -- References locations(id), set up later
    status VARCHAR(50) DEFAULT 'outlined', -- outlined, drafted, revised, final
    writing_notes TEXT,
    continuity_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(book_id, chapter_number)
);

-- Character Management
CREATE TABLE characters (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    aliases TEXT[], -- Array of alternate names/identities
    character_type VARCHAR(50), -- protagonist, antagonist, supporting, victim, suspect
    species VARCHAR(100), -- human, non-human (specific), hybrid, etc.
    occupation VARCHAR(255),
    department VARCHAR(255), -- for police/government characters
    rank_title VARCHAR(100),
    badge_number VARCHAR(50),
    age INTEGER,
    birth_date DATE,
    physical_description TEXT,
    personality_traits TEXT,
    background_story TEXT,
    secrets TEXT, -- hidden aspects, like protagonist's non-human nature
    abilities TEXT, -- special skills, powers, etc.
    weaknesses TEXT,
    goals TEXT,
    motivations TEXT,
    internal_conflicts TEXT,
    character_arc_summary TEXT,
    moral_alignment VARCHAR(100), -- lawful_good, chaotic_neutral, etc.
    first_appearance_book INTEGER REFERENCES books(id),
    first_appearance_chapter INTEGER REFERENCES chapters(id),
    last_appearance_book INTEGER REFERENCES books(id),
    status VARCHAR(50) DEFAULT 'active', -- active, deceased, missing, retired, etc.
    death_book INTEGER REFERENCES books(id),
    death_chapter INTEGER REFERENCES chapters(id),
    importance_level INTEGER DEFAULT 5, -- 1-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE character_relationships (
    id SERIAL PRIMARY KEY,
    character1_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    character2_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type VARCHAR(100), -- partner, enemy, family, mentor, etc.
    relationship_subtype VARCHAR(100), -- work_partner, romantic, sibling, etc.
    description TEXT,
    development_notes TEXT,
    tension_level INTEGER DEFAULT 5, -- 1-10 scale
    trust_level INTEGER DEFAULT 5, -- 1-10 scale
    first_established_book INTEGER REFERENCES books(id),
    relationship_status VARCHAR(50) DEFAULT 'active', -- active, ended, complicated
    secret_from_others BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (character1_id != character2_id)
);

CREATE TABLE character_development (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    development_type VARCHAR(100), -- revelation, growth, setback, trauma, etc.
    description TEXT,
    emotional_impact TEXT,
    character_change TEXT,
    relationship_changes TEXT,
    notes TEXT,
    significance_level INTEGER DEFAULT 5, -- 1-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plot Management
CREATE TABLE plot_threads (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    thread_type VARCHAR(50), -- main_case, mini_arc, series_arc, subplot, character_arc
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_book INTEGER REFERENCES books(id),
    end_book INTEGER REFERENCES books(id),
    current_status VARCHAR(50) DEFAULT 'active', -- active, resolved, on_hold, abandoned
    resolution_notes TEXT,
    importance_level INTEGER DEFAULT 5, -- 1-10 scale
    complexity_level INTEGER DEFAULT 5, -- 1-10 scale
    related_characters INTEGER[], -- Array of character IDs
    related_locations INTEGER[], -- Array of location IDs
    parent_thread_id INTEGER REFERENCES plot_threads(id), -- For sub-plots
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cases (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    case_number VARCHAR(100),
    case_name VARCHAR(255) NOT NULL,
    case_type VARCHAR(100), -- murder, missing_person, conspiracy, fraud, etc.
    priority_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    victim_count INTEGER DEFAULT 1,
    victim_info TEXT,
    suspect_count INTEGER DEFAULT 0,
    suspects TEXT,
    evidence_summary TEXT,
    investigation_notes TEXT,
    forensic_details TEXT,
    supernatural_elements TEXT, -- Urban fantasy specific
    tech_elements TEXT, -- Cyberpunk specific
    resolution TEXT,
    connection_to_series_arc TEXT,
    connection_to_mini_arc TEXT,
    case_status VARCHAR(50) DEFAULT 'open', -- open, solved, cold, closed
    assigned_detectives INTEGER[], -- Array of character IDs
    case_opened_date DATE,
    case_closed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- World Building
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(100), -- city, building, neighborhood, crime_scene, etc.
    address TEXT,
    coordinates VARCHAR(100), -- lat,long or city grid reference
    description TEXT,
    atmosphere TEXT,
    cyberpunk_elements TEXT, -- tech integration, corporate influence, etc.
    fantasy_elements TEXT, -- magical aspects, non-human populations, etc.
    security_level VARCHAR(50), -- public, restricted, classified, etc.
    significance_to_plot TEXT,
    recurring_location BOOLEAN DEFAULT FALSE,
    first_appearance_book INTEGER REFERENCES books(id),
    first_appearance_chapter INTEGER REFERENCES chapters(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE world_building_elements (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    category VARCHAR(100), -- technology, magic_system, politics, corporations, etc.
    element_name VARCHAR(255) NOT NULL,
    description TEXT,
    rules_and_mechanics TEXT,
    limitations TEXT,
    impact_on_society TEXT,
    impact_on_story TEXT,
    first_introduced_book INTEGER REFERENCES books(id),
    first_introduced_chapter INTEGER REFERENCES chapters(id),
    development_notes TEXT,
    consistency_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Timeline and Evidence
CREATE TABLE timeline_events (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    event_datetime TIMESTAMP,
    event_description TEXT NOT NULL,
    event_type VARCHAR(100), -- crime, investigation, revelation, character_development
    characters_involved INTEGER[], -- Array of character IDs
    location_id INTEGER REFERENCES locations(id),
    plot_thread_ids INTEGER[], -- Array of plot thread IDs
    significance VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
    public_knowledge BOOLEAN DEFAULT FALSE, -- Is this event known to the public?
    police_knowledge BOOLEAN DEFAULT FALSE, -- Is this known to police?
    continuity_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    previous_event_reference TEXT
);

CREATE TABLE clues_evidence (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100), -- physical, digital, testimony, forensic, supernatural
    evidence_name VARCHAR(255),
    description TEXT,
    location_found INTEGER REFERENCES locations(id),
    discovered_by INTEGER REFERENCES characters(id),
    discovered_datetime TIMESTAMP,
    chain_of_custody TEXT,
    forensic_analysis TEXT,
    significance_to_case TEXT,
    connection_to_resolution TEXT,
    reliability_level INTEGER DEFAULT 5, -- 1-10 scale
    red_herring BOOLEAN DEFAULT FALSE,
    evidence_status VARCHAR(50) DEFAULT 'collected', -- collected, analyzed, presented, dismissed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Writing and Production Management
CREATE TABLE writing_sessions (
    id SERIAL PRIMARY KEY,
    claude_project_name VARCHAR(255),
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    words_written INTEGER DEFAULT 0,
    session_type VARCHAR(100), -- outlining, drafting, editing, research, world_building
    goals_set TEXT,
    goals_achieved TEXT,
    obstacles_encountered TEXT,
    next_session_goals TEXT,
    session_notes TEXT,
    productivity_rating INTEGER, -- 1-10 scale
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE series_notes (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    note_type VARCHAR(100), -- research, continuity, ideas, character, plot, world_building
    category VARCHAR(100), -- For sub-categorization
    title VARCHAR(255) NOT NULL,
    content TEXT,
    tags TEXT[], -- Array of tags for easy searching
    priority INTEGER DEFAULT 3, -- 1-5 scale
    status VARCHAR(50) DEFAULT 'active', -- active, resolved, archived
    related_characters INTEGER[], -- Array of character IDs
    related_books INTEGER[], -- Array of book IDs
    related_plot_threads INTEGER[], -- Array of plot thread IDs
    created_by VARCHAR(255), -- Claude project identifier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints that reference characters table
ALTER TABLE chapters 
ADD CONSTRAINT fk_chapters_pov_character 
FOREIGN KEY (pov_character_id) REFERENCES characters(id);

ALTER TABLE chapters 
ADD CONSTRAINT fk_chapters_scene_setting 
FOREIGN KEY (scene_setting_id) REFERENCES locations(id);

-- Create indexes for better performance
CREATE INDEX idx_series_pen_name ON series(pen_name);
CREATE INDEX idx_books_series_id ON books(series_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_chapters_book_id ON chapters(book_id);
CREATE INDEX idx_characters_series_id ON characters(series_id);
CREATE INDEX idx_characters_type ON characters(character_type);
CREATE INDEX idx_character_relationships_char1 ON character_relationships(character1_id);
CREATE INDEX idx_character_relationships_char2 ON character_relationships(character2_id);
CREATE INDEX idx_plot_threads_series_id ON plot_threads(series_id);
CREATE INDEX idx_plot_threads_type ON plot_threads(thread_type);
CREATE INDEX idx_cases_book_id ON cases(book_id);
CREATE INDEX idx_cases_status ON cases(case_status);
CREATE INDEX idx_locations_series_id ON locations(series_id);
CREATE INDEX idx_timeline_events_book_id ON timeline_events(book_id);
CREATE INDEX idx_timeline_events_datetime ON timeline_events(event_datetime);
CREATE INDEX idx_clues_evidence_case_id ON clues_evidence(case_id);
CREATE INDEX idx_writing_sessions_book_id ON writing_sessions(book_id);
CREATE INDEX idx_series_notes_series_id ON series_notes(series_id);
CREATE INDEX idx_series_notes_tags ON series_notes USING GIN(tags);
CREATE INDEX idx_character_knowledge_character_id ON character_knowledge_states(character_id);
CREATE INDEX idx_character_knowledge_book_chapter ON character_knowledge_states(book_id, chapter_id);
CREATE INDEX idx_character_knowledge_item ON character_knowledge_states(knowledge_item);
CREATE INDEX idx_chapter_structure_plans_chapter_id ON chapter_structure_plans(chapter_id);
CREATE INDEX idx_beat_placements_chapter_id ON beat_placements(chapter_id);
CREATE INDEX idx_structure_violations_chapter_id ON structure_violations(chapter_id);
CREATE INDEX idx_structure_violations_unresolved ON structure_violations(chapter_id) WHERE resolved = FALSE;
CREATE INDEX idx_timeline_events_chapter_id ON timeline_events(chapter_id);
CREATE INDEX idx_character_status_snapshots_character_id ON character_status_snapshots(character_id);
CREATE INDEX idx_chapter_chronology_reports_chapter_id ON chapter_chronology_reports(chapter_id);
CREATE INDEX idx_world_building_elements_related_characters ON world_building_elements USING GIN(related_characters);
CREATE INDEX idx_world_building_elements_related_locations ON world_building_elements USING GIN(related_locations);
CREATE INDEX idx_writing_goals_series_id ON writing_goals(series_id);
CREATE INDEX idx_writing_goals_book_id ON writing_goals(book_id);
CREATE INDEX idx_writing_goals_dates ON writing_goals(start_date, end_date);

-- Drop and recreate updated views
DROP VIEW IF EXISTS book_progress CASCADE;
DROP VIEW IF EXISTS writing_analytics CASCADE;
DROP VIEW IF EXISTS chapter_structure_progress CASCADE;
DROP VIEW IF EXISTS writing_goals_progress CASCADE;

CREATE VIEW book_progress AS
SELECT 
    b.id,
    b.series_id,
    s.name as series_name,
    b.book_number,
    b.title,
    b.status,
    b.target_word_count,
    b.target_chapters,
    COUNT(c.id) as chapters_created,
    COALESCE(SUM(c.word_count), 0) as current_word_count,
    calculate_percentage(COALESCE(SUM(c.word_count)::numeric, 0), NULLIF(b.target_word_count::numeric, 0)) as completion_percentage
FROM books b
LEFT JOIN series s ON b.series_id = s.id
LEFT JOIN chapters c ON b.id = c.book_id
GROUP BY b.id, b.series_id, s.name, b.book_number, b.title, b.status, b.target_word_count, b.target_chapters;

CREATE VIEW writing_analytics AS
SELECT 
    b.id as book_id,
    b.title,
    b.word_count,
    b.target_word_count,
    b.chapter_count,
    b.target_chapters,
    b.status,
    b.outline_complete,
    b.first_draft_complete, 
    b.editing_complete,
    calculate_percentage(b.word_count::numeric, b.target_word_count::numeric) as completion_percentage,
    COUNT(ws.id) as total_sessions,
    COALESCE(SUM(ws.words_written), 0) as total_words_logged,
    ROUND(COALESCE(AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL), 0)::numeric, 2) as avg_productivity,
    ROUND(COALESCE(AVG(ws.words_written) FILTER (WHERE ws.words_written > 0), 0)::numeric, 0) as avg_words_per_session,
    (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND c.status = 'final') as completed_chapters
FROM books b
LEFT JOIN writing_sessions ws ON b.id = ws.book_id
GROUP BY b.id, b.title, b.word_count, b.target_word_count, b.chapter_count, b.target_chapters, 
         b.status, b.outline_complete, b.first_draft_complete, b.editing_complete;

CREATE VIEW chapter_structure_progress AS
SELECT 
    c.id as chapter_id,
    c.book_id,
    b.title as book_title,
    c.chapter_number,
    c.title as chapter_title,
    c.status,
    c.word_count,
    c.target_word_count,
    calculate_percentage(c.word_count::numeric, c.target_word_count::numeric) as completion_percentage,
    CASE 
        WHEN c.outline IS NOT NULL AND LENGTH(TRIM(c.outline)) > 0 THEN true 
        ELSE false 
    END as has_outline,
    CASE 
        WHEN c.content IS NOT NULL AND LENGTH(TRIM(c.content)) > 0 THEN true 
        ELSE false 
    END as has_content,
    CASE 
        WHEN c.status = 'final' THEN 100
        WHEN c.status = 'revised' THEN 75
        WHEN c.status = 'drafted' THEN 50
        WHEN c.status = 'outlined' THEN 25
        ELSE 0
    END as progress_score,
    COUNT(ws.id) as session_count,
    COALESCE(SUM(ws.words_written), 0) as words_in_sessions
FROM chapters c
JOIN books b ON c.book_id = b.id
LEFT JOIN writing_sessions ws ON c.id = ws.chapter_id
GROUP BY c.id, c.book_id, b.title, c.chapter_number, c.title, c.status, 
         c.word_count, c.target_word_count, c.outline, c.content;

CREATE VIEW writing_goals_progress AS
SELECT 
    wg.id as goal_id,
    wg.series_id,
    wg.book_id,
    b.title as book_title,
    wg.goal_type,
    wg.target_words,
    wg.target_chapters,
    wg.target_sessions,
    wg.start_date,
    wg.end_date,
    wg.completed,
    -- Words written during the goal period
    COALESCE((
        SELECT SUM(ws.words_written)
        FROM writing_sessions ws
        WHERE 
            (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
            (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
            ws.session_start >= wg.start_date AND
            (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
    ), 0) as words_written,
    -- Chapters completed during the goal period
    COALESCE((
        SELECT COUNT(*)
        FROM chapters c
        JOIN books b ON c.book_id = b.id
        WHERE 
            (wg.book_id IS NULL OR c.book_id = wg.book_id) AND
            (wg.series_id IS NULL OR b.series_id = wg.series_id) AND
            c.updated_at >= wg.start_date AND
            (wg.end_date IS NULL OR c.updated_at <= wg.end_date) AND
            c.status IN ('revised', 'final')
    ), 0) as chapters_completed,
    -- Sessions completed during the goal period
    COALESCE((
        SELECT COUNT(*)
        FROM writing_sessions ws
        WHERE 
            (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
            (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
            ws.session_start >= wg.start_date AND
            (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
    ), 0) as sessions_completed,
    -- Calculate progress percentages using the calculate_percentage function
    calculate_percentage(
        COALESCE((
            SELECT SUM(ws.words_written)
            FROM writing_sessions ws
            WHERE 
                (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
                (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
                ws.session_start >= wg.start_date AND
                (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
        ), 0)::numeric,
        NULLIF(wg.target_words, 0)::numeric
    ) as words_progress_percentage,
    calculate_percentage(
        COALESCE((
            SELECT COUNT(*)::numeric
            FROM chapters c
            JOIN books b ON c.book_id = b.id
            WHERE 
                (wg.book_id IS NULL OR c.book_id = wg.book_id) AND
                (wg.series_id IS NULL OR b.series_id = wg.series_id) AND
                c.updated_at >= wg.start_date AND
                (wg.end_date IS NULL OR c.updated_at <= wg.end_date) AND
                c.status IN ('revised', 'final')
        ), 0),
        NULLIF(wg.target_chapters, 0)::numeric
    ) as chapters_progress_percentage,
    calculate_percentage(
        COALESCE((
            SELECT COUNT(*)::numeric
            FROM writing_sessions ws
            WHERE 
                (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
                (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
                ws.session_start >= wg.start_date AND
                (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
        ), 0),
        NULLIF(wg.target_sessions, 0)::numeric
    ) as sessions_progress_percentage
FROM writing_goals wg
LEFT JOIN books b ON wg.book_id = b.id
ORDER BY wg.end_date;

-- Add triggers for new tables
CREATE TRIGGER update_chapter_structure_plans_updated_at BEFORE UPDATE ON chapter_structure_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_writing_goals_updated_at BEFORE UPDATE ON writing_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE character_knowledge_states IS 'Tracks what each character knows at specific story points';
COMMENT ON COLUMN character_knowledge_states.knowledge_state IS 'States include: knows, suspects, unaware, memory_gap, knows_with_oz_protection';
COMMENT ON COLUMN character_knowledge_states.confidence_level IS 'How certain the character is about this knowledge';
COMMENT ON COLUMN character_knowledge_states.restrictions IS 'Any specific limitations on how the character can use or reference this knowledge';

-- Insert some initial data for testing
INSERT INTO series (name, pen_name, genre, world_type, description, total_planned_books) 
VALUES (
    'Shadow Badge Chronicles',
    'Your Pen Name',
    'Urban Fantasy Police Procedural',
    'Post-Cyberpunk Urban Fantasy',
    'A morally grey non-human protagonist navigating police work in a world where technology and magic coexist, while hiding his true nature from colleagues and criminals alike.',
    20
);

-- Insert a sample book to get started
INSERT INTO books (series_id, book_number, title, main_case_description, mini_arc_position, target_word_count, target_chapters)
VALUES (
    1,
    1,
    'Digital Shadows',
    'A tech executive is found dead in a sealed smart office, with all digital evidence pointing to impossible circumstances. The case forces Detective Kane to confront the intersection of human and non-human worlds.',
    'Book 1 of 3 in The Awakening Arc',
    100000,
    40
);

-- Create a sample protagonist character
INSERT INTO characters (series_id, name, character_type, species, occupation, department, rank_title, 
                       personality_traits, background_story, secrets, goals, moral_alignment, importance_level)
VALUES (
    1,
    'Detective Marcus Kane',
    'protagonist',
    'Non-human (specific nature TBD)',
    'Detective',
    'Metropolitan Police Department',
    'Detective Second Grade',
    'Analytical, guarded, dry humor, strong sense of justice despite moral flexibility',
    'Joined the force after a mysterious past. Excellent solve rate, but colleagues find him distant.',
    'Not human - true nature unknown to colleagues. May have enhanced abilities that aid in investigation.',
    'Solve cases while maintaining his cover identity. Eventually understand his true nature and place in both worlds.',
    'Chaotic Good',
    10
);

-- Add some initial plot threads
INSERT INTO plot_threads (series_id, thread_type, title, description, start_book, end_book, importance_level)
VALUES 
(1, 'series_arc', 'The Convergence Protocol', 'Ancient conspiracy involving the integration of human and non-human societies, with corporate and governmental players on both sides.', 1, 20, 10),
(1, 'mini_arc', 'The Awakening Cases', 'First three cases that begin to reveal the supernatural and technological underbelly of the city.', 1, 3, 8);

-- Add a sample case for book 1
INSERT INTO cases (book_id, case_name, case_type, victim_info, case_status, priority_level)
VALUES (
    1,
    'The Locked Room Protocol',
    'murder',
    'Tech executive found dead in secured smart office with no apparent means of entry or exit.',
    'open',
    'high'
);

COMMIT;