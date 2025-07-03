# Character Knowledge State Tracker Guide

This guide explains how to use the Character Knowledge State Tracker, which has been implemented to address the critical need for tracking what characters know at specific points in the story.

## Overview

The Character Knowledge State Tracker allows you to:

1. Record what characters know, suspect, or are unaware of at specific points in the story
2. Check if a character can reference specific information at a given point
3. Get a complete knowledge state for a character at any chapter
4. Validate scene content against a character's knowledge boundaries

This helps prevent continuity errors where characters reference information they shouldn't know yet.

## Database Schema

The tracker uses a `character_knowledge_states` table with the following structure:

```sql
CREATE TABLE character_knowledge_states (
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
```

## Using the API

### 1. Setting Character Knowledge

To record what a character knows at a specific point:

```http
POST /api/character-knowledge/set-state
Content-Type: application/json
X-Series-ID: 1

{
  "character_id": 123,
  "book_id": 1,
  "chapter_id": 20,
  "knowledge_item": "Marcus Thorne's current location",
  "knowledge_state": "knows_with_oz_protection",
  "source": "told_by_oz_chapter_18",
  "confidence_level": "certain",
  "can_reference_directly": false,
  "restrictions": "cannot_reveal_specific_address",
  "internal_thought_ok": true,
  "dialogue_restriction": "must_remain_vague"
}
```

### 2. Checking if a Character Can Reference Information

To check if a character can reference specific information:

```http
GET /api/character-knowledge/can-reference?character_id=123&knowledge_item=marcus_location&at_chapter=20
X-Series-ID: 1
```

Response:
```json
{
  "can_reference": true,
  "limitation": "cannot_reveal_specific_address",
  "internal_thought_ok": true,
  "dialogue_restriction": "must_remain_vague"
}
```

### 3. Getting Complete Knowledge State

To get a character's complete knowledge state at a specific chapter:

```http
GET /api/character-knowledge/state/123/at-chapter/20
X-Series-ID: 1
```

Response:
```json
{
  "character_id": 123,
  "at_chapter": 20,
  "confirmed_knowledge": [
    {
      "knowledge_item": "Marcus Thorne's current location",
      "knowledge_state": "knows_with_oz_protection",
      "source": "told_by_oz_chapter_18",
      "confidence_level": "certain",
      "can_reference_directly": false,
      "restrictions": "cannot_reveal_specific_address"
    },
    // Other confirmed knowledge items...
  ],
  "suspected_but_unconfirmed": [
    // Items the character suspects but isn't certain about...
  ],
  "explicitly_doesnt_know": [
    // Items the character explicitly doesn't know...
  ],
  "memory_gaps": [
    // Items the character has forgotten or has gaps about...
  ]
}
```

### 4. Validating Scene Content

To validate if scene content respects knowledge boundaries:

```http
POST /api/character-knowledge/validate-scene
Content-Type: application/json
X-Series-ID: 1

{
  "character_id": 123,
  "chapter_id": 20,
  "scene_content": "Jax thought about Marcus being safe with Oz...",
  "content_type": "internal_thought"
}
```

Response:
```json
{
  "valid": true,
  "violations": [],
  "warnings": [
    {
      "knowledge_item": "Marcus Thorne's current location",
      "warning_type": "direct_reference_to_restricted_knowledge",
      "severity": "medium",
      "suggestion": "Character should be more vague when referencing 'Marcus Thorne's current location'"
    }
  ]
}
```

## Using MCP Tools

The Character Knowledge State Tracker provides the following MCP tools:

### 1. `set_character_knowledge_state`

```javascript
// Example MCP tool call
const result = await callTool('set_character_knowledge_state', {
  character_id: 123,
  book_id: 1,
  chapter_id: 20,
  knowledge_item: "Marcus Thorne's current location",
  knowledge_state: "knows_with_oz_protection",
  source: "told_by_oz_chapter_18",
  confidence_level: "certain",
  can_reference_directly: false,
  restrictions: "cannot_reveal_specific_address",
  internal_thought_ok: true,
  dialogue_restriction: "must_remain_vague"
});
```

### 2. `check_character_can_reference`

```javascript
// Example MCP tool call
const result = await callTool('check_character_can_reference', {
  character_id: 123,
  knowledge_item: "marcus_location",
  at_chapter: 20
});
```

### 3. `get_character_knowledge_state`

```javascript
// Example MCP tool call
const result = await callTool('get_character_knowledge_state', {
  character_id: 123,
  chapter_id: 20
});
```

### 4. `validate_scene_against_knowledge`

```javascript
// Example MCP tool call
const result = await callTool('validate_scene_against_knowledge', {
  character_id: 123,
  chapter_id: 20,
  scene_content: "Jax thought about Marcus being safe with Oz...",
  content_type: "internal_thought"
});
```

## Best Practices

1. **Set up knowledge states before writing**: Before starting a new chapter, make sure all character knowledge states are properly recorded up to that point.

2. **Be specific with knowledge items**: Use specific, consistent names for knowledge items (e.g., "Marcus Thorne's current location" rather than just "Marcus location").

3. **Record knowledge changes as they happen**: Update the knowledge states as soon as a character learns new information in the story.

4. **Validate scenes regularly**: Use the validation tool to ensure your scene content respects the established knowledge boundaries.

5. **Use appropriate restrictions**: Be specific about how characters can reference sensitive information, especially for plot-critical secrets.

## Example Workflow for Chapter 21

1. Get the complete knowledge state for all main characters through Chapter 20:
   ```javascript
   for (const characterId of mainCharacterIds) {
     const knowledgeState = await callTool('get_character_knowledge_state', {
       character_id: characterId,
       chapter_id: 20
     });
     // Review knowledge state
   }
   ```

2. Before writing a scene, check if characters can reference key information:
   ```javascript
   const canReference = await callTool('check_character_can_reference', {
     character_id: 123,
     knowledge_item: "marcus_location",
     at_chapter: 21
   });
   ```

3. After writing, validate the scene:
   ```javascript
   const validationResult = await callTool('validate_scene_against_knowledge', {
     character_id: 123,
     chapter_id: 21,
     scene_content: sceneContent,
     content_type: "dialogue"
   });
   ```

4. Update knowledge states based on new information revealed in Chapter 21:
   ```javascript
   await callTool('set_character_knowledge_state', {
     character_id: 123,
     book_id: 1,
     chapter_id: 21,
     knowledge_item: "New clue discovered",
     knowledge_state: "knows",
     source: "discovered_in_investigation",
     confidence_level: "certain"
   });
   ```

## Troubleshooting

- **Missing Knowledge States**: If validation is failing, check if you've properly set up all the knowledge states for the character.

- **Incorrect Chapter References**: Make sure you're referencing the correct chapter IDs when checking knowledge states.

- **Too Restrictive Settings**: If you're getting too many validation warnings, review your knowledge state restrictions to ensure they're not overly strict.

- **Database Errors**: If you encounter database errors, make sure the character, book, and chapter IDs exist in the database.
