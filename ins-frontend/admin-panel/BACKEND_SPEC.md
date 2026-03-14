# I Need Someone - Backend API Specification

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack Recommendations](#technology-stack-recommendations)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [API Endpoints](#api-endpoints)
6. [Real-time Features](#real-time-features)
7. [File Storage](#file-storage)
8. [Audit Logging](#audit-logging)
9. [Payment Processing](#payment-processing)
10. [Search & Filtering](#search--filtering)
11. [INS AI Integration](#ins-ai-integration)
12. [Security Considerations](#security-considerations)

---

## System Overview

**I Need Someone** is a multi-mode service marketplace platform supporting:
- **Local Requests**: Quick, location-based service requests (e.g., "I need someone to help me move")
- **Employment Jobs**: Long-term employment opportunities
- **Upwork-style Projects**: Milestone-based projects with proposals and structured payments

The admin panel provides comprehensive operations management across all three modes.

### Core Features
- Multi-tenant user management (Customers, Providers, Admins)
- Three distinct product workflows
- Real-time chat and notifications
- Payment processing with escrow and milestones
- Dispute resolution system
- Rating and flagging system
- AI assistant (INS) integration
- Comprehensive audit logging

---

## Technology Stack Recommendations

### Backend Framework
- **Node.js** with Express/Fastify or **Python** with FastAPI/Django
- **Alternative**: Ruby on Rails, Go with Gin

### Database
- **PostgreSQL** (primary) - Relational data, transactions
- **Redis** - Caching, session management, real-time pub/sub
- **Elasticsearch** (optional) - Advanced search capabilities

### Real-time
- **WebSockets** (Socket.io or native WS)
- **Alternative**: Server-Sent Events (SSE)

### File Storage
- **AWS S3** or **Cloudflare R2** or **Google Cloud Storage**

### Payment Processing
- **Stripe Connect** or **PayPal** for payments and payouts

### AI Integration
- **OpenAI API** or **Anthropic Claude** for INS assistant

### Job Queue
- **Bull/BullMQ** (Node.js) or **Celery** (Python) or **Sidekiq** (Ruby)

---

## Database Schema

### Core Tables

#### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  roles TEXT[] NOT NULL DEFAULT '{customer}', -- ['customer', 'provider', 'admin']
  status VARCHAR(50) DEFAULT 'pending_approval', -- pending_approval, active, suspended, disabled
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone VARCHAR(50) DEFAULT 'UTC',
  stripe_customer_id VARCHAR(100),
  stripe_account_id VARCHAR(100), -- For providers (Stripe Connect)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_location ON users(latitude, longitude);
```

#### 2. local_requests (Mode 1)
```sql
CREATE TABLE local_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(50) UNIQUE NOT NULL, -- REQ-001, REQ-002, etc.
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, matched, in_progress, completed, cancelled, disputed
  urgency VARCHAR(50), -- urgent, today, this_week, flexible
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  location_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  state VARCHAR(100),
  scheduled_date DATE,
  scheduled_time TIME,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_local_requests_customer ON local_requests(customer_id);
CREATE INDEX idx_local_requests_provider ON local_requests(provider_id);
CREATE INDEX idx_local_requests_status ON local_requests(status);
CREATE INDEX idx_local_requests_category ON local_requests(category_id);
CREATE INDEX idx_local_requests_location ON local_requests(latitude, longitude);
```

#### 3. employment_jobs (Mode 2)
```sql
CREATE TABLE employment_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id VARCHAR(50) UNIQUE NOT NULL, -- JOB-001, JOB-002, etc.
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  employment_type VARCHAR(50), -- full_time, part_time, contract, temporary
  status VARCHAR(50) DEFAULT 'open', -- open, in_review, hired, closed, cancelled
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_period VARCHAR(50), -- hourly, monthly, yearly
  location_type VARCHAR(50), -- onsite, remote, hybrid
  location_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  requirements TEXT,
  benefits TEXT,
  start_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_employment_jobs_employer ON employment_jobs(employer_id);
CREATE INDEX idx_employment_jobs_employee ON employment_jobs(employee_id);
CREATE INDEX idx_employment_jobs_status ON employment_jobs(status);
CREATE INDEX idx_employment_jobs_category ON employment_jobs(category_id);
```

#### 4. employment_applications
```sql
CREATE TABLE employment_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id VARCHAR(50) UNIQUE NOT NULL, -- APP-001, APP-002, etc.
  job_id UUID REFERENCES employment_jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, shortlisted, rejected, hired
  cover_letter TEXT,
  resume_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_applications_job ON employment_applications(job_id);
CREATE INDEX idx_applications_applicant ON employment_applications(applicant_id);
CREATE INDEX idx_applications_status ON employment_applications(status);
```

#### 5. projects (Mode 3)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(50) UNIQUE NOT NULL, -- PRJ-001, PRJ-002, etc.
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, proposals_received, in_progress, completed, cancelled, disputed
  budget_type VARCHAR(50), -- fixed, hourly
  budget_amount DECIMAL(10, 2),
  hourly_rate DECIMAL(10, 2),
  project_duration VARCHAR(100), -- e.g., "2-4 weeks"
  skills_required TEXT[], -- Array of skill tags
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_provider ON projects(provider_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category_id);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills_required);
```

#### 6. project_proposals
```sql
CREATE TABLE project_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id VARCHAR(50) UNIQUE NOT NULL, -- PROP-001, PROP-002, etc.
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, accepted, rejected, withdrawn
  cover_letter TEXT NOT NULL,
  proposed_amount DECIMAL(10, 2) NOT NULL,
  proposed_timeline VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposals_project ON project_proposals(project_id);
CREATE INDEX idx_proposals_provider ON project_proposals(provider_id);
CREATE INDEX idx_proposals_status ON project_proposals(status);
```

#### 7. project_milestones
```sql
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id VARCHAR(50) UNIQUE NOT NULL, -- MS-001, MS-002, etc.
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, submitted, approved, paid, disputed
  order_index INTEGER NOT NULL,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_milestones_status ON project_milestones(status);
```

#### 8. categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon VARCHAR(100),
  applicable_modes TEXT[] NOT NULL, -- ['local_request', 'employment', 'project']
  status VARCHAR(50) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_modes ON categories USING GIN(applicable_modes);
```

#### 9. service_zones
```sql
CREATE TABLE service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  country VARCHAR(100) DEFAULT 'USA',
  zip_codes TEXT[], -- Array of zip codes covered
  status VARCHAR(50) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service_zones_city ON service_zones(city);
CREATE INDEX idx_service_zones_status ON service_zones(status);
```

#### 10. payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id VARCHAR(50) UNIQUE NOT NULL, -- PAY-001, PAY-002, etc.
  payer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- local_request, employment_job, project, milestone
  entity_id UUID NOT NULL, -- ID of the related entity
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  payment_method VARCHAR(50), -- card, bank_transfer, wallet
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, held, completed, failed, refunded
  stripe_payment_intent_id VARCHAR(100),
  stripe_transfer_id VARCHAR(100),
  held_until TIMESTAMP,
  completed_at TIMESTAMP,
  refunded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_payer ON payments(payer_id);
CREATE INDEX idx_payments_payee ON payments(payee_id);
CREATE INDEX idx_payments_entity ON payments(entity_type, entity_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### 11. payouts
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id VARCHAR(50) UNIQUE NOT NULL, -- POUT-001, POUT-002, etc.
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  method VARCHAR(50), -- bank_transfer, stripe, paypal
  stripe_payout_id VARCHAR(100),
  initiated_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payouts_provider ON payouts(provider_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

#### 12. ratings
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id VARCHAR(50) UNIQUE NOT NULL, -- RAT-001, RAT-002, etc.
  rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- local_request, employment_job, project
  entity_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  admin_reviewed BOOLEAN DEFAULT FALSE,
  admin_action VARCHAR(50), -- approved, hidden, removed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX idx_ratings_entity ON ratings(entity_type, entity_id);
CREATE INDEX idx_ratings_flagged ON ratings(flagged);
```

#### 13. flags
```sql
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id VARCHAR(50) UNIQUE NOT NULL, -- FLAG-001, FLAG-002, etc.
  flagger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  flagged_entity_type VARCHAR(50) NOT NULL, -- user, local_request, project, employment_job, rating
  flagged_entity_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL, -- spam, inappropriate, fraud, harassment, other
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, resolved, dismissed
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution VARCHAR(50), -- warning_issued, content_removed, user_suspended, no_action
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_flags_flagger ON flags(flagger_id);
CREATE INDEX idx_flags_entity ON flags(flagged_entity_type, flagged_entity_id);
CREATE INDEX idx_flags_status ON flags(status);
```

#### 14. disputes
```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id VARCHAR(50) UNIQUE NOT NULL, -- DIS-001, DIS-002, etc.
  complainant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- local_request, project, employment_job, payment
  entity_id UUID NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open', -- open, under_review, resolved, closed
  priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
  assigned_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  resolution_action VARCHAR(50), -- refund_issued, payment_released, no_action, custom
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_disputes_complainant ON disputes(complainant_id);
CREATE INDEX idx_disputes_respondent ON disputes(respondent_id);
CREATE INDEX idx_disputes_entity ON disputes(entity_type, entity_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_assigned_admin ON disputes(assigned_admin_id);
```

#### 15. messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(50) UNIQUE NOT NULL, -- MSG-001, MSG-002, etc.
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, file, system
  file_url TEXT,
  file_name VARCHAR(255),
  is_system BOOLEAN DEFAULT FALSE,
  read_by UUID[], -- Array of user IDs who have read this message
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
```

#### 16. message_threads
```sql
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id VARCHAR(50) UNIQUE NOT NULL, -- THREAD-001, THREAD-002, etc.
  entity_type VARCHAR(50) NOT NULL, -- local_request, project, employment_job, dispute, support
  entity_id UUID NOT NULL,
  participants UUID[] NOT NULL, -- Array of user IDs
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threads_entity ON message_threads(entity_type, entity_id);
CREATE INDEX idx_threads_participants ON message_threads USING GIN(participants);
```

#### 17. notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- info, success, warning, error
  category VARCHAR(50), -- payment, message, status_update, system
  entity_type VARCHAR(50),
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

#### 18. admin_roles
```sql
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL, -- { "users": ["read", "write"], "payments": ["read"], ... }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admin_roles_name ON admin_roles(name);
```

#### 19. admin_user_roles
```sql
CREATE TABLE admin_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_admin_user_roles_user ON admin_user_roles(user_id);
CREATE INDEX idx_admin_user_roles_role ON admin_user_roles(role_id);
```

#### 20. audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id VARCHAR(50) UNIQUE NOT NULL, -- LOG-001, LOG-002, etc.
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- user.created, payment.processed, dispute.resolved, etc.
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB, -- { "before": {...}, "after": {...} }
  ip_address VARCHAR(50),
  user_agent TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

#### 21. system_settings
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(key);
```

#### 22. ins_conversations
```sql
CREATE TABLE ins_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  context_entity_type VARCHAR(50), -- dispute, message, note, etc.
  context_entity_id UUID,
  messages JSONB NOT NULL, -- Array of { role, content, timestamp }
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ins_conversations_user ON ins_conversations(user_id);
CREATE INDEX idx_ins_conversations_entity ON ins_conversations(context_entity_type, context_entity_id);
```

---

## Authentication & Authorization

### Authentication Flow

#### 1. User Registration
```
POST /api/auth/register
Body: {
  email, password, first_name, last_name, role (customer/provider), phone?, city?, state?
}
Response: {
  user: { id, email, first_name, last_name, roles, status },
  access_token,
  refresh_token
}
```

#### 2. User Login
```
POST /api/auth/login
Body: { email, password }
Response: {
  user: { ... },
  access_token,
  refresh_token
}
```

#### 3. Token Refresh
```
POST /api/auth/refresh
Body: { refresh_token }
Response: { access_token, refresh_token }
```

#### 4. Logout
```
POST /api/auth/logout
Headers: Authorization: Bearer {access_token}
Response: { success: true }
```

#### 5. Password Reset Request
```
POST /api/auth/forgot-password
Body: { email }
Response: { success: true, message: "Reset email sent" }
```

#### 6. Password Reset
```
POST /api/auth/reset-password
Body: { token, new_password }
Response: { success: true }
```

### Authorization Model

**Role-Based Access Control (RBAC)**

Roles:
- `customer` - Can create requests/jobs/projects
- `provider` - Can fulfill requests, apply to jobs, submit proposals
- `admin` - Full access to admin panel
- `super_admin` - System-level access

**Admin Permissions Structure:**
```json
{
  "users": ["read", "write", "delete", "suspend"],
  "requests": ["read", "write", "cancel", "assign"],
  "projects": ["read", "write", "cancel"],
  "employment": ["read", "write", "close"],
  "payments": ["read", "refund", "process"],
  "disputes": ["read", "assign", "resolve"],
  "flags": ["read", "review", "resolve"],
  "ratings": ["read", "hide", "remove"],
  "categories": ["read", "write", "delete"],
  "zones": ["read", "write", "delete"],
  "roles": ["read", "write", "assign"],
  "settings": ["read", "write"],
  "audit_logs": ["read"]
}
```

### JWT Payload Structure
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "roles": ["customer", "provider"],
  "is_admin": false,
  "permissions": [],
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## API Endpoints

### General API Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "error": null
}
```

### Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### Common Query Parameters (All List Endpoints)
- `page` - Page number (default: 1)
- `per_page` - Items per page (default: 20, max: 100)
- `sort_by` - Field to sort by
- `sort_order` - `asc` or `desc`
- `search` - Search query
- `status` - Filter by status
- `date_from` - Filter by start date (ISO 8601)
- `date_to` - Filter by end date (ISO 8601)

---

### A01: Dashboard

#### GET /api/admin/dashboard/stats
Get overall platform statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total_users": 12450,
    "active_requests": 234,
    "active_projects": 89,
    "total_revenue": 542300.00,
    "pending_disputes": 12,
    "pending_approvals": 45,
    "revenue_chart": [
      { "date": "2024-01", "amount": 50000 },
      { "date": "2024-02", "amount": 65000 }
    ],
    "recent_activities": [
      {
        "id": "act-001",
        "type": "user_registered",
        "description": "New user Sarah Johnson registered",
        "timestamp": "2024-02-15T14:30:00Z"
      }
    ]
  }
}
```

#### GET /api/admin/dashboard/alerts
Get critical alerts and notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-001",
      "type": "dispute",
      "severity": "high",
      "message": "3 disputes require immediate attention",
      "count": 3,
      "link": "/disputes?status=open&priority=urgent"
    }
  ]
}
```

---

### A02: Jobs & Requests (Unified View)

#### GET /api/admin/jobs-requests
List all local requests and employment jobs

**Query Parameters:**
- `type` - `local_request` or `employment_job` or `all`
- `category` - Category ID or slug
- `city` - City name
- `urgency` - Urgency level (for local requests)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "item_id": "REQ-001",
      "type": "local_request",
      "title": "Need help moving furniture",
      "customer": {
        "id": "uuid",
        "name": "Sarah Johnson",
        "avatar": "url"
      },
      "provider": {
        "id": "uuid",
        "name": "Mike Davis",
        "avatar": "url"
      },
      "category": "Moving & Delivery",
      "status": "in_progress",
      "amount": 150.00,
      "location": "New York, NY",
      "created_at": "2024-02-15T10:00:00Z",
      "urgency": "today"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/jobs-requests/:id
Get detailed information about a specific request or job

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "request_id": "REQ-001",
    "type": "local_request",
    "title": "Need help moving furniture",
    "description": "...",
    "customer": { ... },
    "provider": { ... },
    "category": { ... },
    "status": "in_progress",
    "timeline": [
      {
        "status": "created",
        "timestamp": "2024-02-15T10:00:00Z",
        "actor": "Sarah Johnson"
      }
    ],
    "payment": {
      "amount": 150.00,
      "status": "held",
      "payment_id": "PAY-001"
    },
    "thread": {
      "id": "thread-001",
      "message_count": 12,
      "last_message": "..."
    }
  }
}
```

#### PATCH /api/admin/jobs-requests/:id
Update request/job (admin action)

**Body:**
```json
{
  "status": "cancelled",
  "admin_notes": "Cancelled due to violation of terms",
  "reason": "terms_violation"
}
```

#### POST /api/admin/jobs-requests/:id/cancel
Cancel a request or job

**Body:**
```json
{
  "reason": "fraud_detected",
  "notes": "Multiple reports of suspicious activity",
  "refund": true
}
```

---

### A03: Projects

#### GET /api/admin/projects
List all projects

**Query Parameters:**
- `status` - open, in_progress, completed, etc.
- `budget_min` - Minimum budget
- `budget_max` - Maximum budget
- `skills` - Comma-separated skills

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "project_id": "PRJ-001",
      "title": "E-commerce Website Development",
      "client": {
        "id": "uuid",
        "name": "ABC Corp",
        "avatar": "url"
      },
      "provider": {
        "id": "uuid",
        "name": "Tech Solutions Inc",
        "avatar": "url"
      },
      "status": "in_progress",
      "budget": 5000.00,
      "budget_type": "fixed",
      "proposals_count": 12,
      "milestones_count": 5,
      "milestones_completed": 2,
      "created_at": "2024-01-20T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/projects/:id
Get detailed project information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "project_id": "PRJ-001",
    "title": "E-commerce Website Development",
    "description": "...",
    "client": { ... },
    "provider": { ... },
    "status": "in_progress",
    "budget_type": "fixed",
    "budget_amount": 5000.00,
    "skills_required": ["React", "Node.js", "PostgreSQL"],
    "deadline": "2024-03-15",
    "proposals": [
      {
        "id": "uuid",
        "proposal_id": "PROP-001",
        "provider": { ... },
        "amount": 4800.00,
        "status": "accepted",
        "created_at": "2024-01-21T10:00:00Z"
      }
    ],
    "milestones": [
      {
        "id": "uuid",
        "milestone_id": "MS-001",
        "title": "Design Mockups",
        "amount": 1000.00,
        "status": "approved",
        "due_date": "2024-02-01",
        "order_index": 1
      }
    ],
    "timeline": [ ... ],
    "thread": { ... }
  }
}
```

#### GET /api/admin/projects/:id/proposals
Get all proposals for a project

#### GET /api/admin/projects/:id/milestones
Get all milestones for a project

#### PATCH /api/admin/projects/:projectId/milestones/:milestoneId
Update milestone status (admin action)

**Body:**
```json
{
  "status": "approved",
  "admin_notes": "Approved after review"
}
```

---

### A04: Employment Jobs

#### GET /api/admin/employment
List all employment jobs

**Query Parameters:**
- `status` - open, hired, closed
- `employment_type` - full_time, part_time, contract
- `location_type` - onsite, remote, hybrid
- `salary_min` - Minimum salary
- `salary_max` - Maximum salary

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "job_id": "JOB-001",
      "title": "Senior Software Engineer",
      "employer": {
        "id": "uuid",
        "name": "Tech Corp",
        "avatar": "url"
      },
      "employee": null,
      "status": "open",
      "employment_type": "full_time",
      "location_type": "remote",
      "salary_min": 80000,
      "salary_max": 120000,
      "salary_period": "yearly",
      "applications_count": 45,
      "created_at": "2024-02-01T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/employment/:id
Get detailed employment job information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "job_id": "JOB-001",
    "title": "Senior Software Engineer",
    "description": "...",
    "employer": { ... },
    "employee": { ... },
    "status": "open",
    "employment_type": "full_time",
    "location_type": "remote",
    "location_address": "123 Main St, New York, NY",
    "salary_min": 80000,
    "salary_max": 120000,
    "salary_period": "yearly",
    "requirements": "5+ years experience...",
    "benefits": "Health insurance, 401k...",
    "start_date": "2024-03-01",
    "applications": [
      {
        "id": "uuid",
        "application_id": "APP-001",
        "applicant": { ... },
        "status": "submitted",
        "cover_letter": "...",
        "resume_url": "...",
        "created_at": "2024-02-02T10:00:00Z"
      }
    ],
    "thread": { ... },
    "created_at": "2024-02-01T10:00:00Z"
  }
}
```

#### GET /api/admin/employment/:id/applications
Get all applications for a job

---

### A05: User List

#### GET /api/admin/users
List all users

**Query Parameters:**
- `role` - customer, provider, admin
- `status` - active, pending_approval, suspended, disabled
- `city` - City name
- `verified` - true/false (email or phone verified)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "USR-001",
      "first_name": "Sarah",
      "last_name": "Johnson",
      "email": "sarah.j@email.com",
      "phone": "(555) 123-4567",
      "roles": ["customer"],
      "status": "active",
      "avatar": "url",
      "city": "New York",
      "state": "NY",
      "email_verified": true,
      "phone_verified": true,
      "rating_avg": 4.8,
      "rating_count": 24,
      "created_at": "2024-01-15T10:00:00Z",
      "last_login_at": "2024-02-15T14:30:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/users/:id
Get detailed user information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "USR-001",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "email": "sarah.j@email.com",
    "phone": "(555) 123-4567",
    "roles": ["customer", "provider"],
    "status": "active",
    "avatar": "url",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "timezone": "America/New_York",
    "email_verified": true,
    "phone_verified": true,
    "stripe_customer_id": "cus_...",
    "stripe_account_id": "acct_...",
    "stats": {
      "total_requests": 15,
      "total_jobs_posted": 3,
      "total_projects": 5,
      "total_spent": 2500.00,
      "total_earned": 5000.00,
      "rating_avg": 4.8,
      "rating_count": 24
    },
    "recent_activity": [
      {
        "type": "request_created",
        "entity_id": "REQ-001",
        "description": "Created request: Need help moving",
        "timestamp": "2024-02-15T10:00:00Z"
      }
    ],
    "ratings": [ ... ],
    "flags": [ ... ],
    "created_at": "2024-01-15T10:00:00Z",
    "last_login_at": "2024-02-15T14:30:00Z"
  }
}
```

#### PATCH /api/admin/users/:id
Update user information (admin)

**Body:**
```json
{
  "status": "suspended",
  "admin_notes": "Suspended for violations",
  "reason": "terms_violation"
}
```

#### POST /api/admin/users/:id/verify
Manually verify user email or phone

**Body:**
```json
{
  "verification_type": "email",
  "admin_notes": "Verified after manual check"
}
```

#### POST /api/admin/users/:id/suspend
Suspend a user

**Body:**
```json
{
  "reason": "multiple_violations",
  "notes": "User has violated terms multiple times",
  "duration_days": 30
}
```

#### POST /api/admin/users/:id/unsuspend
Unsuspend a user

**Body:**
```json
{
  "notes": "User appeal approved"
}
```

---

### A06: Payments & Payouts

#### GET /api/admin/payments
List all payments

**Query Parameters:**
- `status` - pending, completed, failed, refunded
- `entity_type` - local_request, project, milestone
- `amount_min` - Minimum amount
- `amount_max` - Maximum amount

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "payment_id": "PAY-001",
      "payer": {
        "id": "uuid",
        "name": "Sarah Johnson"
      },
      "payee": {
        "id": "uuid",
        "name": "Mike Davis"
      },
      "entity_type": "local_request",
      "entity_id": "uuid",
      "entity_display": "REQ-001: Moving furniture",
      "amount": 150.00,
      "fee": 15.00,
      "net_amount": 135.00,
      "status": "completed",
      "payment_method": "card",
      "created_at": "2024-02-15T10:00:00Z",
      "completed_at": "2024-02-15T10:05:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/payments/:id
Get detailed payment information

#### POST /api/admin/payments/:id/refund
Process a refund

**Body:**
```json
{
  "amount": 150.00,
  "reason": "service_not_delivered",
  "notes": "Customer complaint verified"
}
```

#### GET /api/admin/payouts
List all payouts

**Query Parameters:**
- `status` - pending, processing, completed, failed
- `provider_id` - Provider user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "payout_id": "POUT-001",
      "provider": {
        "id": "uuid",
        "name": "Mike Davis"
      },
      "amount": 1350.00,
      "status": "completed",
      "method": "bank_transfer",
      "initiated_at": "2024-02-15T10:00:00Z",
      "completed_at": "2024-02-17T10:00:00Z",
      "created_at": "2024-02-15T09:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### POST /api/admin/payouts/:id/process
Manually process a payout

**Body:**
```json
{
  "admin_notes": "Processed manually after verification"
}
```

---

### A07: Ratings & Flags

#### GET /api/admin/ratings
List all ratings

**Query Parameters:**
- `flagged` - true/false
- `admin_reviewed` - true/false
- `rating` - 1-5
- `entity_type` - local_request, project, employment_job

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating_id": "RAT-001",
      "rater": {
        "id": "uuid",
        "name": "Sarah Johnson"
      },
      "rated_user": {
        "id": "uuid",
        "name": "Mike Davis"
      },
      "entity_type": "local_request",
      "entity_id": "uuid",
      "entity_display": "REQ-001",
      "rating": 5,
      "review_text": "Excellent service!",
      "flagged": false,
      "admin_reviewed": false,
      "created_at": "2024-02-15T15:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/ratings/:id
Get detailed rating information

#### PATCH /api/admin/ratings/:id
Admin action on rating

**Body:**
```json
{
  "admin_action": "hidden",
  "admin_notes": "Contains inappropriate language"
}
```

#### GET /api/admin/flags
List all flags

**Query Parameters:**
- `status` - pending, under_review, resolved, dismissed
- `flagged_entity_type` - user, local_request, project, rating

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "flag_id": "FLAG-001",
      "flagger": {
        "id": "uuid",
        "name": "John Smith"
      },
      "flagged_entity_type": "rating",
      "flagged_entity_id": "uuid",
      "flagged_entity_display": "Rating by Mike Davis",
      "reason": "inappropriate",
      "description": "Contains offensive language",
      "status": "pending",
      "created_at": "2024-02-15T16:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/flags/:id
Get detailed flag information

#### PATCH /api/admin/flags/:id/resolve
Resolve a flag

**Body:**
```json
{
  "resolution": "content_removed",
  "admin_notes": "Content removed after review"
}
```

---

### A08: Disputes

#### GET /api/admin/disputes
List all disputes

**Query Parameters:**
- `status` - open, under_review, resolved, closed
- `priority` - low, medium, high, urgent
- `assigned_admin_id` - Admin user ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dispute_id": "DIS-001",
      "complainant": {
        "id": "uuid",
        "name": "Sarah Johnson"
      },
      "respondent": {
        "id": "uuid",
        "name": "Mike Davis"
      },
      "entity_type": "local_request",
      "entity_id": "uuid",
      "entity_display": "REQ-001",
      "reason": "service_not_delivered",
      "status": "open",
      "priority": "high",
      "assigned_admin": null,
      "created_at": "2024-02-15T17:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/disputes/:id
Get detailed dispute information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "dispute_id": "DIS-001",
    "complainant": { ... },
    "respondent": { ... },
    "entity_type": "local_request",
    "entity_id": "uuid",
    "entity_details": { ... },
    "reason": "service_not_delivered",
    "description": "Provider did not show up",
    "status": "open",
    "priority": "high",
    "assigned_admin": null,
    "thread": {
      "id": "thread-001",
      "messages": [ ... ]
    },
    "timeline": [
      {
        "action": "created",
        "timestamp": "2024-02-15T17:00:00Z",
        "actor": "Sarah Johnson"
      }
    ],
    "created_at": "2024-02-15T17:00:00Z"
  }
}
```

