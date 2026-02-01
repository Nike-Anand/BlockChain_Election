-- Production Security Schema Updates

-- 1. Add audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp);

-- 2. Add electoral_roll table (migrate from CSV)
CREATE TABLE IF NOT EXISTS electoral_roll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    epic_number TEXT UNIQUE NOT NULL,
    voter_name TEXT NOT NULL,
    father_name TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS electoral_roll_epic_idx ON electoral_roll(epic_number);

-- 3. Add rate_limit_tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier TEXT NOT NULL,  -- IP address or user ID
    endpoint TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rate_limit_identifier_idx ON rate_limit_tracking(identifier, endpoint);

-- 4. Add session_tokens table (for JWT token blacklisting)
CREATE TABLE IF NOT EXISTS session_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    token_jti TEXT UNIQUE NOT NULL,  -- JWT ID
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_tokens_jti_idx ON session_tokens(token_jti);
CREATE INDEX IF NOT EXISTS session_tokens_user_id_idx ON session_tokens(user_id);

-- 5. Update users table for password hashing
-- Note: Existing passwords will need to be re-hashed
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked BOOLEAN DEFAULT FALSE;

-- 6. Add biometric_tokens table (instead of storing raw photos)
CREATE TABLE IF NOT EXISTS biometric_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT UNIQUE NOT NULL,
    photo_hash TEXT NOT NULL,  -- SHA-256 hash of photo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS biometric_tokens_user_id_idx ON biometric_tokens(user_id);

-- Comments
COMMENT ON TABLE audit_logs IS 'Audit trail for all system actions';
COMMENT ON TABLE electoral_roll IS 'Electoral roll migrated from CSV for better consistency';
COMMENT ON TABLE rate_limit_tracking IS 'Track rate limit attempts per endpoint';
COMMENT ON TABLE session_tokens IS 'JWT token management and blacklisting';
COMMENT ON TABLE biometric_tokens IS 'Tokenized biometric data (hashes only, no raw photos)';
