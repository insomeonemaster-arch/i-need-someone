-- CreateTable
CREATE TABLE "public"."verification_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT,
    "issuing_authority" TEXT,
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "verification_status" TEXT NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."background_checks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "check_provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "report_url" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_documents_user_id_idx" ON "public"."verification_documents"("user_id");

-- CreateIndex
CREATE INDEX "background_checks_user_id_idx" ON "public"."background_checks"("user_id");

-- AddForeignKey
ALTER TABLE "public"."verification_documents" ADD CONSTRAINT "verification_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."background_checks" ADD CONSTRAINT "background_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