#### PATCH /api/admin/disputes/:id/assign
Assign dispute to admin

**Body:**
```json
{
  "admin_id": "uuid"
}
```

#### PATCH /api/admin/disputes/:id/resolve
Resolve a dispute

**Body:**
```json
{
  "resolution_action": "refund_issued",
  "resolution_notes": "Full refund issued to customer",
  "refund_amount": 150.00
}
```

---

### A09: Communications (Chat Transcripts)

#### GET /api/admin/communications
List all message threads

**Query Parameters:**
- `entity_type` - local_request, project, employment_job, dispute
- `participant_id` - User ID of a participant

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "thread_id": "THREAD-001",
      "entity_type": "local_request",
      "entity_id": "uuid",
      "entity_display": "REQ-001",
      "participants": [
        {
          "id": "uuid",
          "name": "Sarah Johnson",
          "avatar": "url"
        }
      ],
      "message_count": 15,
      "last_message": {
        "content": "Thanks for your help!",
        "sender": "Sarah Johnson",
        "timestamp": "2024-02-15T18:00:00Z"
      },
      "created_at": "2024-02-15T10:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/communications/:threadId/messages
Get all messages in a thread (read-only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "message_id": "MSG-001",
      "sender": {
        "id": "uuid",
        "name": "Sarah Johnson",
        "avatar": "url"
      },
      "content": "Hi, are you available today?",
      "message_type": "text",
      "is_system": false,
      "created_at": "2024-02-15T10:05:00Z"
    }
  ],
  "meta": { ... }
}
```

---

### A10: INS Settings

#### GET /api/admin/ins/settings
Get INS assistant settings

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 500,
    "system_prompt": "You are INS, a helpful AI assistant...",
    "features": {
      "dispute_mediation": true,
      "message_drafting": true,
      "admin_notes": true
    }
  }
}
```

