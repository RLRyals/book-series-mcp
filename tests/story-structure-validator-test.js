// tests/story-structure-validator-test.js
// Test script for the Story Structure Validator functionality

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { DatabaseManager } from '../src/shared/database.js';

dotenv.config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';
const WRITING_SERVER_API = `${API_BASE_URL}/api/story-structure`;

// Test data
let testChapterId;
const testChapterPlan = {
    initial_goal: "Sleep after exhausting day",
    disturbance: "Davies urgent message about mage evidence",
    new_goal: "Create investigation board and prep for meeting",
    complications: ["Multi-tasking while exhausted", "IRIS boundaries"],
    turning_point: "Exhaustion vs competing demands",
    choice: "Continue relying on IRIS with new parameters",
    consequences: "Scattered board, incomplete analysis",
    next_setup: "Collapse from exhaustion"
};

const testBeatPlacement = {
    chapter_word_count: 2500,
    beats: {
        goal: { start: 0, end: 250 },
        disturbance: { start: 250, end: 400 },
        new_goal: { start: 400, end: 500 },
        complications: { start: 500, end: 1750 },
        turning_point: { start: 1750, end: 1900 },
        choice: { start: 1900, end: 2100 },
        consequences: { start: 2100, end: 2300 },
        next_setup: { start: 2300, end: 2500 }
    }
};

// Helper function for API calls
async function callApi(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${WRITING_SERVER_API}${endpoint}`, options);
    return await response.json();
}

// Setup: Create a test chapter
async function setupTestChapter() {
    console.error('Setting up test chapter...');
    
    const db = new DatabaseManager();
    await db.connect();
    
    try {
        // First, make sure we have a test series and book
        let seriesResult = await db.query(
            `SELECT id FROM series WHERE name = 'Test Series for Structure Validation'`
        );
        
        let seriesId;
        if (seriesResult.rowCount === 0) {
            const insertSeriesResult = await db.query(
                `INSERT INTO series (name, pen_name, genre, world_type, description) 
                 VALUES ('Test Series for Structure Validation', 'Test Author', 'Mystery', 'Urban Fantasy', 'Test series for structure validation')
                 RETURNING id`
            );
            seriesId = insertSeriesResult.rows[0].id;
            console.error(`Created test series with ID ${seriesId}`);
        } else {
            seriesId = seriesResult.rows[0].id;
            console.error(`Using existing test series with ID ${seriesId}`);
        }
        
        // Now check for a test book
        let bookResult = await db.query(
            `SELECT id FROM books WHERE series_id = $1 AND title = 'Test Book for Structure Validation'`,
            [seriesId]
        );
        
        let bookId;
        if (bookResult.rowCount === 0) {
            const insertBookResult = await db.query(
                `INSERT INTO books (series_id, book_number, title, main_case_description) 
                 VALUES ($1, 1, 'Test Book for Structure Validation', 'Test case for structure validation')
                 RETURNING id`,
                [seriesId]
            );
            bookId = insertBookResult.rows[0].id;
            console.error(`Created test book with ID ${bookId}`);
        } else {
            bookId = bookResult.rows[0].id;
            console.error(`Using existing test book with ID ${bookId}`);
        }
        
        // Finally, create or use a test chapter
        let chapterResult = await db.query(
            `SELECT id FROM chapters WHERE book_id = $1 AND title = 'Test Chapter for Structure Validation'`,
            [bookId]
        );
        
        if (chapterResult.rowCount === 0) {
            const insertChapterResult = await db.query(
                `INSERT INTO chapters (book_id, chapter_number, title, status, word_count) 
                 VALUES ($1, 1, 'Test Chapter for Structure Validation', 'drafting', 2500)
                 RETURNING id`,
                [bookId]
            );
            testChapterId = insertChapterResult.rows[0].id;
            console.error(`Created test chapter with ID ${testChapterId}`);
        } else {
            testChapterId = chapterResult.rows[0].id;
            console.error(`Using existing test chapter with ID ${testChapterId}`);
        }

        return testChapterId;
    } catch (error) {
        console.error('Error setting up test chapter:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Test functions
async function testValidateChapterPlan() {
    console.error('\n===== Testing Chapter Plan Validation =====');
    
    const planWithChapterId = {
        ...testChapterPlan,
        chapter_id: testChapterId
    };
    
    try {
        const result = await callApi('/validate-chapter-plan', 'POST', planWithChapterId);
        console.error('Chapter plan validation result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error testing chapter plan validation:', error);
        throw error;
    }
}

async function testCheckViolations() {
    console.error('\n===== Testing Check Violations =====');
    
    try {
        const result = await callApi(`/check-violations/${testChapterId}`, 'GET');
        console.error('Check violations result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error testing check violations:', error);
        throw error;
    }
}

async function testValidateBeatPlacement() {
    console.error('\n===== Testing Beat Placement Validation =====');
    
    const beatDataWithChapterId = {
        ...testBeatPlacement,
        chapter_id: testChapterId
    };
    
    try {
        const result = await callApi('/validate-beat-placement', 'POST', beatDataWithChapterId);
        console.error('Beat placement validation result:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error testing beat placement validation:', error);
        throw error;
    }
}

// Run tests
async function runTests() {
    try {
        // Setup
        await setupTestChapter();
        
        // Run tests
        await testValidateChapterPlan();
        await testCheckViolations();
        await testValidateBeatPlacement();
        
        console.error('\n===== All tests completed =====');
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

// Run the tests
runTests();
