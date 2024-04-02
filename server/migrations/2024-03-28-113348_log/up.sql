-- Your SQL goes here
CREATE TYPE loglevel AS ENUM ('debug', 'info', 'warning', 'error', 'critical');

CREATE TABLE IF NOT EXISTS logs (
    time TIMESTAMPTZ PRIMARY KEY,
    level loglevel NOT NULL,
    request_id UUID NOT NULL,
    title TEXT NOT NULL,
    service_name TEXT,
    controller_name TEXT,
    message JSONB,
    additional_data JSONB
);

SELECT create_hypertable('logs', by_range('time'));


CREATE OR REPLACE FUNCTION logs_trigger() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('logs', row_to_json(NEW)::text);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER logs_trigger AFTER INSERT ON logs
FOR EACH ROW EXECUTE PROCEDURE logs_trigger();


-- CREATE OR REPLACE PROCEDURE generate_logs()
-- LANGUAGE plpgsql
-- AS $$
-- DECLARE
--     log_levels TEXT[] := ARRAY['debug', 'info', 'warning', 'error', 'critical'];
--     services TEXT[] := ARRAY['Service1', 'Service2', 'Service3'];
--     controllers TEXT[] := ARRAY['Controller1', 'Controller2', 'Controller3'];
--     i INTEGER;
-- BEGIN
--     FOR i IN 1..1000 LOOP
--         INSERT INTO logs (
--             time,
--             level,
--             request_id,
--             title,
--             service_name,
--             controller_name,
--             message,
--             additional_data
--         ) VALUES (
--             clock_timestamp(),
--             log_levels[ceil(random() * array_length(log_levels, 1))::INTEGER]::loglevel,
--             gen_random_uuid(),
--             'Log' || i,
--             services[ceil(random() * array_length(services, 1))::INTEGER],
--             controllers[ceil(random() * array_length(controllers, 1))::INTEGER],
--             '{}'::JSONB,
--             '{}'::JSONB
--         );
--     END LOOP;
-- END;
-- $$;

