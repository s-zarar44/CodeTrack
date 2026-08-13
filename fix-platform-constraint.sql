DROP INDEX public."PlatformAccount_platform_username_key";

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'PlatformAccount';