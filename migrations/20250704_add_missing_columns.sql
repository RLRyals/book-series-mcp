-- Migration: Add missing columns to world_building_elements and locations tables
-- Date: 2025-07-04

-- Add related_characters and related_locations columns to world_building_elements
ALTER TABLE world_building_elements
ADD COLUMN related_characters INTEGER[] DEFAULT '{}',
ADD COLUMN related_locations INTEGER[] DEFAULT '{}';

-- Add access_requirements column to locations
ALTER TABLE locations
ADD COLUMN access_requirements TEXT;

-- Create indexes for the new columns with array elements
CREATE INDEX idx_world_building_elements_related_characters 
ON world_building_elements USING GIN(related_characters);

CREATE INDEX idx_world_building_elements_related_locations 
ON world_building_elements USING GIN(related_locations);

-- Update existing data with default values (if needed)
-- For example, we could set default values for existing records:
-- UPDATE world_building_elements SET related_characters = '{}', related_locations = '{}';
-- UPDATE locations SET access_requirements = '';

-- Documentation of changes:
-- 1. world_building_elements.related_characters: An array of character IDs that are related to this world building element
-- 2. world_building_elements.related_locations: An array of location IDs that are related to this world building element  
-- 3. locations.access_requirements: Text description of requirements to access this location (credentials, permissions, magical abilities, etc.)
