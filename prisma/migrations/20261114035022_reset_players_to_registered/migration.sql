-- Existing players were created before the registered workflow.
-- Reset them so encoders can explicitly mark players as licensed.
UPDATE "players" SET "status" = 'registered' WHERE "status" = 'licensed';