#### PATCH /api/admin/ins/settings
Update INS settings

**Body:**
```json
{
  "enabled": true,
  "model": "gpt-4",
  "temperature": 0.7,
  "system_prompt": "..."
}
```

#### POST /api/admin/ins/chat
Chat with INS for admin assistance

**Body:**
```json
{
  "message": "Draft a response to this dispute",
  "context": {
    "entity_type": "dispute",
    "entity_id": "uuid"
  },
  "conversation_id": "conv-001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Based on the dispute details, I suggest the following response...",
    "conversation_id": "conv-001"
  }
}
```

---

### A11: Categories & Service Zones

#### GET /api/admin/categories
List all categories

**Query Parameters:**
- `parent_id` - Parent category ID (null for top-level)
- `applicable_mode` - local_request, employment, project
- `status` - active, inactive

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Home Services",
      "slug": "home-services",
      "description": "All home-related services",
      "parent_id": null,
      "icon": "home",
      "applicable_modes": ["local_request", "employment"],
      "status": "active",
      "children_count": 5,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### POST /api/admin/categories
Create a new category

**Body:**
```json
{
  "name": "Plumbing",
  "slug": "plumbing",
  "description": "Plumbing services",
  "parent_id": "uuid",
  "icon": "wrench",
  "applicable_modes": ["local_request", "employment"]
}
```

