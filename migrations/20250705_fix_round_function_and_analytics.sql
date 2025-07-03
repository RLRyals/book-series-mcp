-- Migration: Fix ROUND function issue and update analytics views
-- Date: 2025-07-01

-- First, let's update the book_progress view to fix the ROUND function syntax
-- PostgreSQL's ROUND function requires the correct cast to numeric
DROP VIEW IF EXISTS book_progress;

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
    ROUND((COALESCE(SUM(c.word_count), 0)::numeric / NULLIF(b.target_word_count, 0)) * 100, 2) as completion_percentage
FROM books b
LEFT JOIN series s ON b.series_id = s.id
LEFT JOIN chapters c ON b.id = c.book_id
GROUP BY b.id, b.series_id, s.name, b.book_number, b.title, b.status, b.target_word_count, b.target_chapters;

-- Create a new analytics view for writing productivity metrics
CREATE OR REPLACE VIEW writing_analytics AS
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
    ROUND((b.word_count::numeric / NULLIF(b.target_word_count, 0)) * 100, 2) as completion_percentage,
    COUNT(ws.id) as total_sessions,
    COALESCE(SUM(ws.words_written), 0) as total_words_logged,
    ROUND(AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL), 2) as avg_productivity,
    ROUND(AVG(ws.words_written) FILTER (WHERE ws.words_written > 0), 0) as avg_words_per_session,
    (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND c.status = 'final') as completed_chapters
FROM books b
LEFT JOIN writing_sessions ws ON b.id = ws.book_id
GROUP BY b.id, b.title, b.word_count, b.target_word_count, b.chapter_count, b.target_chapters, 
         b.status, b.outline_complete, b.first_draft_complete, b.editing_complete;

-- Create a chapter structure progress view
CREATE OR REPLACE VIEW chapter_structure_progress AS
SELECT 
    c.id as chapter_id,
    c.book_id,
    b.title as book_title,
    c.chapter_number,
    c.title as chapter_title,
    c.status,
    c.word_count,
    c.target_word_count,
    ROUND((c.word_count::numeric / NULLIF(c.target_word_count, 0)) * 100, 2) as completion_percentage,
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

-- Create a writing goals and productivity baselines table
CREATE TABLE IF NOT EXISTS writing_goals (
    id SERIAL PRIMARY KEY,
    series_id INTEGER REFERENCES series(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- daily, weekly, monthly, book_completion
    target_words INTEGER,
    target_chapters INTEGER,
    target_sessions INTEGER,
    start_date DATE,
    end_date DATE,
    recurring BOOLEAN DEFAULT FALSE,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for the new writing_goals table
CREATE INDEX idx_writing_goals_series_id ON writing_goals(series_id);
CREATE INDEX idx_writing_goals_book_id ON writing_goals(book_id);
CREATE INDEX idx_writing_goals_dates ON writing_goals(start_date, end_date);

-- Add a trigger for updating timestamps on writing_goals
CREATE TRIGGER update_writing_goals_updated_at BEFORE UPDATE ON writing_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a view for tracking writing goals progress
CREATE OR REPLACE VIEW writing_goals_progress AS
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
    -- Goal progress percentages
    CASE 
        WHEN wg.target_words > 0 THEN 
            ROUND((COALESCE((
                SELECT SUM(ws.words_written)
                FROM writing_sessions ws
                WHERE 
                    (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
                    (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
                    ws.session_start >= wg.start_date AND
                    (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
            ), 0)::numeric / wg.target_words) * 100, 2)
        ELSE NULL
    END as words_progress_percentage,
    CASE 
        WHEN wg.target_chapters > 0 THEN 
            ROUND((COALESCE((
                SELECT COUNT(*)
                FROM chapters c
                JOIN books b ON c.book_id = b.id
                WHERE 
                    (wg.book_id IS NULL OR c.book_id = wg.book_id) AND
                    (wg.series_id IS NULL OR b.series_id = wg.series_id) AND
                    c.updated_at >= wg.start_date AND
                    (wg.end_date IS NULL OR c.updated_at <= wg.end_date) AND
                    c.status IN ('revised', 'final')
            ), 0)::numeric / wg.target_chapters) * 100, 2)
        ELSE NULL
    END as chapters_progress_percentage,
    CASE 
        WHEN wg.target_sessions > 0 THEN 
            ROUND((COALESCE((
                SELECT COUNT(*)
                FROM writing_sessions ws
                WHERE 
                    (wg.book_id IS NULL OR ws.book_id = wg.book_id) AND
                    (wg.series_id IS NULL OR ws.series_id = wg.series_id) AND
                    ws.session_start >= wg.start_date AND
                    (wg.end_date IS NULL OR ws.session_start <= wg.end_date)
            ), 0)::numeric / wg.target_sessions) * 100, 2)
        ELSE NULL
    END as sessions_progress_percentage
FROM writing_goals wg
LEFT JOIN books b ON wg.book_id = b.id
ORDER BY wg.end_date;
