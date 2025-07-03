# Story Structure Validator Guide

This guide provides information on using the Story Structure Validator extension for the Book Series MCP system. This tool helps ensure that your chapters follow proven story structure principles, preventing revision cycles and improving overall story quality.

## Features

The Story Structure Validator provides the following capabilities:

1. **Chapter Structure Planning**: Define and validate the key structural elements of a chapter
2. **Structure Violation Detection**: Identify issues with story structure before or during writing
3. **Beat Placement Analysis**: Ensure proper proportions of different story beats within a chapter

## Setup

### 1. Run the Migration

Before using the Story Structure Validator, you need to run the database migration:

```bash
npm run migrate:story-structure
```

### 2. Start the Writing Server

Make sure the Writing Production server is running:

```bash
npm run start:writing
```

Or via Docker:

```powershell
./db-docker-tools.ps1 start-writing-server
```

## API Endpoints

### 1. Validate Chapter Plan

**Endpoint**: `POST /api/story-structure/validate-chapter-plan`

**Description**: Validates a chapter structure plan against story structure rules

**Request Body**:
```json
{
  "chapter_id": 21,
  "initial_goal": "Sleep after exhausting day",
  "disturbance": "Davies urgent message about mage evidence",
  "new_goal": "Create investigation board and prep for meeting",
  "complications": ["Multi-tasking while exhausted", "IRIS boundaries"],
  "turning_point": "Exhaustion vs competing demands",
  "choice": "Continue relying on IRIS with new parameters",
  "consequences": "Scattered board, incomplete analysis",
  "next_setup": "Collapse from exhaustion"
}
```

**Response**:
```json
{
  "success": true,
  "plan": {
    "id": 1,
    "chapter_id": 21,
    "initial_goal": "Sleep after exhausting day",
    "disturbance": "Davies urgent message about mage evidence",
    "new_goal": "Create investigation board and prep for meeting",
    "complications": ["Multi-tasking while exhausted", "IRIS boundaries"],
    "turning_point": "Exhaustion vs competing demands",
    "choice": "Continue relying on IRIS with new parameters",
    "consequences": "Scattered board, incomplete analysis",
    "next_setup": "Collapse from exhaustion",
    "created_at": "2025-07-02T10:30:00.000Z",
    "updated_at": "2025-07-02T10:30:00.000Z"
  },
  "validation": {
    "valid": true,
    "violations": []
  }
}
```

### 2. Check Structure Violations

**Endpoint**: `GET /api/story-structure/check-violations/{chapter_id}`

**Description**: Check for structure violations in a chapter

**Response**:
```json
{
  "success": true,
  "violations": [
    {
      "id": 1,
      "chapter_id": 21,
      "violation_type": "goal_sequence_error",
      "description": "Character pursuing original goal after disturbance",
      "severity": "high",
      "suggestion": "Ensure all actions serve new goal after disturbance",
      "resolved": false,
      "created_at": "2025-07-02T10:35:00.000Z",
      "updated_at": "2025-07-02T10:35:00.000Z"
    }
  ]
}
```

### 3. Validate Beat Placement

**Endpoint**: `POST /api/story-structure/validate-beat-placement`

**Description**: Validate beat progression percentages in a chapter

**Request Body**:
```json
{
  "chapter_id": 21,
  "chapter_word_count": 2500,
  "beats": {
    "goal": {"start": 0, "end": 250},
    "disturbance": {"start": 250, "end": 400},
    "new_goal": {"start": 400, "end": 500},
    "complications": {"start": 500, "end": 1750},
    "turning_point": {"start": 1750, "end": 1900},
    "choice": {"start": 1900, "end": 2100},
    "consequences": {"start": 2100, "end": 2300},
    "next_setup": {"start": 2300, "end": 2500}
  }
}
```

