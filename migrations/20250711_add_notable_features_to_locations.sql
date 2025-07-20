-- Migration to add the 'notable_features' column to the 'locations' table

ALTER TABLE public.locations
ADD COLUMN notable_features TEXT;
