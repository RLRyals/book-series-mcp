// tests/character-knowledge-tracker-test.js
// Test script for the Character Knowledge State Tracker

import { DatabaseManager } from '../src/shared/database.js';
import { CharacterKnowledgeController } from '../src/research-server/controllers/character-knowledge-controller.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure database connection is configured
if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set.');
    console.error('Setting default Docker PostgreSQL connection string...');
    process.env.DATABASE_URL = 'postgresql://writer:secure_writing_password_2024@localhost:5432/book_series';
}

// Test configuration
const TEST_CHARACTER_ID = 1; // Assuming character ID 1 exists
const TEST_BOOK_ID = 1; // Assuming book ID 1 exists
const TEST_CHAPTER_ID = 1; // Assuming chapter ID 1 exists

// Initialize the database and controller
const db = new DatabaseManager();
const controller = new CharacterKnowledgeController(db);

// Display connection info
console.error('Testing with database connection:');
console.error(`Database URL: ${process.env.DATABASE_URL.substring(0, process.env.DATABASE_URL.indexOf('@'))}****@${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.indexOf('@')+1)}`);

// Test setting a knowledge state
async function testSetKnowledgeState() {
    console.error('TESTING: Set Knowledge State');
    
    try {
        const result = await controller.setKnowledgeState({
            character_id: TEST_CHARACTER_ID,
            book_id: TEST_BOOK_ID,
            chapter_id: TEST_CHAPTER_ID,
            knowledge_item: "Test Knowledge Item",
            knowledge_state: "knows",
            source: "test_source",
            confidence_level: "certain",
            can_reference_directly: true,
            can_reference_indirectly: true,
            restrictions: "Test restrictions",
            internal_thought_ok: true,
            dialogue_restriction: "No restrictions"
        });
        
        console.error('Set Knowledge State Result:', result);
        console.error('PASSED: Set Knowledge State');
        return result.knowledge_state.id; // Return the ID for use in other tests
    } catch (error) {
        console.error('FAILED: Set Knowledge State', error);
        throw error;
    }
}

// Test checking if a character can reference knowledge
async function testCanReference(knowledgeId) {
    console.error('TESTING: Can Reference Knowledge');
    
    try {
        const result = await controller.canReference({
            character_id: TEST_CHARACTER_ID,
            knowledge_item: "Test Knowledge Item",
            at_chapter: TEST_CHAPTER_ID
        });
        
        console.error('Can Reference Result:', result);
        console.error('PASSED: Can Reference Knowledge');
        return result;
    } catch (error) {
        console.error('FAILED: Can Reference Knowledge', error);
        throw error;
    }
}

// Test getting complete knowledge state
async function testGetKnowledgeState() {
    console.error('TESTING: Get Knowledge State');
    
    try {
        const result = await controller.getCharacterKnowledgeState({
            character_id: TEST_CHARACTER_ID,
            chapter_id: TEST_CHAPTER_ID
        });
        
        console.error('Get Knowledge State Result:', result);
        console.error('PASSED: Get Knowledge State');
        return result;
    } catch (error) {
        console.error('FAILED: Get Knowledge State', error);
        throw error;
    }
}

// Test validating a scene
async function testValidateScene() {
    console.error('TESTING: Validate Scene');
    
    try {
        const result = await controller.validateScene({
            character_id: TEST_CHARACTER_ID,
            chapter_id: TEST_CHAPTER_ID,
            scene_content: "This is a test scene mentioning Test Knowledge Item explicitly.",
            content_type: "dialogue"
        });
        
        console.error('Validate Scene Result:', result);
        console.error('PASSED: Validate Scene');
        return result;
    } catch (error) {
        console.error('FAILED: Validate Scene', error);
        throw error;
    }
}

// Run all the tests
async function runTests() {
    try {
        console.error('Starting Character Knowledge Tracker Tests...');
        
        // Run the tests
        const knowledgeId = await testSetKnowledgeState();
        await testCanReference(knowledgeId);
        await testGetKnowledgeState();
        await testValidateScene();
        
        console.error('All tests completed successfully!');
    } catch (error) {
        console.error('Test suite failed:', error);
    } finally {
        // Clean up
        await db.close();
    }
}

// Execute the tests
runTests();
