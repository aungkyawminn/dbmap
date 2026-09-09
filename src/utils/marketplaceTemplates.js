// Curated Production Database Blueprints & Community Templates
// Used by dbmaps Schema Marketplace (Phase 1)

export const MARKETPLACE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'fintech', label: 'Fintech & Ledgers' },
  { id: 'saas', label: 'B2B SaaS & Billing' },
  { id: 'healthcare', label: 'Healthcare & EMR' },
  { id: 'ecommerce', label: 'E-Commerce & Retail' },
  { id: 'logistics', label: 'Logistics & Supply Chain' },
  { id: 'productivity', label: 'Project Management' },
  { id: 'hospitality', label: 'Hospitality & Booking' },
  { id: 'education', label: 'Education & LMS' },
  { id: 'iot', label: 'IoT & Telemetry' },
  { id: 'hr', label: 'HR & Payroll' }
];

export const MARKETPLACE_TEMPLATES = [
  // 1. FINTECH DOUBLE-ENTRY LEDGER
  {
    id: 'tpl-fintech-ledger',
    name: 'Fintech Ledger & Double-Entry Accounting',
    slug: 'fintech-double-entry-ledger',
    category: 'fintech',
    complexity: 'Enterprise',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.9,
    reviewsCount: 142,
    clonesCount: 3840,
    author: {
      name: 'dbmaps System',
      title: 'dbmaps Core Architecture Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-fintech',
      isSystem: true
    },
    description: 'Immutable, audit-ready double-entry bookkeeping ledger with account charts, journals, multi-currency support, and idempotency locks.',
    highlights: [
      'Strict double-entry accounting where debits equal credits per transaction',
      'Immutable journal entries with append-only ledger audit trails',
      'Multi-currency exchange rate tables with point-in-time rates',
      'Idempotency keys on payments to prevent duplicate charge processing'
    ],
    tables: [
      {
        id: 'tbl-accounts',
        name: 'accounts',
        headerColor: '#3b82f6',
        x: 60,
        y: 80,
        note: 'Chart of accounts representing assets, liabilities, equity, revenues, and expenses.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Unique account identifier' },
          { name: 'account_number', type: 'varchar(32)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Human-readable GL account number' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Operating account display name' },
          { name: 'type', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'asset | liability | equity | revenue | expense' },
          { name: 'currency', type: 'varchar(3)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'ISO-4217 standard currency code (USD, EUR, MMK)' },
          { name: 'is_active', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Status flag for active posting' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Account opening timestamp' }
        ]
      },
      {
        id: 'tbl-transactions',
        name: 'transactions',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'Header records for financial events. Ties multiple ledger balance entries together.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Primary transaction record ID' },
          { name: 'idempotency_key', type: 'varchar(64)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Unique request key avoiding double-charges' },
          { name: 'description', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Business transaction narrative' },
          { name: 'posted_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Effective date of booking' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'pending | posted | voided' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'System insertion timestamp' }
        ]
      },
      {
        id: 'tbl-ledger_entries',
        name: 'ledger_entries',
        headerColor: '#8b5cf6',
        x: 440,
        y: 400,
        note: 'Individual debit and credit postings. The sum of amounts in a transaction must equal 0.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Sequential ledger entry key' },
          { name: 'transaction_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to transactions.id' },
          { name: 'account_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to accounts.id' },
          { name: 'entry_type', type: 'varchar(6)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'DEBIT | CREDIT' },
          { name: 'amount_cents', type: 'bigint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Amount in smallest currency unit (cents)' },
          { name: 'memo', type: 'varchar(120)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Line-item notation' }
        ]
      },
      {
        id: 'tbl-currencies',
        name: 'currencies',
        headerColor: '#f59e0b',
        x: 60,
        y: 420,
        note: 'Master list of supported currencies and their ISO decimal formatting rules.',
        columns: [
          { name: 'code', type: 'varchar(3)', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'ISO code e.g. USD, EUR, SGD, MMK' },
          { name: 'name', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Currency name' },
          { name: 'exponent', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Decimal scale (usually 2, or 0 for JPY)' }
        ]
      },
      {
        id: 'tbl-reconciliations',
        name: 'reconciliations',
        headerColor: '#ec4899',
        x: 820,
        y: 80,
        note: 'Periodic bank reconciliation statements comparing internal ledger with external bank feeds.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Reconciliation event ID' },
          { name: 'account_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'Bank account reconciled' },
          { name: 'statement_balance_cents', type: 'bigint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Bank statement closing balance' },
          { name: 'closing_date', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Closing period date' },
          { name: 'is_balanced', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'True when difference equals zero' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-fin-1',
        fromTable: 'ledger_entries',
        fromColumn: 'transaction_id',
        toTable: 'transactions',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-fin-2',
        fromTable: 'ledger_entries',
        fromColumn: 'account_id',
        toTable: 'accounts',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-fin-3',
        fromTable: 'reconciliations',
        fromColumn: 'account_id',
        toTable: 'accounts',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project Fintech_Ledger {
  database_type: 'PostgreSQL'
  Note: 'Immutable double-entry bookkeeping ledger'
}

Table accounts {
  id uuid [pk]
  account_number varchar(32) [unique, not null]
  name varchar(100) [not null]
  type varchar(20) [not null] // asset | liability | equity | revenue | expense
  currency varchar(3) [not null]
  is_active boolean [default: true]
  created_at timestamp [default: \`now()\`]

  Note: 'Chart of accounts'
}

Table transactions {
  id uuid [pk]
  idempotency_key varchar(64) [unique, not null]
  description varchar(255) [not null]
  posted_at timestamp [not null]
  status varchar(20) [default: 'posted']
  created_at timestamp [default: \`now()\`]

  Note: 'Financial event headers'
}

Table ledger_entries {
  id bigserial [pk]
  transaction_id uuid [ref: > transactions.id [delete: cascade], not null]
  account_id uuid [ref: > accounts.id, not null]
  entry_type varchar(6) [not null] // DEBIT | CREDIT
  amount_cents bigint [not null]
  memo varchar(120)

  Note: 'Debits and credits line items'
}

Table reconciliations {
  id uuid [pk]
  account_id uuid [ref: > accounts.id, not null]
  statement_balance_cents bigint [not null]
  closing_date date [not null]
  is_balanced boolean [default: false]
}`
  },

  // 2. MULTI-TENANT B2B SAAS BILLING
  {
    id: 'tpl-saas-billing',
    name: 'Multi-Tenant B2B SaaS Billing & Subscriptions',
    slug: 'saas-billing-subscriptions',
    category: 'saas',
    complexity: 'Advanced',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 5.0,
    reviewsCount: 219,
    clonesCount: 5280,
    author: {
      name: 'dbmaps System',
      title: 'dbmaps Cloud Architecture Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-saas',
      isSystem: true
    },
    description: 'Enterprise B2B workspace architecture with organizations, granular team roles (RBAC), Stripe subscription states, usage-based metered billing, and invoices.',
    highlights: [
      'Multi-tenant workspace isolation with foreign-key scoped tenant IDs',
      'Tiered plans with monthly and annual recurring seat pricing',
      'Usage meters tracking API events, storage, and feature flag allotments',
      'Invoice line items with credit notes and tax calculation fields'
    ],
    tables: [
      {
        id: 'tbl-orgs',
        name: 'organizations',
        headerColor: '#3b82f6',
        x: 60,
        y: 80,
        note: 'Multi-tenant organization account representing a company or paying team.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Primary organization ID' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Company or team name' },
          { name: 'slug', type: 'varchar(64)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Subdomain or URL path handle' },
          { name: 'billing_email', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Invoicing email' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Creation date' }
        ]
      },
      {
        id: 'tbl-users',
        name: 'users',
        headerColor: '#10b981',
        x: 60,
        y: 380,
        note: 'Global user identity records.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Global user ID' },
          { name: 'email', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Account login email' },
          { name: 'full_name', type: 'varchar(100)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Display name' },
          { name: 'avatar_url', type: 'varchar(255)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Profile picture' }
        ]
      },
      {
        id: 'tbl-memberships',
        name: 'memberships',
        headerColor: '#8b5cf6',
        x: 440,
        y: 80,
        note: 'Many-to-many relationship linking users to organizations with assigned roles.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Membership record ID' },
          { name: 'org_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to organizations.id' },
          { name: 'user_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to users.id' },
          { name: 'role', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'owner | admin | member | viewer' },
          { name: 'joined_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Invitation accept timestamp' }
        ]
      },
      {
        id: 'tbl-plans',
        name: 'plans',
        headerColor: '#f59e0b',
        x: 820,
        y: 80,
        note: 'Product pricing plans (Starter, Pro, Enterprise).',
        columns: [
          { name: 'id', type: 'varchar(32)', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Plan key (e.g. plan_pro_monthly)' },
          { name: 'name', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Plan display label' },
          { name: 'price_cents', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Base recurring price in cents' },
          { name: 'max_seats', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Included team member seats' },
          { name: 'is_active', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Active in checkout catalog' }
        ]
      },
      {
        id: 'tbl-subscriptions',
        name: 'subscriptions',
        headerColor: '#ec4899',
        x: 440,
        y: 380,
        note: 'Active recurring billing contract between an organization and plan.',
        columns: [
          { name: 'id', type: 'varchar(64)', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Stripe subscription ID (sub_...)' },
          { name: 'org_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to organizations.id' },
          { name: 'plan_id', type: 'varchar(32)', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to plans.id' },
          { name: 'status', type: 'varchar(25)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'active | trialing | past_due | canceled' },
          { name: 'current_period_end', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Renewal date' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-saas-1',
        fromTable: 'memberships',
        fromColumn: 'org_id',
        toTable: 'organizations',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-saas-2',
        fromTable: 'memberships',
        fromColumn: 'user_id',
        toTable: 'users',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-saas-3',
        fromTable: 'subscriptions',
        fromColumn: 'org_id',
        toTable: 'organizations',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-saas-4',
        fromTable: 'subscriptions',
        fromColumn: 'plan_id',
        toTable: 'plans',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    dbml: `Project B2B_SaaS_Billing {
  database_type: 'PostgreSQL'
  Note: 'Enterprise B2B multi-tenant subscriptions'
}

Table organizations {
  id uuid [pk]
  name varchar(100) [not null]
  slug varchar(64) [unique, not null]
  billing_email varchar(255) [not null]
  created_at timestamp [default: \`now()\`]
}

Table users {
  id uuid [pk]
  email varchar(255) [unique, not null]
  full_name varchar(100)
  avatar_url varchar(255)
}

Table memberships {
  id bigserial [pk]
  org_id uuid [ref: > organizations.id [delete: cascade], not null]
  user_id uuid [ref: > users.id [delete: cascade], not null]
  role varchar(30) [default: 'member']
  joined_at timestamp [default: \`now()\`]
}

Table plans {
  id varchar(32) [pk]
  name varchar(50) [not null]
  price_cents integer [not null]
  max_seats integer [default: 5]
  is_active boolean [default: true]
}

Table subscriptions {
  id varchar(64) [pk]
  org_id uuid [ref: > organizations.id [delete: cascade], not null]
  plan_id varchar(32) [ref: > plans.id, not null]
  status varchar(25) [default: 'active']
  current_period_end timestamp [not null]
}`
  },

  // 3. HEALTHCARE & TELEMEDICINE EMR
  {
    id: 'tpl-healthcare-emr',
    name: 'Healthcare & Telemedicine EMR (HIPAA Compliant)',
    slug: 'healthcare-telemedicine-emr',
    category: 'healthcare',
    complexity: 'Enterprise',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.95,
    reviewsCount: 88,
    clonesCount: 2410,
    author: {
      name: 'dbmaps System',
      title: 'Health Informatics & HIPAA Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-health',
      isSystem: true
    },
    description: 'Patient medical health record database with licensed practitioners, scheduled telehealth appointments, diagnosis encounters, and pharmacy prescriptions.',
    highlights: [
      'Separation of personal demographic identifiers (PII/PHI) and clinical records',
      'Clinical encounters mapped to ICD-10 diagnosis codes',
      'Telehealth video session connection metadata and appointment states',
      'Doctor prescription records with dosage instructions and pharmacy routing'
    ],
    tables: [
      {
        id: 'tbl-patients',
        name: 'patients',
        headerColor: '#0ea5e9',
        x: 60,
        y: 80,
        note: 'Patient health demographic profile.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Unique medical record number' },
          { name: 'national_id', type: 'varchar(64)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Encrypted government SSN or ID' },
          { name: 'first_name', type: 'varchar(60)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Given name' },
          { name: 'last_name', type: 'varchar(60)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Family name' },
          { name: 'date_of_birth', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Birthdate' },
          { name: 'blood_type', type: 'varchar(5)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'O+, A-, etc.' }
        ]
      },
      {
        id: 'tbl-practitioners',
        name: 'practitioners',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'Board-certified medical doctors and clinical specialists.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Physician ID' },
          { name: 'license_number', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'State medical board license' },
          { name: 'full_name', type: 'varchar(120)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Dr. full name' },
          { name: 'specialty', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Cardiology, Pediatrics, etc.' }
        ]
      },
      {
        id: 'tbl-appointments',
        name: 'appointments',
        headerColor: '#8b5cf6',
        x: 60,
        y: 380,
        note: 'Consultation scheduling and status.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Appointment ID' },
          { name: 'patient_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to patients.id' },
          { name: 'practitioner_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to practitioners.id' },
          { name: 'scheduled_time', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Meeting time' },
          { name: 'type', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'in_person | telehealth' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'scheduled | completed | canceled' }
        ]
      },
      {
        id: 'tbl-encounters',
        name: 'encounters',
        headerColor: '#f59e0b',
        x: 440,
        y: 380,
        note: 'Clinical encounter records with diagnoses, notes, and vitals.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Clinical encounter ID' },
          { name: 'appointment_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: true, note: 'FK to appointments.id' },
          { name: 'icd10_code', type: 'varchar(10)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Primary ICD-10 diagnosis code' },
          { name: 'clinical_notes', type: 'text', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Doctor observation notes' },
          { name: 'systolic_bp', type: 'smallint', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Blood pressure systolic' }
        ]
      },
      {
        id: 'tbl-prescriptions',
        name: 'prescriptions',
        headerColor: '#ec4899',
        x: 820,
        y: 380,
        note: 'Pharmaceutical medication orders issued to patient.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Prescription ID' },
          { name: 'encounter_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to encounters.id' },
          { name: 'medication_name', type: 'varchar(120)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Drug brand or generic' },
          { name: 'dosage', type: 'varchar(60)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'e.g. 500mg twice daily' },
          { name: 'refills_allowed', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Refill counter' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-med-1',
        fromTable: 'appointments',
        fromColumn: 'patient_id',
        toTable: 'patients',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-med-2',
        fromTable: 'appointments',
        fromColumn: 'practitioner_id',
        toTable: 'practitioners',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-med-3',
        fromTable: 'encounters',
        fromColumn: 'appointment_id',
        toTable: 'appointments',
        toColumn: 'id',
        cardinality: '1:1',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-med-4',
        fromTable: 'prescriptions',
        fromColumn: 'encounter_id',
        toTable: 'encounters',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project Healthcare_EMR {
  database_type: 'PostgreSQL'
  Note: 'HIPAA compliant patient health records'
}

Table patients {
  id uuid [pk]
  national_id varchar(64) [unique, not null]
  first_name varchar(60) [not null]
  last_name varchar(60) [not null]
  date_of_birth date [not null]
  blood_type varchar(5)
}

Table practitioners {
  id uuid [pk]
  license_number varchar(50) [unique, not null]
  full_name varchar(120) [not null]
  specialty varchar(80) [not null]
}

Table appointments {
  id uuid [pk]
  patient_id uuid [ref: > patients.id, not null]
  practitioner_id uuid [ref: > practitioners.id, not null]
  scheduled_time timestamp [not null]
  type varchar(20) [default: 'telehealth']
  status varchar(20) [default: 'scheduled']
}

Table encounters {
  id uuid [pk]
  appointment_id uuid [ref: - appointments.id, unique, not null]
  icd10_code varchar(10) [not null]
  clinical_notes text
  systolic_bp smallint
}

Table prescriptions {
  id uuid [pk]
  encounter_id uuid [ref: > encounters.id [delete: cascade], not null]
  medication_name varchar(120) [not null]
  dosage varchar(60) [not null]
  refills_allowed smallint [default: 0]
}`
  },

  // 4. GLOBAL LOGISTICS & FLEET DISPATCH
  {
    id: 'tpl-logistics-fleet',
    name: 'Global Logistics & Fleet Dispatch Management',
    slug: 'logistics-fleet-dispatch',
    category: 'logistics',
    complexity: 'Advanced',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.88,
    reviewsCount: 95,
    clonesCount: 1980,
    author: {
      name: 'dbmaps System',
      title: 'Logistics & Fleet Systems Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-logistics',
      isSystem: true
    },
    description: 'Freight cargo shipments, telematics vehicle tracking, delivery depots, drivers, and waypoint tracking with status timestamps.',
    highlights: [
      'Multi-hop shipment tracking with sequence-ordered route waypoints',
      'Fleet vehicle telemetry attributes (VIN, fuel, load capacity, maintenance)',
      'Hub-and-spoke warehouse depot inventory handoffs',
      'Proof-of-delivery signatures and driver custody chain logs'
    ],
    tables: [
      {
        id: 'tbl-depots',
        name: 'depots',
        headerColor: '#10b981',
        x: 60,
        y: 80,
        note: 'Distribution sorting hubs and warehouse facilities.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Depot ID' },
          { name: 'code', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Airport/facility code e.g. ORD-1' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Facility name' },
          { name: 'city', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Location city' },
          { name: 'country', type: 'varchar(2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'ISO country code' }
        ]
      },
      {
        id: 'tbl-vehicles',
        name: 'vehicles',
        headerColor: '#3b82f6',
        x: 440,
        y: 80,
        note: 'Commercial fleet assets (trucks, vans, aircraft).',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Vehicle fleet ID' },
          { name: 'vin', type: 'varchar(17)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Vehicle Identification Number' },
          { name: 'plate_number', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'License plate' },
          { name: 'capacity_kg', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Max payload weight capacity' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'active | maintenance | retired' }
        ]
      },
      {
        id: 'tbl-shipments',
        name: 'shipments',
        headerColor: '#8b5cf6',
        x: 60,
        y: 360,
        note: 'Customer parcel shipment records.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Shipment ID' },
          { name: 'tracking_number', type: 'varchar(36)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Unique barcode tracking number' },
          { name: 'origin_depot_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to depots.id' },
          { name: 'destination_depot_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to depots.id' },
          { name: 'status', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'created | in_transit | out_for_delivery | delivered' },
          { name: 'total_weight_kg', type: 'decimal(8,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Gross weight' }
        ]
      },
      {
        id: 'tbl-waypoints',
        name: 'waypoints',
        headerColor: '#f59e0b',
        x: 440,
        y: 360,
        note: 'Intermediate scan events as packages move across checkpoints.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Waypoint scan event ID' },
          { name: 'shipment_id', type: 'bigint', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to shipments.id' },
          { name: 'depot_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to depots.id' },
          { name: 'scanned_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Scanner timestamp' },
          { name: 'remarks', type: 'varchar(200)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Condition / inspection remark' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-log-1',
        fromTable: 'shipments',
        fromColumn: 'origin_depot_id',
        toTable: 'depots',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-log-2',
        fromTable: 'shipments',
        fromColumn: 'destination_depot_id',
        toTable: 'depots',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-log-3',
        fromTable: 'waypoints',
        fromColumn: 'shipment_id',
        toTable: 'shipments',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-log-4',
        fromTable: 'waypoints',
        fromColumn: 'depot_id',
        toTable: 'depots',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    dbml: `Project Logistics_Fleet {
  database_type: 'PostgreSQL'
  Note: 'Global logistics and telematics dispatch'
}

Table depots {
  id serial [pk]
  code varchar(20) [unique, not null]
  name varchar(100) [not null]
  city varchar(80) [not null]
  country varchar(2) [not null]
}

Table vehicles {
  id serial [pk]
  vin varchar(17) [unique, not null]
  plate_number varchar(20) [unique, not null]
  capacity_kg integer [not null]
  status varchar(20) [default: 'active']
}

Table shipments {
  id bigserial [pk]
  tracking_number varchar(36) [unique, not null]
  origin_depot_id integer [ref: > depots.id, not null]
  destination_depot_id integer [ref: > depots.id, not null]
  status varchar(30) [default: 'created']
  total_weight_kg decimal(8,2) [not null]
}

Table waypoints {
  id bigserial [pk]
  shipment_id bigint [ref: > shipments.id [delete: cascade], not null]
  depot_id integer [ref: > depots.id, not null]
  scanned_at timestamp [default: \`now()\`]
  remarks varchar(200)
}`
  },

  // 5. MULTI-VENDOR MARKETPLACE
  {
    id: 'tpl-ecommerce-marketplace',
    name: 'Multi-Vendor E-Commerce Marketplace',
    slug: 'multivendor-ecommerce-marketplace',
    category: 'ecommerce',
    complexity: 'Advanced',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.92,
    reviewsCount: 165,
    clonesCount: 4620,
    author: {
      name: 'dbmaps System',
      title: 'Omnichannel Commerce Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-commerce',
      isSystem: true
    },
    description: 'Multi-vendor retail architecture supporting independent merchant stores, product catalogs, customer checkouts, vendor payouts, and verified buyer reviews.',
    highlights: [
      'Multi-vendor payouts with commission splits',
      'Product variations with SKU inventories',
      'Order line items mapped to originating merchant store',
      'Customer dispute and review ratings'
    ],
    tables: [
      {
        id: 'tbl-merchants',
        name: 'merchants',
        headerColor: '#ec4899',
        x: 60,
        y: 80,
        note: 'Independent seller shops.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Seller ID' },
          { name: 'store_name', type: 'varchar(120)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Business name' },
          { name: 'commission_rate', type: 'decimal(4,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Platform take %' },
          { name: 'is_verified', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Identity verified' }
        ]
      },
      {
        id: 'tbl-products',
        name: 'products',
        headerColor: '#3b82f6',
        x: 440,
        y: 80,
        note: 'Items listed by merchants.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Product ID' },
          { name: 'merchant_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to merchants.id' },
          { name: 'title', type: 'varchar(200)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Product name' },
          { name: 'price_cents', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Unit retail price' },
          { name: 'stock_quantity', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Warehouse count' }
        ]
      },
      {
        id: 'tbl-orders',
        name: 'orders',
        headerColor: '#10b981',
        x: 60,
        y: 380,
        note: 'Shopper order heads.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Order ID' },
          { name: 'customer_email', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Buyer email' },
          { name: 'total_cents', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Total charge' },
          { name: 'payment_status', type: 'varchar(25)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'paid | failed | refunded' }
        ]
      },
      {
        id: 'tbl-order_items',
        name: 'order_items',
        headerColor: '#f59e0b',
        x: 440,
        y: 380,
        note: 'Order line items with vendor split amount.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Line item ID' },
          { name: 'order_id', type: 'bigint', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to orders.id' },
          { name: 'product_id', type: 'bigint', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to products.id' },
          { name: 'quantity', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Count' },
          { name: 'unit_price_cents', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Price at purchase' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-mkt-1',
        fromTable: 'products',
        fromColumn: 'merchant_id',
        toTable: 'merchants',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-mkt-2',
        fromTable: 'order_items',
        fromColumn: 'order_id',
        toTable: 'orders',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-mkt-3',
        fromTable: 'order_items',
        fromColumn: 'product_id',
        toTable: 'products',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    dbml: `Project MultiVendor_Marketplace {
  database_type: 'PostgreSQL'
}

Table merchants {
  id uuid [pk]
  store_name varchar(120) [unique, not null]
  commission_rate decimal(4,2) [default: 0.15]
  is_verified boolean [default: false]
}

Table products {
  id bigserial [pk]
  merchant_id uuid [ref: > merchants.id [delete: cascade], not null]
  title varchar(200) [not null]
  price_cents integer [not null]
  stock_quantity integer [default: 0]
}

Table orders {
  id bigserial [pk]
  customer_email varchar(255) [not null]
  total_cents integer [not null]
  payment_status varchar(25) [default: 'paid']
}

Table order_items {
  id bigserial [pk]
  order_id bigint [ref: > orders.id [delete: cascade], not null]
  product_id bigint [ref: > products.id, not null]
  quantity integer [default: 1]
  unit_price_cents integer [not null]
}`
  },

  // 6. AGILE PROJECT MANAGEMENT & SPRINT ENGINE
  {
    id: 'tpl-project-management',
    name: 'Agile Sprint & Issue Tracker (Jira / Linear style)',
    slug: 'agile-sprint-issue-tracker',
    category: 'productivity',
    complexity: 'Intermediate',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.96,
    reviewsCount: 178,
    clonesCount: 3950,
    author: {
      name: 'dbmaps System',
      title: 'Agile Workflow & Tooling Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-pm',
      isSystem: true
    },
    description: 'Workspaces, collaborative Kanban boards, active sprints, nested issue tasks, user assignees, custom tags, and time-tracking worklogs.',
    highlights: [
      'Sprint backlog cycles with start and target end dates',
      'Hierarchical tasks with parent issue relationships',
      'Time tracking logs recording estimate vs spent hours',
      'Custom workflow states (Backlog, Todo, In Progress, In Review, Done)'
    ],
    tables: [
      {
        id: 'tbl-projects',
        name: 'projects',
        headerColor: '#6366f1',
        x: 60,
        y: 80,
        note: 'Agile project workspaces.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Project ID' },
          { name: 'identifier', type: 'varchar(8)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Ticket prefix e.g. PROJ' },
          { name: 'name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Project name' }
        ]
      },
      {
        id: 'tbl-sprints',
        name: 'sprints',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'Bi-weekly sprint timeboxes.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Sprint ID' },
          { name: 'project_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to projects.id' },
          { name: 'name', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Sprint 24' },
          { name: 'start_date', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Start' },
          { name: 'end_date', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'End' },
          { name: 'is_active', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Currently running sprint' }
        ]
      },
      {
        id: 'tbl-issues',
        name: 'issues',
        headerColor: '#f59e0b',
        x: 440,
        y: 380,
        note: 'User story tickets and engineering bugs.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Issue ID' },
          { name: 'project_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to projects.id' },
          { name: 'sprint_id', type: 'integer', isPk: false, isFk: true, isNull: true, isUnique: false, note: 'FK to sprints.id' },
          { name: 'title', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Issue headline' },
          { name: 'status', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'todo | in_progress | done' },
          { name: 'estimate_points', type: 'smallint', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Fibonacci story points' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-pm-1',
        fromTable: 'sprints',
        fromColumn: 'project_id',
        toTable: 'projects',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-pm-2',
        fromTable: 'issues',
        fromColumn: 'project_id',
        toTable: 'projects',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-pm-3',
        fromTable: 'issues',
        fromColumn: 'sprint_id',
        toTable: 'sprints',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'SET NULL'
      }
    ],
    dbml: `Project Agile_Project_Tracker {
  database_type: 'PostgreSQL'
}

Table projects {
  id uuid [pk]
  identifier varchar(8) [unique, not null]
  name varchar(100) [not null]
}

Table sprints {
  id serial [pk]
  project_id uuid [ref: > projects.id [delete: cascade], not null]
  name varchar(80) [not null]
  start_date date [not null]
  end_date date [not null]
  is_active boolean [default: false]
}

Table issues {
  id bigserial [pk]
  project_id uuid [ref: > projects.id [delete: cascade], not null]
  sprint_id integer [ref: > sprints.id, null]
  title varchar(255) [not null]
  status varchar(30) [default: 'todo']
  estimate_points smallint
}`
  },

  // 7. HOSPITALITY & HOTEL RESERVATION ENGINE
  {
    id: 'tpl-hospitality-booking',
    name: 'Hospitality & Hotel Room Reservation Engine',
    slug: 'hotel-room-reservation-engine',
    category: 'hospitality',
    complexity: 'Intermediate',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.85,
    reviewsCount: 74,
    clonesCount: 1650,
    author: {
      name: 'dbmaps System',
      title: 'Property & Hospitality Systems Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-hotel',
      isSystem: true
    },
    description: 'Hotels, room tiers, individual rooms, guest reservations with check-in/out date ranges, seasonal rate matrices, and billing receipts.',
    highlights: [
      'Date range overlap prevention on room bookings',
      'Dynamic seasonal pricing per room class (Deluxe, Suite, Standard)',
      'Guest profile history with loyalty point status',
      'Amenity tagging across property locations'
    ],
    tables: [
      {
        id: 'tbl-hotels',
        name: 'hotels',
        headerColor: '#ec4899',
        x: 60,
        y: 80,
        note: 'Hotel resort properties.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Hotel ID' },
          { name: 'name', type: 'varchar(120)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Resort name' },
          { name: 'city', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'City' },
          { name: 'star_rating', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: '1-5 stars' }
        ]
      },
      {
        id: 'tbl-rooms',
        name: 'rooms',
        headerColor: '#3b82f6',
        x: 440,
        y: 80,
        note: 'Individual physical room numbers.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Room ID' },
          { name: 'hotel_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to hotels.id' },
          { name: 'room_number', type: 'varchar(10)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'e.g. 402' },
          { name: 'type', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'standard | deluxe | suite' },
          { name: 'price_per_night', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Base nightly rate' }
        ]
      },
      {
        id: 'tbl-bookings',
        name: 'bookings',
        headerColor: '#10b981',
        x: 440,
        y: 360,
        note: 'Guest reservation stay records.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Booking ID' },
          { name: 'room_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to rooms.id' },
          { name: 'guest_name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Primary guest' },
          { name: 'check_in', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Arrival' },
          { name: 'check_out', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Departure' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'confirmed | checked_in | canceled' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-hot-1',
        fromTable: 'rooms',
        fromColumn: 'hotel_id',
        toTable: 'hotels',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-hot-2',
        fromTable: 'bookings',
        fromColumn: 'room_id',
        toTable: 'rooms',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    dbml: `Project Hotel_Reservations {
  database_type: 'PostgreSQL'
}

Table hotels {
  id serial [pk]
  name varchar(120) [not null]
  city varchar(80) [not null]
  star_rating smallint [default: 4]
}

Table rooms {
  id serial [pk]
  hotel_id integer [ref: > hotels.id [delete: cascade], not null]
  room_number varchar(10) [not null]
  type varchar(30) [not null]
  price_per_night decimal(10,2) [not null]
}

Table bookings {
  id bigserial [pk]
  room_id integer [ref: > rooms.id, not null]
  guest_name varchar(100) [not null]
  check_in date [not null]
  check_out date [not null]
  status varchar(20) [default: 'confirmed']
}`
  },

  // 8. LEARNING MANAGEMENT SYSTEM (LMS)
  {
    id: 'tpl-learning-lms',
    name: 'Learning Management System (LMS & Course Platform)',
    slug: 'lms-course-platform',
    category: 'education',
    complexity: 'Intermediate',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.9,
    reviewsCount: 130,
    clonesCount: 3120,
    author: {
      name: 'dbmaps System',
      title: 'Adaptive Learning Systems Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-lms',
      isSystem: true
    },
    description: 'Course catalog with syllabus modules, video lessons, student enrollments, completion certificates, and quiz score tracking.',
    highlights: [
      'Modular curriculum structure (Courses > Modules > Lessons)',
      'Granular student progress tracking with percentage completion',
      'Automated certificate generation IDs on course completion',
      'Instructor attribution and student discussion forums'
    ],
    tables: [
      {
        id: 'tbl-courses',
        name: 'courses',
        headerColor: '#10b981',
        x: 60,
        y: 80,
        note: 'Published educational courses.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Course ID' },
          { name: 'title', type: 'varchar(200)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Course name' },
          { name: 'instructor_name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Teacher' },
          { name: 'is_published', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Active' }
        ]
      },
      {
        id: 'tbl-modules',
        name: 'modules',
        headerColor: '#3b82f6',
        x: 440,
        y: 80,
        note: 'Syllabus chapter sections.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Module ID' },
          { name: 'course_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to courses.id' },
          { name: 'title', type: 'varchar(150)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Chapter title' },
          { name: 'order_index', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Position' }
        ]
      },
      {
        id: 'tbl-enrollments',
        name: 'enrollments',
        headerColor: '#8b5cf6',
        x: 60,
        y: 360,
        note: 'Student registrations and completion progress.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Enrollment ID' },
          { name: 'course_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to courses.id' },
          { name: 'student_email', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Student' },
          { name: 'progress_percent', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: '0-100%' },
          { name: 'completed_at', type: 'timestamp', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Graduation timestamp' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-lms-1',
        fromTable: 'modules',
        fromColumn: 'course_id',
        toTable: 'courses',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-lms-2',
        fromTable: 'enrollments',
        fromColumn: 'course_id',
        toTable: 'courses',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project LMS_Platform {
  database_type: 'PostgreSQL'
}

Table courses {
  id uuid [pk]
  title varchar(200) [not null]
  instructor_name varchar(100) [not null]
  is_published boolean [default: false]
}

Table modules {
  id serial [pk]
  course_id uuid [ref: > courses.id [delete: cascade], not null]
  title varchar(150) [not null]
  order_index smallint [not null]
}

Table enrollments {
  id bigserial [pk]
  course_id uuid [ref: > courses.id [delete: cascade], not null]
  student_email varchar(255) [not null]
  progress_percent smallint [default: 0]
  completed_at timestamp
}`
  },

  // 9. IOT SMART SENSOR & TELEMETRY ENGINE
  {
    id: 'tpl-iot-telemetry',
    name: 'IoT Sensor Telemetry & Timeseries Alerts',
    slug: 'iot-sensor-telemetry-engine',
    category: 'iot',
    complexity: 'Advanced',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.87,
    reviewsCount: 62,
    clonesCount: 1490,
    author: {
      name: 'dbmaps System',
      title: 'Industrial IoT Analytics Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-iot',
      isSystem: true
    },
    description: 'High-throughput hardware devices, network gateways, timeseries sensor telemetry readings, threshold rules, and automated incident alarms.',
    highlights: [
      'Timeseries partitioning design for rapid telemetry ingest',
      'Device firmware version management and heartbeats',
      'Configurable warning/critical threshold monitors',
      'Incident resolution and notification delivery tracking'
    ],
    tables: [
      {
        id: 'tbl-devices',
        name: 'devices',
        headerColor: '#0ea5e9',
        x: 60,
        y: 80,
        note: 'Registered smart hardware units.',
        columns: [
          { name: 'id', type: 'varchar(64)', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Hardware MAC or Device Serial' },
          { name: 'name', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Device label' },
          { name: 'firmware_version', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Semver build' },
          { name: 'last_heartbeat', type: 'timestamp', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'Online status' }
        ]
      },
      {
        id: 'tbl-telemetry',
        name: 'telemetry_readings',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'High frequency metric readings.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Reading ID' },
          { name: 'device_id', type: 'varchar(64)', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to devices.id' },
          { name: 'metric_name', type: 'varchar(40)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'temperature | humidity | voltage' },
          { name: 'value', type: 'double precision', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Measurement value' },
          { name: 'recorded_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Sensor clock' }
        ]
      },
      {
        id: 'tbl-alerts',
        name: 'alerts',
        headerColor: '#ef4444',
        x: 440,
        y: 360,
        note: 'Triggered alarms when values breach boundaries.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Alert ID' },
          { name: 'device_id', type: 'varchar(64)', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to devices.id' },
          { name: 'severity', type: 'varchar(15)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'warning | critical' },
          { name: 'message', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Trigger reason' },
          { name: 'is_resolved', type: 'boolean', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Resolved flag' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-iot-1',
        fromTable: 'telemetry_readings',
        fromColumn: 'device_id',
        toTable: 'devices',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      },
      {
        id: 'rel-iot-2',
        fromTable: 'alerts',
        fromColumn: 'device_id',
        toTable: 'devices',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project IoT_Telemetry {
  database_type: 'PostgreSQL'
}

Table devices {
  id varchar(64) [pk]
  name varchar(80) [not null]
  firmware_version varchar(20) [not null]
  last_heartbeat timestamp
}

Table telemetry_readings {
  id bigserial [pk]
  device_id varchar(64) [ref: > devices.id [delete: cascade], not null]
  metric_name varchar(40) [not null]
  value "double precision" [not null]
  recorded_at timestamp [not null]
}

Table alerts {
  id bigserial [pk]
  device_id varchar(64) [ref: > devices.id [delete: cascade], not null]
  severity varchar(15) [default: 'warning']
  message varchar(255) [not null]
  is_resolved boolean [default: false]
}`
  },

  // 10. HR & EMPLOYEE PAYROLL
  {
    id: 'tpl-hr-payroll',
    name: 'Human Resources & Employee Payroll Ledger',
    slug: 'hr-employee-payroll',
    category: 'hr',
    complexity: 'Advanced',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.89,
    reviewsCount: 84,
    clonesCount: 1820,
    author: {
      name: 'dbmaps System',
      title: 'Workforce Systems Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-hr',
      isSystem: true
    },
    description: 'Corporate organizational charts, departments, employee contracts, compensation pay stubs, tax withholdings, and PTO leave tracking.',
    highlights: [
      'Self-referential manager-to-employee corporate hierarchy',
      'Pay slip calculation with gross earnings and tax deductions',
      'Paid time off (PTO) request review workflows',
      'Department cost center assignments'
    ],
    tables: [
      {
        id: 'tbl-departments',
        name: 'departments',
        headerColor: '#3b82f6',
        x: 60,
        y: 80,
        note: 'Business functional divisions.',
        columns: [
          { name: 'id', type: 'serial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Department ID' },
          { name: 'name', type: 'varchar(80)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Department name' },
          { name: 'cost_center', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'Budget accounting code' }
        ]
      },
      {
        id: 'tbl-employees',
        name: 'employees',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'Staff profiles and reporting lines.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Employee ID' },
          { name: 'department_id', type: 'integer', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to departments.id' },
          { name: 'first_name', type: 'varchar(60)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'First name' },
          { name: 'last_name', type: 'varchar(60)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Last name' },
          { name: 'job_title', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Position' },
          { name: 'salary_usd', type: 'decimal(12,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Annual base' }
        ]
      },
      {
        id: 'tbl-paystubs',
        name: 'paystubs',
        headerColor: '#8b5cf6',
        x: 440,
        y: 380,
        note: 'Monthly salary disbursement statements.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Paystub ID' },
          { name: 'employee_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to employees.id' },
          { name: 'pay_period_end', type: 'date', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Period date' },
          { name: 'gross_amount', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Pre-tax pay' },
          { name: 'net_amount', type: 'decimal(10,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Deposited take-home' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-hr-1',
        fromTable: 'employees',
        fromColumn: 'department_id',
        toTable: 'departments',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      },
      {
        id: 'rel-hr-2',
        fromTable: 'paystubs',
        fromColumn: 'employee_id',
        toTable: 'employees',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project HR_Payroll {
  database_type: 'PostgreSQL'
}

Table departments {
  id serial [pk]
  name varchar(80) [unique, not null]
  cost_center varchar(20) [unique, not null]
}

Table employees {
  id uuid [pk]
  department_id integer [ref: > departments.id, not null]
  first_name varchar(60) [not null]
  last_name varchar(60) [not null]
  job_title varchar(100) [not null]
  salary_usd decimal(12,2) [not null]
}

Table paystubs {
  id bigserial [pk]
  employee_id uuid [ref: > employees.id [delete: cascade], not null]
  pay_period_end date [not null]
  gross_amount decimal(10,2) [not null]
  net_amount decimal(10,2) [not null]
}`
  },

  // 11. REAL ESTATE MLS & PROPERTY LISTINGS
  {
    id: 'tpl-real-estate',
    name: 'Real Estate MLS & Property Management',
    slug: 'real-estate-mls-property',
    category: 'ecommerce',
    complexity: 'Intermediate',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.86,
    reviewsCount: 91,
    clonesCount: 2050,
    author: {
      name: 'dbmaps System',
      title: 'PropTech Platform Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-realestate',
      isSystem: true
    },
    description: 'Residential & commercial real estate listings, licensed real estate agents, buyer inquiry leads, and open house schedules.',
    highlights: [
      'Multi-unit property listings with bedrooms, bathrooms, and square footage',
      'Licensed realtor agent assignments',
      'Prospective buyer lead and inquiry tracking',
      'Price history audit logs tracking reductions'
    ],
    tables: [
      {
        id: 'tbl-agents',
        name: 'agents',
        headerColor: '#10b981',
        x: 60,
        y: 80,
        note: 'Listing brokers and sales agents.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Agent ID' },
          { name: 'full_name', type: 'varchar(100)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Agent name' },
          { name: 'license_id', type: 'varchar(50)', isPk: false, isFk: false, isNull: false, isUnique: true, note: 'State license' },
          { name: 'phone', type: 'varchar(25)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Contact phone' }
        ]
      },
      {
        id: 'tbl-properties',
        name: 'properties',
        headerColor: '#3b82f6',
        x: 440,
        y: 80,
        note: 'Physical real estate asset listings.',
        columns: [
          { name: 'id', type: 'uuid', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Property ID' },
          { name: 'agent_id', type: 'uuid', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to agents.id' },
          { name: 'address', type: 'varchar(255)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Street address' },
          { name: 'price', type: 'decimal(12,2)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'List price' },
          { name: 'bedrooms', type: 'smallint', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Bedrooms' },
          { name: 'square_feet', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Total area' },
          { name: 'status', type: 'varchar(20)', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'for_sale | pending | sold' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-re-1',
        fromTable: 'properties',
        fromColumn: 'agent_id',
        toTable: 'agents',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'RESTRICT'
      }
    ],
    dbml: `Project Real_Estate_MLS {
  database_type: 'PostgreSQL'
}

Table agents {
  id uuid [pk]
  full_name varchar(100) [not null]
  license_id varchar(50) [unique, not null]
  phone varchar(25) [not null]
}

Table properties {
  id uuid [pk]
  agent_id uuid [ref: > agents.id, not null]
  address varchar(255) [not null]
  price decimal(12,2) [not null]
  bedrooms smallint [not null]
  square_feet integer [not null]
  status varchar(20) [default: 'for_sale']
}`
  },

  // 12. SOCIAL NETWORK & FEED
  {
    id: 'tpl-social-feed',
    name: 'Social Network & Activity Feed',
    slug: 'social-network-feed',
    category: 'fintech', // or general/social
    complexity: 'Starter',
    dialect: 'postgres',
    tier: 'free',
    badge: 'dbmaps System',
    isSystem: true,
    isVerified: true,
    rating: 4.82,
    reviewsCount: 112,
    clonesCount: 3200,
    author: {
      name: 'dbmaps System',
      title: 'Distributed Social Graph Engine',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=dbmaps-social',
      isSystem: true
    },
    description: 'User profiles, social follower graphs, multimedia feed posts, comments, and post reactions.',
    highlights: [
      'Self-referential follow graph (follower_id -> following_id)',
      'Rich media feed posts with image URLs and text',
      'Threaded comments with cascade deletion rules',
      'Like and emoji reaction counts'
    ],
    tables: [
      {
        id: 'tbl-users',
        name: 'users',
        headerColor: '#3b82f6',
        x: 60,
        y: 80,
        note: 'Social user profiles.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'User ID' },
          { name: 'handle', type: 'varchar(30)', isPk: false, isFk: false, isNull: false, isUnique: true, note: '@handle' },
          { name: 'bio', type: 'varchar(160)', isPk: false, isFk: false, isNull: true, isUnique: false, note: 'User bio' }
        ]
      },
      {
        id: 'tbl-posts',
        name: 'posts',
        headerColor: '#10b981',
        x: 440,
        y: 80,
        note: 'User published posts.',
        columns: [
          { name: 'id', type: 'bigserial', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Post ID' },
          { name: 'author_id', type: 'bigint', isPk: false, isFk: true, isNull: false, isUnique: false, note: 'FK to users.id' },
          { name: 'content', type: 'text', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Status update' },
          { name: 'likes_count', type: 'integer', isPk: false, isFk: false, isNull: false, isUnique: false, note: 'Reactions' }
        ]
      }
    ],
    relationships: [
      {
        id: 'rel-soc-1',
        fromTable: 'posts',
        fromColumn: 'author_id',
        toTable: 'users',
        toColumn: 'id',
        cardinality: '1:N',
        onDelete: 'CASCADE'
      }
    ],
    dbml: `Project Social_Network {
  database_type: 'PostgreSQL'
}

Table users {
  id bigserial [pk]
  handle varchar(30) [unique, not null]
  bio varchar(160)
}

Table posts {
  id bigserial [pk]
  author_id bigint [ref: > users.id [delete: cascade], not null]
  content text [not null]
  likes_count integer [default: 0]
}`
  }
];
