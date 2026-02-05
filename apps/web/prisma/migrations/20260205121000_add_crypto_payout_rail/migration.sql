-- Add CRYPTO to PayoutRail enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PayoutRail' AND e.enumlabel = 'CRYPTO'
  ) THEN
    ALTER TYPE "PayoutRail" ADD VALUE 'CRYPTO';
  END IF;
END $$;