#### PATCH /api/admin/categories/:id
Update a category

#### DELETE /api/admin/categories/:id
Delete a category

#### GET /api/admin/service-zones
List all service zones

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "New York City",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "zip_codes": ["10001", "10002", "10003"],
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### POST /api/admin/service-zones
Create a new service zone

**Body:**
```json
{
  "name": "Los Angeles Metro",
  "city": "Los Angeles",
  "state": "CA",
  "country": "USA",
  "zip_codes": ["90001", "90002"]
}
```

#### PATCH /api/admin/service-zones/:id
Update a service zone

#### DELETE /api/admin/service-zones/:id
Delete a service zone

---

### A12: Roles & Permissions

#### GET /api/admin/roles
List all admin roles

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Support Agent",
      "description": "Can view and respond to user issues",
      "permissions": {
        "users": ["read"],
        "disputes": ["read", "assign", "resolve"],
        "messages": ["read"]
      },
      "user_count": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/admin/roles
Create a new role

**Body:**
```json
{
  "name": "Content Moderator",
  "description": "Manages ratings and flags",
  "permissions": {
    "ratings": ["read", "hide", "remove"],
    "flags": ["read", "review", "resolve"]
  }
}
```

#### PATCH /api/admin/roles/:id
Update a role

#### DELETE /api/admin/roles/:id
Delete a role

