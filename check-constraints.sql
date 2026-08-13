SELECT
    conname,
    contype
FROM pg_constraint
WHERE conrelid = 'public."PlatformAccount"'::regclass;

SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'PlatformAccount';