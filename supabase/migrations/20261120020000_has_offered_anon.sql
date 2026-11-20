-- Fix for 20261120000000_runde5_fixes.sql: the trades policy calls has_offered(), but only
-- signed-in users were allowed to execute it. Reading trades without login then failed with
-- «permission denied for function has_offered» instead of just returning the open trades.
-- For anonymous callers auth.uid() is null, so has_offered() simply returns false.
grant execute on function has_offered(uuid) to anon;