#### POST /api/admin/users/:userId/roles
Assign role to user

**Body:**
```json
{
  "role_id": "uuid"
}
```

#### DELETE /api/admin/users/:userId/roles/:roleId
Remove role from user

---

### A13: Audit Logs

#### GET /api/admin/audit-logs
List all audit logs (read-only)

**Query Parameters:**
- `user_id` - User who performed action
- `action` - Action type (e.g., user.created, payment.refunded)
- `entity_type` - Entity type
- `entity_id` - Entity ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "log_id": "LOG-001",
      "user": {
        "id": "uuid",
        "name": "Admin User"
      },
      "action": "user.suspended",
      "entity_type": "user",
      "entity_id": "uuid",
      "entity_display": "Sarah Johnson (USR-001)",
      "changes": {
        "before": { "status": "active" },
        "after": { "status": "suspended" }
      },
      "ip_address": "192.168.1.1",
      "created_at": "2024-02-15T19:00:00Z"
    }
  ],
  "meta": { ... }
}
```

#### GET /api/admin/audit-logs/:id
Get detailed audit log entry

---

### A14: System Settings

#### GET /api/admin/system-settings
Get all system settings

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "key": "platform.commission_rate",
      "value": 0.15,
      "description": "Platform commission rate (15%)",
      "updated_by": {
        "id": "uuid",
        "name": "Super Admin"
      },
      "updated_at": "2024-02-01T10:00:00Z"
    }
  ]
}
```

