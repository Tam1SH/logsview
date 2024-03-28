-- Your SQL goes here
CREATE TYPE LogLevel AS ENUM ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL');

CREATE TABLE IF NOT EXISTS logs (
    time TIMESTAMPTZ PRIMARY KEY,
    level LogLevel NOT NULL,
    request_id UUID NOT NULL,
    title TEXT NOT NULL,
    service_name TEXT,
    controller_name TEXT,
    message JSONB,
    additional_data JSONB
);

SELECT create_hypertable('logs', by_range('time'));