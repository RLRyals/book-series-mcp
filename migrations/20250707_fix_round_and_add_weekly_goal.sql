-- Migration: Fix ROUND casting issues and add weekly word goal
-- Date: 2025-07-02

-- Add weekly_word_goal column to writing_goals table
ALTER TABLE writing_goals 
ADD COLUMN weekly_word_goal INTEGER;

-- Drop and recreate views with proper ROUND and CAST handling
DROP VIEW IF EXISTS book_progress CASCADE;
DROP VIEW IF EXISTS writing_analytics CASCADE;
DROP VIEW IF EXISTS chapter_structure_progress CASCADE;

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
    ROUND(COALESCE(SUM(c.word_count)::double precision, 0) / NULLIF(b.target_word_count::double precision, 0) * 100, 2) as completion_percentage
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
    ROUND(COALESCE(b.word_count::double precision, 0) / NULLIF(b.target_word_count::double precision, 0) * 100, 2) as completion_percentage,
    COUNT(ws.id) as total_sessions,
    COALESCE(SUM(ws.words_written), 0) as total_words_logged,
    ROUND(COALESCE(AVG(ws.productivity_rating) FILTER (WHERE ws.productivity_rating IS NOT NULL)::double precision, 0), 2) as avg_productivity,
    ROUND(COALESCE(AVG(ws.words_written) FILTER (WHERE ws.words_written > 0)::double precision, 0), 0) as avg_words_per_session,
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
    ROUND(COALESCE(c.word_count::double precision, 0) / NULLIF(c.target_word_count::double precision, 0) * 100, 2) as completion_percentage,
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