#### GET /api/admin/system-settings/:key
Get specific setting

#### PATCH /api/admin/system-settings/:key
Update a setting

**Body:**
```json
{
  "value": 0.12
}
```

**Common Settings Keys:**
- `platform.commission_rate` - Commission rate (0-1)
- `platform.currency` - Default currency
- `payment.hold_duration_hours` - Hours to hold payment
- `auth.require_phone_verification` - Boolean
- `auth.require_email_verification` - Boolean
- `notifications.email_enabled` - Boolean
- `notifications.sms_enabled` - Boolean
- `ins.enabled` - Boolean
- `disputes.auto_assign` - Boolean

---

### A15: Bulk Actions

#### POST /api/admin/bulk/users/status
Update status for multiple users

**Body:**
```json
{
  "user_ids": ["uuid1", "uuid2"],
  "status": "suspended",
  "reason": "spam_activity",
  "notes": "Bulk suspension for spam"
}
```

#### POST /api/admin/bulk/requests/cancel
Cancel multiple requests

**Body:**
```json
{
  "request_ids": ["uuid1", "uuid2"],
  "reason": "admin_action",
  "notes": "Cancelled due to policy violation"
}
```

#### POST /api/admin/bulk/payments/process
Process multiple payouts

**Body:**
```json
{
  "payout_ids": ["uuid1", "uuid2"]
}
```

