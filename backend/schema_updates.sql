-- Add UUID column to parties table
ALTER TABLE parties ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT uuid_generate_v4();
CREATE UNIQUE INDEX IF NOT EXISTS parties_uuid_idx ON parties(uuid);

-- Add vote_hash column to votes table (links to blockchain)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS vote_hash TEXT;
CREATE INDEX IF NOT EXISTS votes_vote_hash_idx ON votes(vote_hash);

-- Create invalid_votes table (for rollback tracking)
CREATE TABLE IF NOT EXISTS invalid_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing parties with UUIDs
UPDATE parties SET uuid = uuid_generate_v4() WHERE uuid IS NULL;
