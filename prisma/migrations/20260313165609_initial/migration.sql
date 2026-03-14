-- CreateEnum
CREATE TYPE "public"."UserMode" AS ENUM ('client', 'provider');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "public"."ServiceRequestStatus" AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('open', 'filled', 'closed', 'on_hold');

-- CreateEnum
CREATE TYPE "public"."EmploymentType" AS ENUM ('full_time', 'part_time', 'contract', 'temporary');

-- CreateEnum
CREATE TYPE "public"."WorkLocation" AS ENUM ('on_site', 'remote', 'hybrid');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('open', 'in_progress', 'under_review', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ProposalStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('message', 'booking', 'payment', 'review', 'system', 'announcement');

-- CreateEnum
CREATE TYPE "public"."DisputeStatus" AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('pending', 'processing', 'held', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."FlagStatus" AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "public"."OAuthProvider" AS ENUM ('google', 'facebook', 'apple');

-- CreateTable
CREATE TABLE "public"."app_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "date_of_birth" DATE,
    "current_mode" "public"."UserMode" NOT NULL DEFAULT 'client',
    "preferred_mode" "public"."UserMode" NOT NULL DEFAULT 'client',
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT DEFAULT 'USA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_provider" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "email_verify_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expiry" TIMESTAMP(3),
    "phone_otp" TEXT,
    "phone_otp_expiry" TIMESTAMP(3),

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."oauth_providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "public"."OAuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT,
    "business_type" TEXT,
    "tax_id" TEXT,
    "title" TEXT,
    "tagline" TEXT,
    "hourly_rate" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "availability_schedule" JSONB,
    "service_radius" INTEGER,
    "service_areas" JSONB,
    "accepts_remote_work" BOOLEAN NOT NULL DEFAULT false,
    "remote_only" BOOLEAN NOT NULL DEFAULT false,
    "time_zones" JSONB,
    "verification_status" "public"."VerificationStatus" NOT NULL DEFAULT 'pending',
    "verification_level" TEXT,
    "verified_at" TIMESTAMP(3),
    "total_jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "response_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "response_time_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_skills" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "years_of_experience" INTEGER,
    "proficiency_level" TEXT,
    "is_certified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_certifications" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuing_organization" TEXT,
    "credential_id" TEXT,
    "issue_date" DATE,
    "expiry_date" DATE,
    "document_url" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."provider_portfolio" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "project_url" TEXT,
    "thumbnail_url" TEXT,
    "images" JSONB,
    "skills_used" JSONB,
    "completed_at" DATE,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "icon_name" TEXT,
    "parent_category_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category_id" TEXT,
    "description" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_requests" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "preferred_date" DATE,
    "preferred_time_start" TIME,
    "preferred_time_end" TIME,
    "flexible_scheduling" BOOLEAN NOT NULL DEFAULT true,
    "budget_min" DECIMAL(10,2),
    "budget_max" DECIMAL(10,2),
    "budget_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."ServiceRequestStatus" NOT NULL DEFAULT 'open',
    "assigned_provider_id" TEXT,
    "images" JSONB,
    "attachments" JSONB,
    "created_via" TEXT DEFAULT 'manual',
    "ins_conversation_id" TEXT,
    "ins_collected_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_quotes" (
    "id" TEXT NOT NULL,
    "service_request_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "pricing_type" TEXT,
    "estimated_hours" DECIMAL(5,2),
    "message" TEXT NOT NULL,
    "availability_date" DATE,
    "completion_estimate" TEXT,
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_postings" (
    "id" TEXT NOT NULL,
    "employer_id" TEXT NOT NULL,
    "company_name" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "employment_type" "public"."EmploymentType" NOT NULL,
    "work_location" "public"."WorkLocation" NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "country" TEXT DEFAULT 'USA',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "salary_min" DECIMAL(12,2),
    "salary_max" DECIMAL(12,2),
    "salary_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "benefits" JSONB,
    "required_skills" JSONB,
    "preferred_skills" JSONB,
    "min_experience_years" INTEGER,
    "education_level" TEXT,
    "application_deadline" DATE,
    "positions_available" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'open',
    "expires_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_via" TEXT DEFAULT 'manual',
    "ins_conversation_id" TEXT,
    "ins_collected_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_applications" (
    "id" TEXT NOT NULL,
    "job_posting_id" TEXT NOT NULL,
    "applicant_id" TEXT NOT NULL,
    "cover_letter" TEXT,
    "resume_url" TEXT,
    "portfolio_url" TEXT,
    "expected_salary" DECIMAL(12,2),
    "available_from" DATE,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'pending',
    "employer_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "project_scope" TEXT,
    "estimated_duration" TEXT,
    "budget_min" DECIMAL(12,2),
    "budget_max" DECIMAL(12,2),
    "budget_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "required_skills" JSONB,
    "deliverables" JSONB,
    "start_date" DATE,
    "deadline" DATE,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'open',
    "assigned_provider_id" TEXT,
    "attachments" JSONB,
    "reference_files" JSONB,
    "created_via" TEXT DEFAULT 'manual',
    "ins_conversation_id" TEXT,
    "ins_collected_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_proposals" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "coverLetter" TEXT NOT NULL,
    "proposed_price" DECIMAL(12,2) NOT NULL,
    "pricing_type" TEXT,
    "estimated_hours" DECIMAL(6,2),
    "estimated_duration" TEXT,
    "milestones" JSONB,
    "portfolio_items" JSONB,
    "status" "public"."ProposalStatus" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "due_date" DATE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversations" (
    "id" TEXT NOT NULL,
    "participant_1_id" TEXT NOT NULL,
    "participant_2_id" TEXT NOT NULL,
    "context_type" TEXT,
    "context_id" TEXT,
    "last_message_at" TIMESTAMP(3),
    "last_message_preview" TEXT,
    "is_archived_by_p1" BOOLEAN NOT NULL DEFAULT false,
    "is_archived_by_p2" BOOLEAN NOT NULL DEFAULT false,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_deleted_by_sender" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted_by_recipient" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "reviewee_id" TEXT NOT NULL,
    "context_type" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "communication_rating" INTEGER,
    "quality_rating" INTEGER,
    "professionalism_rating" INTEGER,
    "timeliness_rating" INTEGER,
    "response_text" TEXT,
    "response_at" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "flag_reason" TEXT,
    "admin_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "admin_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "action_type" TEXT,
    "action_url" TEXT,
    "context_type" TEXT,
    "context_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_push_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_email_sent" BOOLEAN NOT NULL DEFAULT false,
    "is_sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ins_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_type" TEXT,
    "category" TEXT,
    "mode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "collected_data" JSONB,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_entity_type" TEXT,
    "created_entity_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "last_interaction_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ins_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ins_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "input_method" TEXT,
    "ai_model" TEXT,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ins_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "image_url" TEXT,
    "target_audience" TEXT NOT NULL DEFAULT 'all',
    "target_user_ids" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "publish_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expire_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email_messages" BOOLEAN NOT NULL DEFAULT true,
    "email_bookings" BOOLEAN NOT NULL DEFAULT true,
    "email_payments" BOOLEAN NOT NULL DEFAULT true,
    "email_reviews" BOOLEAN NOT NULL DEFAULT true,
    "email_system" BOOLEAN NOT NULL DEFAULT true,
    "email_marketing" BOOLEAN NOT NULL DEFAULT false,
    "push_messages" BOOLEAN NOT NULL DEFAULT true,
    "push_bookings" BOOLEAN NOT NULL DEFAULT true,
    "push_payments" BOOLEAN NOT NULL DEFAULT true,
    "push_reviews" BOOLEAN NOT NULL DEFAULT true,
    "push_system" BOOLEAN NOT NULL DEFAULT true,
    "sms_messages" BOOLEAN NOT NULL DEFAULT false,
    "sms_bookings" BOOLEAN NOT NULL DEFAULT true,
    "sms_payments" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "zip_codes" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "payer_id" TEXT NOT NULL,
    "payee_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "payment_method" TEXT,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'pending',
    "stripe_payment_intent_id" TEXT,
    "stripe_transfer_id" TEXT,
    "held_until" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payouts" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PayoutStatus" NOT NULL DEFAULT 'pending',
    "method" TEXT,
    "stripe_payout_id" TEXT,
    "initiated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flags" (
    "id" TEXT NOT NULL,
    "flag_id" TEXT NOT NULL,
    "flagger_id" TEXT NOT NULL,
    "flagged_entity_type" TEXT NOT NULL,
    "flagged_entity_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."FlagStatus" NOT NULL DEFAULT 'pending',
    "admin_id" TEXT,
    "admin_notes" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disputes" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "complainant_id" TEXT NOT NULL,
    "respondent_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."DisputeStatus" NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigned_admin_id" TEXT,
    "resolution_notes" TEXT,
    "resolution_action" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "public"."app_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_phone_key" ON "public"."app_users"("phone");

-- CreateIndex
CREATE INDEX "app_users_email_idx" ON "public"."app_users"("email");

-- CreateIndex
CREATE INDEX "app_users_phone_idx" ON "public"."app_users"("phone");

-- CreateIndex
CREATE INDEX "app_users_latitude_longitude_idx" ON "public"."app_users"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "public"."user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "public"."user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_idx" ON "public"."user_sessions"("refresh_token");

-- CreateIndex
CREATE INDEX "oauth_providers_user_id_idx" ON "public"."oauth_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_providers_provider_provider_user_id_key" ON "public"."oauth_providers"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "public"."provider_profiles"("user_id");

-- CreateIndex
CREATE INDEX "provider_profiles_user_id_idx" ON "public"."provider_profiles"("user_id");

-- CreateIndex
CREATE INDEX "provider_profiles_verification_status_idx" ON "public"."provider_profiles"("verification_status");

-- CreateIndex
CREATE UNIQUE INDEX "provider_skills_provider_id_skill_id_key" ON "public"."provider_skills"("provider_id", "skill_id");

-- CreateIndex
CREATE INDEX "provider_certifications_provider_id_idx" ON "public"."provider_certifications"("provider_id");

-- CreateIndex
CREATE INDEX "provider_portfolio_provider_id_idx" ON "public"."provider_portfolio"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE INDEX "categories_module_idx" ON "public"."categories"("module");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "public"."skills"("slug");

-- CreateIndex
CREATE INDEX "skills_category_id_idx" ON "public"."skills"("category_id");

-- CreateIndex
CREATE INDEX "service_requests_client_id_idx" ON "public"."service_requests"("client_id");

-- CreateIndex
CREATE INDEX "service_requests_assigned_provider_id_idx" ON "public"."service_requests"("assigned_provider_id");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "public"."service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_latitude_longitude_idx" ON "public"."service_requests"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "service_requests_category_id_idx" ON "public"."service_requests"("category_id");

-- CreateIndex
CREATE INDEX "service_quotes_service_request_id_idx" ON "public"."service_quotes"("service_request_id");

-- CreateIndex
CREATE INDEX "service_quotes_provider_id_idx" ON "public"."service_quotes"("provider_id");

-- CreateIndex
CREATE INDEX "service_quotes_status_idx" ON "public"."service_quotes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_quotes_service_request_id_provider_id_key" ON "public"."service_quotes"("service_request_id", "provider_id");

-- CreateIndex
CREATE INDEX "job_postings_employer_id_idx" ON "public"."job_postings"("employer_id");

-- CreateIndex
CREATE INDEX "job_postings_status_idx" ON "public"."job_postings"("status");

-- CreateIndex
CREATE INDEX "job_postings_category_id_idx" ON "public"."job_postings"("category_id");

-- CreateIndex
CREATE INDEX "job_postings_latitude_longitude_idx" ON "public"."job_postings"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "job_postings_employment_type_idx" ON "public"."job_postings"("employment_type");

-- CreateIndex
CREATE INDEX "job_applications_job_posting_id_idx" ON "public"."job_applications"("job_posting_id");

-- CreateIndex
CREATE INDEX "job_applications_applicant_id_idx" ON "public"."job_applications"("applicant_id");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "public"."job_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_job_posting_id_applicant_id_key" ON "public"."job_applications"("job_posting_id", "applicant_id");

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "public"."projects"("client_id");

-- CreateIndex
CREATE INDEX "projects_assigned_provider_id_idx" ON "public"."projects"("assigned_provider_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "public"."projects"("status");

-- CreateIndex
CREATE INDEX "projects_category_id_idx" ON "public"."projects"("category_id");

-- CreateIndex
CREATE INDEX "project_proposals_project_id_idx" ON "public"."project_proposals"("project_id");

-- CreateIndex
CREATE INDEX "project_proposals_provider_id_idx" ON "public"."project_proposals"("provider_id");

-- CreateIndex
CREATE INDEX "project_proposals_status_idx" ON "public"."project_proposals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "project_proposals_project_id_provider_id_key" ON "public"."project_proposals"("project_id", "provider_id");

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "public"."milestones"("project_id");

-- CreateIndex
CREATE INDEX "conversations_participant_1_id_idx" ON "public"."conversations"("participant_1_id");

-- CreateIndex
CREATE INDEX "conversations_participant_2_id_idx" ON "public"."conversations"("participant_2_id");

-- CreateIndex
CREATE INDEX "conversations_context_type_context_id_idx" ON "public"."conversations"("context_type", "context_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "public"."messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "public"."messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "public"."messages"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_reviewer_id_idx" ON "public"."reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "reviews_reviewee_id_idx" ON "public"."reviews"("reviewee_id");

-- CreateIndex
CREATE INDEX "reviews_context_type_context_id_idx" ON "public"."reviews"("context_type", "context_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reviewer_id_context_type_context_id_key" ON "public"."reviews"("reviewer_id", "context_type", "context_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "public"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "public"."notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "public"."notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ins_conversations_user_id_idx" ON "public"."ins_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ins_conversations_status_idx" ON "public"."ins_conversations"("status");

-- CreateIndex
CREATE INDEX "ins_messages_conversation_id_idx" ON "public"."ins_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "announcements_is_active_idx" ON "public"."announcements"("is_active");

-- CreateIndex
CREATE INDEX "announcements_publish_at_idx" ON "public"."announcements"("publish_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_user_id_key" ON "public"."notification_settings"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_logs_user_id_idx" ON "public"."user_activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_logs_action_idx" ON "public"."user_activity_logs"("action");

-- CreateIndex
CREATE INDEX "user_activity_logs_created_at_idx" ON "public"."user_activity_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "faqs_is_active_idx" ON "public"."faqs"("is_active");

-- CreateIndex
CREATE INDEX "service_zones_city_idx" ON "public"."service_zones"("city");

-- CreateIndex
CREATE INDEX "service_zones_status_idx" ON "public"."service_zones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_id_key" ON "public"."payments"("payment_id");

-- CreateIndex
CREATE INDEX "payments_payer_id_idx" ON "public"."payments"("payer_id");

-- CreateIndex
CREATE INDEX "payments_payee_id_idx" ON "public"."payments"("payee_id");

-- CreateIndex
CREATE INDEX "payments_entity_type_entity_id_idx" ON "public"."payments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "public"."payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_payout_id_key" ON "public"."payouts"("payout_id");

-- CreateIndex
CREATE INDEX "payouts_provider_id_idx" ON "public"."payouts"("provider_id");

-- CreateIndex
CREATE INDEX "payouts_status_idx" ON "public"."payouts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "flags_flag_id_key" ON "public"."flags"("flag_id");

-- CreateIndex
CREATE INDEX "flags_flagger_id_idx" ON "public"."flags"("flagger_id");

-- CreateIndex
CREATE INDEX "flags_flagged_entity_type_flagged_entity_id_idx" ON "public"."flags"("flagged_entity_type", "flagged_entity_id");

-- CreateIndex
CREATE INDEX "flags_status_idx" ON "public"."flags"("status");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_dispute_id_key" ON "public"."disputes"("dispute_id");

-- CreateIndex
CREATE INDEX "disputes_complainant_id_idx" ON "public"."disputes"("complainant_id");

-- CreateIndex
CREATE INDEX "disputes_respondent_id_idx" ON "public"."disputes"("respondent_id");

-- CreateIndex
CREATE INDEX "disputes_entity_type_entity_id_idx" ON "public"."disputes"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "public"."disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_assigned_admin_id_idx" ON "public"."disputes"("assigned_admin_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "public"."admin_roles"("name");

-- CreateIndex
CREATE INDEX "admin_roles_name_idx" ON "public"."admin_roles"("name");

-- CreateIndex
CREATE INDEX "admin_user_roles_user_id_idx" ON "public"."admin_user_roles"("user_id");

-- CreateIndex
CREATE INDEX "admin_user_roles_role_id_idx" ON "public"."admin_user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_roles_user_id_role_id_key" ON "public"."admin_user_roles"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "public"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "public"."system_settings"("key");

-- AddForeignKey
ALTER TABLE "public"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."oauth_providers" ADD CONSTRAINT "oauth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_skills" ADD CONSTRAINT "provider_skills_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_skills" ADD CONSTRAINT "provider_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_certifications" ADD CONSTRAINT "provider_certifications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_portfolio" ADD CONSTRAINT "provider_portfolio_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_requests" ADD CONSTRAINT "service_requests_assigned_provider_id_fkey" FOREIGN KEY ("assigned_provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_quotes" ADD CONSTRAINT "service_quotes_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "public"."service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_quotes" ADD CONSTRAINT "service_quotes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_postings" ADD CONSTRAINT "job_postings_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_postings" ADD CONSTRAINT "job_postings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_applications" ADD CONSTRAINT "job_applications_job_posting_id_fkey" FOREIGN KEY ("job_posting_id") REFERENCES "public"."job_postings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_applications" ADD CONSTRAINT "job_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_assigned_provider_id_fkey" FOREIGN KEY ("assigned_provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_proposals" ADD CONSTRAINT "project_proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_proposals" ADD CONSTRAINT "project_proposals_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant_1_id_fkey" FOREIGN KEY ("participant_1_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversations" ADD CONSTRAINT "conversations_participant_2_id_fkey" FOREIGN KEY ("participant_2_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "review_service_request_fk" FOREIGN KEY ("context_id") REFERENCES "public"."service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "review_job_fk" FOREIGN KEY ("context_id") REFERENCES "public"."job_postings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "review_project_fk" FOREIGN KEY ("context_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ins_conversations" ADD CONSTRAINT "ins_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ins_messages" ADD CONSTRAINT "ins_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ins_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_payee_id_fkey" FOREIGN KEY ("payee_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payouts" ADD CONSTRAINT "payouts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flags" ADD CONSTRAINT "flags_flagger_id_fkey" FOREIGN KEY ("flagger_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flags" ADD CONSTRAINT "flags_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_complainant_id_fkey" FOREIGN KEY ("complainant_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disputes" ADD CONSTRAINT "disputes_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_user_roles" ADD CONSTRAINT "admin_user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_user_roles" ADD CONSTRAINT "admin_user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_user_roles" ADD CONSTRAINT "admin_user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
