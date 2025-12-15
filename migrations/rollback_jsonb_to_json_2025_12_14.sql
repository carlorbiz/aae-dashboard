-- Rollback: rollback_jsonb_to_json_2025_12_14.sql
-- Purpose: Revert jsonb columns back to json and drop created indexes.
-- Run only if you need to revert and after thorough verification.

-- WARNING: This will change column types and drop indexes. Backup first.
-- Recommended backup (shell):
-- pg_dump -U "$PGUSER" -h "$PGHOST" -Fc -f backup_before_rollback_$(date +%F).dump "$PGDATABASE"

BEGIN;

-- Convert jsonb back to json
ALTER TABLE entities ALTER COLUMN properties TYPE json USING properties::json;
ALTER TABLE relationships ALTER COLUMN properties TYPE json USING properties::json;
ALTER TABLE platform_integrations ALTER COLUMN metadata TYPE json USING metadata::json;
ALTER TABLE workflows ALTER COLUMN metadata TYPE json USING metadata::json;
ALTER TABLE knowledge_items ALTER COLUMN metadata TYPE json USING metadata::json;
ALTER TABLE notifications ALTER COLUMN metadata TYPE json USING metadata::json;
ALTER TABLE semantic_history ALTER COLUMN metadata TYPE json USING metadata::json;

COMMIT;

-- Drop indexes created for jsonb (run outside transaction if CONCURRENTLY was used)
DROP INDEX IF EXISTS idx_entities_properties_gin;
DROP INDEX IF EXISTS idx_relationships_properties_gin;
DROP INDEX IF EXISTS idx_platform_integrations_metadata_gin;
DROP INDEX IF EXISTS idx_workflows_metadata_gin;
DROP INDEX IF EXISTS idx_knowledge_items_metadata_gin;
DROP INDEX IF EXISTS idx_notifications_metadata_gin;
DROP INDEX IF EXISTS idx_semantic_history_metadata_gin;
DROP INDEX IF EXISTS idx_entities_confidence;
