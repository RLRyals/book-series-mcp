-- Timeline Chronology Enforcer Migration

-- Table for timeline events
ALTER TABLE timeline_events Add COLUMN IF NOT EXISTS previous_event_reference TEXT;
    


-- Table for character status snapshots
CREATE TABLE character_status_snapshots (
    id SERIAL PRIMARY KEY,
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES timeline_events(id) ON DELETE CASCADE,
    status TEXT,
    location TEXT,
    snapshot_time TIMESTAMP NOT NULL,
    last_known_event TEXT,
    conflicts JSONB,
    plausible_activities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for chronology reports
CREATE TABLE chapter_chronology_reports (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    chapter_timespan TEXT,
    events JSONB,
    character_movements JSONB,
    timeline_gaps JSONB,
    potential_conflicts JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_timeline_events_chapter_id ON timeline_events(chapter_id);
CREATE INDEX idx_character_status_snapshots_character_id ON character_status_snapshots(character_id);
CREATE INDEX idx_chapter_chronology_reports_chapter_id ON chapter_chronology_reports(chapter_id);
