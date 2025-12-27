-- Migration: Add Gamma and DocsAutomator to platform enum
-- Date: 2025-12-27
-- Description: Adds 'gamma' and 'docsautomator' to the platform enum for API integration tracking

-- Add new values to the platform enum
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'gamma';
ALTER TYPE platform ADD VALUE IF NOT EXISTS 'docsautomator';

-- Note: Enum values cannot be removed once added in PostgreSQL
-- This migration is forward-only (no rollback)
