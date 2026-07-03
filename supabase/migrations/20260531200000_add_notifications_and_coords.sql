SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Add latitude/longitude to attendance
ALTER TABLE IF EXISTS "public"."attendance"
  ADD COLUMN IF NOT EXISTS "latitud" numeric,
  ADD COLUMN IF NOT EXISTS "longitud" numeric;

-- Create notifications table
CREATE TABLE IF NOT EXISTS "public"."notifications" (
  "id" uuid DEFAULT "gen_random_uuid"() NOT NULL,
  "employee_id" uuid,
  "titulo" text,
  "mensaje" text,
  "leida" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE IF EXISTS "public"."notifications" OWNER TO "postgres";

ALTER TABLE ONLY "public"."notifications"
  ADD CONSTRAINT IF NOT EXISTS "notifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notifications"
  ADD CONSTRAINT IF NOT EXISTS "notifications_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON "public"."attendance" (employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee ON "public"."shifts" (employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_employee ON "public"."requests" (employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_employee ON "public"."notifications" (employee_id);

-- Grants (match existing pattern)
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";
