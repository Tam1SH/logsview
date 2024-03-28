CREATE TABLE IF NOT EXISTS logs (
    timestamp TIMESTAMPTZ PRIMARY KEY,
    level LogLevel NOT NULL,
    request_id UUID NOT NULL,
    title TEXT NOT NULL,
    service_name TEXT,
    controller_name TEXT,
    message JSONB,
    additional_data JSONB
);