-- AlterTable
ALTER TABLE "public"."app_users" ADD COLUMN     "display_settings" JSONB,
ADD COLUMN     "privacy_settings" JSONB;
