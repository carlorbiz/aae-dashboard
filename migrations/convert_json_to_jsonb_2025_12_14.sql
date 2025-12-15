-- Migration: convert_json_to_jsonb_2025_12_14.sql
-- Purpose: Safely convert JSON columns to JSONB and add GIN indexes.
-- RUN PRECHECKS: ensure you have a recent backup and test on staging first.

-- Recommended backup (run from shell, not in psql):
-- pg_dump -U "$PGUSER" -h "$PGHOST" -Fc -f backup_aae_dashboard_$(date +%F).dump "$PGDATABASE"

-- NOTE: ALTER TYPE will rewrite the table; run during a maintenance window or on a follower.

BEGIN;

-- Convert columns to jsonb (uses explicit cast)
ALTER TABLE entities ALTER COLUMN properties TYPE jsonb USING properties::jsonb;
ALTER TABLE relationships ALTER COLUMN properties TYPE jsonb USING properties::jsonb;
ALTER TABLE platform_integrations ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;
ALTER TABLE workflows ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;
ALTER TABLE knowledge_items ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;
ALTER TABLE notifications ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;
ALTER TABLE semantic_history ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;

COMMIT;

-- Create GIN indexes concurrently for fast jsonb containment queries
-- Must be run outside transactions when using CONCURRENTLY; run after the above transaction completes.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_properties_gin ON entities USING gin (properties);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_relationships_properties_gin ON relationships USING gin (properties);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platform_integrations_metadata_gin ON platform_integrations USING gin (metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workflows_metadata_gin ON workflows USING gin (metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_items_metadata_gin ON knowledge_items USING gin (metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_metadata_gin ON notifications USING gin (metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_semantic_history_metadata_gin ON semantic_history USING gin (metadata);

-- Optional: index a common scalar property (confidence) if present and queried often.
-- This casts the JSONB text value to numeric; if values are non-numeric, index creation may fail.
-- Use this only after ensuring the key is consistently numeric or null.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_confidence ON entities (((properties->>'confidence')::numeric));

-- Deployment notes:
-- 1) Take a backup.
-- 2) Run the ALTER TABLE conversion during a maintenance window or on a replica.
-- 3) Run the CONCURRENTLY index creation commands (they must be executed outside a transaction).
-- 4) Verify application behavior (especially any code that expects text-encoded JSON values).