**Response**:
```json
{
  "success": true,
  "beatPlacement": {
    "id": 1,
    "chapter_id": 21,
    "chapter_word_count": 2500,
    "goal_start": 0,
    "goal_end": 250,
    "disturbance_start": 250,
    "disturbance_end": 400,
    "new_goal_start": 400,
    "new_goal_end": 500,
    "complications_start": 500,
    "complications_end": 1750,
    "turning_point_start": 1750,
    "turning_point_end": 1900,
    "choice_start": 1900,
    "choice_end": 2100,
    "consequences_start": 2100,
    "consequences_end": 2300,
    "next_setup_start": 2300,
    "next_setup_end": 2500,
    "created_at": "2025-07-02T10:40:00.000Z",
    "updated_at": "2025-07-02T10:40:00.000Z"
  },
  "validation": {
    "valid": true,
    "violations": []
  }
}
```

## Using with Claude Desktop

The Story Structure Validator is available through the Writing Production MCP server in Claude Desktop. You can use the following tools:

### 1. Validate Chapter Structure

Use this tool to validate the overall structure of your chapter plan:

```json
{
  "tool": "validate_chapter_structure",
  "args": {
    "chapter_id": 21,
    "initial_goal": "Sleep after exhausting day",
    "disturbance": "Davies urgent message about mage evidence",
    "new_goal": "Create investigation board and prep for meeting",
    "complications": ["Multi-tasking while exhausted", "IRIS boundaries"],
    "turning_point": "Exhaustion vs competing demands",
    "choice": "Continue relying on IRIS with new parameters",
    "consequences": "Scattered board, incomplete analysis",
    "next_setup": "Collapse from exhaustion"
  }
}
```

### 2. Check Structure Violations

Use this tool to check for violations in a specific chapter:

```json
{
  "tool": "check_structure_violations",
  "args": {
    "chapter_id": 21
  }
}
```

### 3. Validate Beat Placement

Use this tool to validate the proportions of different story beats:

```json
{
  "tool": "validate_beat_placement",
  "args": {
    "chapter_id": 21,
    "chapter_word_count": 2500,
    "beats": {
      "goal": {"start": 0, "end": 250},
      "disturbance": {"start": 250, "end": 400},
      "new_goal": {"start": 400, "end": 500},
      "complications": {"start": 500, "end": 1750},
      "turning_point": {"start": 1750, "end": 1900},
      "choice": {"start": 1900, "end": 2100},
      "consequences": {"start": 2100, "end": 2300},
      "next_setup": {"start": 2300, "end": 2500}
    }
  }
}
```

## Testing

To test the Story Structure Validator functionality:

```bash
npm run test:story-structure
```

This will create a test chapter and run validation on it, demonstrating how the validator works.

## Workflow Integration

### Before Writing a Chapter

1. Create a chapter plan with key structural elements
2. Validate the plan using the `validate_chapter_structure` tool
3. Fix any structural issues identified

### During Writing

1. At key milestone points (e.g., 25%, 50%, 75%), validate beat placement
2. Check for structure violations 
3. Make adjustments to keep the story on track

### After Writing

1. Final validation of the complete chapter
2. Fix any remaining structural issues
3. Use this data for planning the next chapter

## Structure Rules and Guidelines

The validator enforces several key story structure principles:

1. **Goal-Disruption-New Goal**: Every chapter should start with a character goal, which is disrupted, leading to a new goal
2. **Rising Complications**: Multiple obstacles should stand in the way of achieving the new goal
3. **Turning Point**: A major decision point or revelation
4. **Choice**: The character makes a significant choice
5. **Consequences**: Clear outcomes from that choice
6. **Next Setup**: Optional setup for the next chapter

### Beat Placement Guidelines

For optimal pacing, the validator suggests these approximate proportions:

- Initial Goal: 5-15% of chapter
- Disturbance: 3-10% of chapter
- New Goal: 3-10% of chapter
- Complications: 30-50% of chapter
- Turning Point: 5-15% of chapter
- Choice: 5-15% of chapter
- Consequences: 5-15% of chapter
- Next Setup: 5-15% of chapter (optional)

## Troubleshooting

If you encounter issues with the Story Structure Validator:

1. Ensure the writing server is running
2. Check that the migration has been applied
3. Verify that the chapter ID exists in the database
4. Check the server logs for any error messages
