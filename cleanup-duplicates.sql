-- Check for duplicate series
SELECT id, name, pen_name, genre, created_at 
FROM series 
WHERE name = 'Apple Grove Mystery Series'
ORDER BY id;

-- Check books related to both series
SELECT id, title, series_id, book_number
FROM books
WHERE series_id IN (2, 3)
ORDER BY series_id, book_number;

-- Check characters in both series
SELECT id, name, series_id, character_type
FROM characters
WHERE series_id IN (2, 3)
ORDER BY series_id, name;

-- Check if there are any plot threads or other content related to series_id = 3
SELECT COUNT(*) as plot_thread_count
FROM plot_threads
WHERE series_id = 3;

-- Check if there are any character relationships involving characters from series_id = 3
SELECT cr.*
FROM character_relationships cr
JOIN characters c1 ON cr.character1_id = c1.id
JOIN characters c2 ON cr.character2_id = c2.id
WHERE c1.series_id = 3 OR c2.series_id = 3;

-- CLEANUP COMMANDS (REVIEW CAREFULLY BEFORE RUNNING)

-- 1. First, move any valuable content from duplicate book to original series if needed
-- This is just an example - you may need to adapt based on your needs
-- UPDATE chapters SET book_id = (SELECT id FROM books WHERE series_id = 2 AND book_number = 1)
-- WHERE book_id = 8;

-- 2. Delete relationships involving characters from duplicate series (if any)
--DELETE FROM character_relationships
--WHERE character1_id IN (SELECT id FROM characters WHERE series_id = 3)
--OR character2_id IN (SELECT id FROM characters WHERE series_id = 3);

-- 3. Delete duplicate characters
--DELETE FROM characters WHERE series_id = 3;

-- 4. Delete duplicate book
-- DELETE FROM books WHERE series_id = 3;

-- 5. Delete duplicate series
--DELETE FROM series WHERE id = 3;

-- VERIFICATION QUERIES

-- Verify all is clean after deletion
-- SELECT id, name FROM series WHERE name = 'Apple Grove Mystery Series';
-- SELECT COUNT(*) FROM books WHERE series_id = 3;
-- SELECT COUNT(*) FROM characters WHERE series_id = 3;

--select * FROM chapters 
--WHERE book_id IN (SELECT id FROM books WHERE series_id = 3) 