---

### A16: Exports

#### POST /api/admin/export/users
Export users to CSV

**Body:**
```json
{
  "filters": {
    "status": "active",
    "role": "provider"
  },
  "fields": ["id", "name", "email", "phone", "created_at"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "exp-001",
    "status": "processing",
    "download_url": null
  }
}
```

#### GET /api/admin/export/:exportId
Check export status and get download URL

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "exp-001",
    "status": "completed",
    "download_url": "https://...",
    "expires_at": "2024-02-16T10:00:00Z"
  }
}
```

---

## Real-time Features

### WebSocket Events

#### Connection
```javascript
const ws = new WebSocket('wss://api.ineedsomeone.com/ws');
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'jwt_token'
}));
```

#### Server -> Client Events

**New Message**
```json
{
  "event": "message.new",
  "data": {
    "thread_id": "thread-001",
    "message": { ... }
  }
}
```

**Status Update**
```json
{
  "event": "request.status_updated",
  "data": {
    "request_id": "REQ-001",
    "status": "completed"
  }
}
```

**New Notification**
```json
{
  "event": "notification.new",
  "data": {
    "notification": { ... }
  }
}
```

**Payment Processed**
```json
{
  "event": "payment.processed",
  "data": {
    "payment_id": "PAY-001",
    "status": "completed"
  }
}
```

#### Client -> Server Events

**Subscribe to Updates**
```json
{
  "type": "subscribe",
  "channels": [
    "user:uuid",
    "thread:thread-001",
    "request:REQ-001"
  ]
}
```

**Unsubscribe**
```json
{
  "type": "unsubscribe",
  "channels": ["thread:thread-001"]
}
```

---

## File Storage

### Upload Endpoint

#### POST /api/upload
Upload a file (avatar, document, attachment)

**Headers:**
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (form-data):**
- `file` - File to upload
- `type` - `avatar`, `document`, `resume`, `attachment`
- `entity_type` - Optional: `user`, `message`, `application`
- `entity_id` - Optional: UUID of related entity

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.ineedsomeone.com/files/abc123.pdf",
    "filename": "resume.pdf",
    "size": 245678,
    "mime_type": "application/pdf"
  }
}
```

**File Size Limits:**
- Avatar: 5 MB
- Document/Resume: 10 MB
- Attachment: 25 MB

**Allowed Types:**
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx
- Archives: zip

---

## Audit Logging

### Automatic Audit Log Creation

All admin actions MUST create an audit log entry. This happens automatically in middleware/service layer.

**Actions to Log:**
- User CRUD operations
- Status changes (users, requests, projects, disputes)
- Payment actions (refunds, manual processing)
- Permission changes
- Settings updates
- Bulk operations
- Data exports

**Audit Log Structure:**
```json
{
  "user_id": "admin-user-uuid",
  "action": "user.status_changed",
  "entity_type": "user",
  "entity_id": "target-user-uuid",
  "changes": {
    "before": { "status": "active" },
    "after": { "status": "suspended" }
  },
  "metadata": {
    "reason": "terms_violation",
    "notes": "Multiple complaints received"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

## Payment Processing

### Payment Flow

#### 1. Customer Payment (Request/Project Start)
```
1. Customer creates request/project
2. Payment intent created via Stripe
3. Customer completes payment
4. Funds held in escrow (status: 'held')
5. Audit log created
```

#### 2. Payment Release (After Completion)
```
1. Request/project marked as completed
2. Admin reviews (if needed)
3. Payment released to provider
4. Transfer created via Stripe Connect
5. Payment status: 'completed'
6. Provider payout record created
```

#### 3. Milestone Payments (Projects)
```
1. Client creates milestones
2. Provider submits milestone completion
3. Client approves milestone
4. Payment released for that milestone
5. Next milestone activated
```

#### 4. Refunds
```
1. Admin initiates refund via API
2. Refund processed via Stripe
3. Payment status: 'refunded'
4. Audit log created
5. Notification sent to both parties
```

### Stripe Integration

**Required Stripe Objects:**
- **Customer**: Created for each user making payments
- **Connect Account**: Created for each provider receiving payments
- **Payment Intent**: Created for each payment
- **Transfer**: Created to move funds to provider

**Webhook Events to Handle:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `payout.paid`
- `payout.failed`

---

## Search & Filtering

### Elasticsearch Implementation (Optional)

For advanced search capabilities, index the following:

**Users Index:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "name": { "type": "text", "analyzer": "standard" },
      "email": { "type": "keyword" },
      "phone": { "type": "keyword" },
      "roles": { "type": "keyword" },
      "city": { "type": "keyword" },
      "status": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

**Requests/Jobs/Projects Index:**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "title": { "type": "text", "analyzer": "standard" },
      "description": { "type": "text", "analyzer": "standard" },
      "type": { "type": "keyword" },
      "status": { "type": "keyword" },
      "category": { "type": "keyword" },
      "location": { "type": "geo_point" },
      "budget": { "type": "float" },
      "created_at": { "type": "date" }
    }
  }
}
```

### PostgreSQL Full-Text Search (Alternative)

```sql
-- Add tsvector columns for full-text search
ALTER TABLE users ADD COLUMN search_vector tsvector;
ALTER TABLE local_requests ADD COLUMN search_vector tsvector;

-- Create triggers to update search vectors
CREATE TRIGGER users_search_vector_update
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION
tsvector_update_trigger(search_vector, 'pg_catalog.english', first_name, last_name, email);

-- Create GIN index
CREATE INDEX users_search_idx ON users USING GIN(search_vector);

-- Search query example
SELECT * FROM users
WHERE search_vector @@ to_tsquery('english', 'john & provider');
```

