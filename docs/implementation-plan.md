# MCP API Extensions Implementation Plan

This document outlines the implementation plan for the extensions described in the MCP API Extensions requirements document.

## Environment Setup

The implementation is designed to work with:

- **Database**: PostgreSQL running in Docker
- **MCP Servers**: Managed through Claude Desktop with the following configuration:
  - Character Development Server (Port 3001)
  - Plot Management Server (Port 3002)
  - World Building Server (Port 3003)
  - Writing Production Server (Port 3004)
  - Research Continuity Server (Port 3005)
  - Book Series Manager (Port 3000)

## COMPLETED: Extension 1 - Character Knowledge State Tracker

The Character Knowledge State Tracker has been implemented in the Research-Continuity Server. The implementation includes:

1. Database Schema:
   - New `character_knowledge_states` table for tracking what characters know at specific points in the story
   - Indexes for efficient querying
   - Constraints to ensure data integrity

2. Controller:
   - `CharacterKnowledgeController` with methods for:
     - Setting/updating character knowledge states
     - Checking if a character can reference specific information
     - Getting complete knowledge state for a character at a specific chapter
     - Validating scene content against knowledge boundaries

3. API Endpoints:
   - `POST /api/character-knowledge/set-state` - Track what a character knows
   - `GET /api/character-knowledge/can-reference` - Check if a character can reference information
   - `GET /api/character-knowledge/state/{character_id}/at-chapter/{chapter_id}` - Get complete knowledge state
   - `POST /api/character-knowledge/validate-scene` - Validate scene content against knowledge boundaries

4. MCP Tools:
   - `set_character_knowledge_state`
   - `check_character_can_reference`
   - `get_character_knowledge_state`
   - `validate_scene_against_knowledge`

## COMPLETED: Extension 2 - Story Structure Validator

The Story Structure Validator has been implemented in the Writing-Production Server (Port 3004). The implementation includes:

1. Database Schema:
   - New `chapter_structure_plans` table for storing chapter structural components
   - New `beat_placements` table for tracking word positions of each story beat
   - New `structure_violations` table for recording structure issues
   - Indexes for efficient querying

2. Controller:
   - `StoryStructureController` with methods for:
     - Validating chapter structure plans against story principles
     - Checking for structure violations in a chapter
     - Validating beat placement and proportions
     - Identifying and recording structural issues

3. API Endpoints:
   - `POST /api/story-structure/validate-chapter-plan` - Validate a chapter structure plan
   - `GET /api/story-structure/check-violations/{chapter_id}` - Check for structure violations
   - `POST /api/story-structure/validate-beat-placement` - Validate beat progression percentages

4. MCP Tools:
   - `validate_chapter_structure`
   - `check_structure_violations`
   - `validate_beat_placement`

## PLANNED: Extension 3 - Timeline Chronology Enforcer

The Timeline Chronology Enforcer will be implemented in the Plot-Management Server. The implementation will include:

1. Database Schema:
   - New `timeline_events` table for tracking events with precise timestamps
   - New `character_locations` table for tracking character positions at specific times
   - Constraints to prevent timeline conflicts

2. Controller:
   - `TimelineController` with methods for:
     - Validating events against established timeline
     - Checking character status at specific times
     - Generating chronology reports
     - Validating chapters against series timeline

3. API Endpoints:
   - `POST /api/timeline/validate-event` - Validate event against timeline
   - `GET /api/timeline/character-status` - Check character location/status
   - `GET /api/timeline/chapter-chronology/{chapter_id}` - Generate chronology report
   - `POST /api/timeline/validate-chapter` - Validate chapter against timeline

4. MCP Tools:
   - `validate_timeline_event`
   - `get_character_status_at_time`
   - `generate_chronology_report`
   - `validate_chapter_timeline`

## PLANNED: Extension 4 - Cross-Series Boundary Enforcement

The Cross-Series Boundary Enforcement will be implemented across all servers. The implementation will include:

1. Middleware:
   - `enforceSeriesBoundary` middleware function to be applied to all API routes
   - Series validation logic to ensure all referenced IDs belong to the same series

2. Database Utility:
   - Extend `DatabaseManager` to automatically add series filters to queries

3. API Endpoints:
   - `GET /api/series/validate-boundaries` - Validate cross-series references

4. MCP Tools:
   - `validate_series_boundaries`

## Implementation Schedule

Based on the priority matrix in the MCP API Extensions document:

1. **Character Knowledge State Tracker**: COMPLETED
2. **Story Structure Validator**: COMPLETED
3. **Timeline Chronology Enforcer**: Target completion by August 1, 2025
4. **Cross-Series Boundary Enforcement**: Target completion by August 15, 2025

## Testing Strategy

For each extension:

1. Unit tests for controller methods
2. Integration tests for API endpoints
3. End-to-end tests simulating real usage scenarios
4. Validation tests to ensure data integrity
5. Edge case testing for handling unusual inputs and error conditions

## Deployment Strategy

1. Apply database migrations before deploying code changes
2. Deploy changes to staging environment first
3. Perform smoke tests in staging
4. Deploy to production during low-usage windows
5. Monitor for errors after deployment

## Documentation

For each extension:
1. Update API documentation
2. Create usage examples
3. Document database schema changes
4. Update MCP tool documentation