---

## INS AI Integration

### OpenAI API Integration

**Configuration:**
- Model: `gpt-4` or `gpt-3.5-turbo`
- Temperature: 0.7 (configurable)
- Max tokens: 500 (configurable)

### Use Cases

#### 1. Dispute Mediation
```json
{
  "system_prompt": "You are INS, an AI mediator for disputes. Analyze the situation and suggest fair resolutions.",
  "user_message": "Dispute: Customer says service was not completed. Provider says customer changed requirements.",
  "context": {
    "dispute": { ... },
    "messages": [ ... ],
    "request_details": { ... }
  }
}
```

#### 2. Message Drafting
```json
{
  "system_prompt": "You are INS, helping draft professional admin responses.",
  "user_message": "Draft a response to a user who is asking why their account was suspended",
  "context": {
    "user": { ... },
    "suspension_reason": "multiple_violations",
    "previous_warnings": 2
  }
}
```

#### 3. Admin Notes
```json
{
  "system_prompt": "You are INS, helping summarize complex situations.",
  "user_message": "Summarize this dispute for the admin team",
  "context": {
    "dispute": { ... },
    "timeline": [ ... ]
  }
}
```

### API Endpoint for INS

```
POST /api/admin/ins/assist
Body: {
  "action": "mediate_dispute" | "draft_message" | "summarize",
  "context": { ... },
  "prompt": "optional custom prompt"
}

Response: {
  "success": true,
  "data": {
    "suggestion": "Based on the information provided...",
    "confidence": 0.85
  }
}
```

---

## Security Considerations

### 1. Authentication
- Use JWT with short expiry (15 min for access, 7 days for refresh)
- Store refresh tokens in httpOnly cookies
- Implement token rotation on refresh
- Rate limit authentication endpoints

### 2. Authorization
- Verify admin role on all admin endpoints
- Check specific permissions for sensitive actions
- Log all admin actions to audit log
- Require reason/notes for destructive actions

### 3. Input Validation
- Validate all input data against schema
- Sanitize user-generated content
- Prevent SQL injection (use parameterized queries)
- Prevent XSS attacks (escape output)

### 4. Rate Limiting
- Global: 1000 requests/hour per IP
- Auth endpoints: 5 requests/minute per IP
- Admin actions: 100 requests/minute per user
- File uploads: 10 uploads/minute per user

### 5. Data Privacy
- Encrypt sensitive data at rest (PII, payment info)
- Use TLS 1.3 for all connections
- Implement GDPR compliance (data export, deletion)
- Anonymize data in audit logs when requested

### 6. Payment Security
- Never store raw card details
- Use Stripe.js for tokenization
- Implement 3D Secure for payments
- Log all payment actions
- Validate webhook signatures

### 7. File Upload Security
- Scan uploads for malware
- Validate file types and sizes
- Use signed URLs with expiry
- Store in isolated cloud storage
- Prevent path traversal attacks

### 8. Webhook Verification
- Verify Stripe webhook signatures
- Use HTTPS for webhook URLs
- Implement idempotency for webhook handlers
- Log all webhook events

### 9. Database Security
- Use connection pooling
- Implement row-level security (RLS) where applicable
- Regular backups with encryption
- Separate read replicas for heavy queries

### 10. Monitoring & Alerts
- Monitor failed login attempts
- Alert on unusual admin activity
- Track API error rates
- Monitor payment failures
- Alert on dispute spikes

---

## API Versioning

All endpoints should be versioned:

```
/api/v1/admin/...
```

When breaking changes are needed, increment version:

```
/api/v2/admin/...
```

Maintain backward compatibility for at least 6 months.

---

## Error Codes

```
400 - Bad Request (validation errors)
401 - Unauthorized (invalid/missing token)
403 - Forbidden (insufficient permissions)
404 - Not Found
409 - Conflict (duplicate resource)
422 - Unprocessable Entity (business logic error)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
503 - Service Unavailable
```

---

## Development Recommendations

### 1. Project Structure (Node.js/Express Example)
```
/src
  /config          - Configuration files
  /controllers     - Request handlers
  /services        - Business logic
  /models          - Database models
  /middleware      - Auth, validation, logging
  /routes          - API routes
  /utils           - Helper functions
  /jobs            - Background jobs (queues)
  /websockets      - WebSocket handlers
  /validators      - Input validation schemas
  /tests           - Unit and integration tests
```

### 2. Environment Variables
```
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# OpenAI
OPENAI_API_KEY=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Email
SENDGRID_API_KEY=...

# SMS
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

### 3. Testing
- Unit tests for services and utils
- Integration tests for API endpoints
- E2E tests for critical flows
- Load testing for scalability
- Webhook testing with Stripe CLI

### 4. Deployment
- Use Docker containers
- Implement CI/CD (GitHub Actions, GitLab CI)
- Use staging environment for testing
- Implement blue-green deployment
- Set up monitoring (DataDog, New Relic, Sentry)

### 5. Documentation
- OpenAPI/Swagger for API docs
- Generate docs from code comments
- Keep this spec document updated
- Maintain changelog

---

## Conclusion

This specification provides a comprehensive blueprint for building the backend for the "I Need Someone" platform. Key considerations:

1. **Scalability**: Design for horizontal scaling from the start
2. **Security**: Implement security best practices at every layer
3. **Observability**: Log, monitor, and alert on all critical operations
4. **User Experience**: Fast response times, real-time updates
5. **Maintainability**: Clean code, good documentation, comprehensive tests

For any clarifications or additions to this spec, please contact the frontend team or create an issue in the project repository.

---

**Document Version**: 1.0  
**Last Updated**: February 2024  
**Maintained By**: Technical Team
