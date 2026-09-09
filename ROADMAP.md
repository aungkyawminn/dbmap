# dbmaps — Product & Revenue Roadmap: Schema Marketplace

## 🌟 Executive Vision & Strategic Opportunity

`dbmaps` is evolving from a collaborative visual database diagramming tool into the **definitive community hub and marketplace for database architectures**. 

In modern software development, data modeling remains one of the highest-friction, highest-risk phases of engineering. Flawed data models lead to expensive migrations, data anomalies, and performance bottlenecks. A high-quality, production-tested database schema saves engineering teams days of research and prevents costly architectural debt.

By building a **Curated & Creator-Driven Schema Marketplace**, `dbmaps` creates:
1. **Network Effects & Viral Acquisition**: Community architects publish and share schemas, attracting developers looking for solutions.
2. **Diversified Revenue Streams**: Micro-transaction sales of verified production blueprints alongside subscription MRR.
3. **Ecosystem Stickiness**: Users who clone a template immediately begin editing in `dbmaps`, creating a frictionless path to Pro and Team upgrades.

---

## 💰 Monetization & Revenue Stream Architecture

The marketplace operates on a **Freemium Hybrid Model**, balancing viral developer adoption with premium monetization:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        dbmaps Schema Ecosystem                         │
├────────────────────────────┬───────────────────────────────────────────┤
│ 🆓 Community Starters      │ • $0 (100% Free Forever)                  │
│    (Top-of-Funnel SEO)     │ • Clean baseline starters & tutorials     │
│                            │ • Blog, E-commerce, Auth, Todo, Notes     │
├────────────────────────────┼───────────────────────────────────────────┤
│ 💎 Verified Blueprints     │ • $9 – $29 one-time micro-transaction    │
│    (Direct Sales)          │ • Enterprise-grade, deeply normalized     │
│                            │ • Fintech, HIPAA, Multi-tenant, Logistics │
├────────────────────────────┼───────────────────────────────────────────┤
│ 👑 Pro / Team Perk         │ • Included in Pro ($19/mo) & Team ($49/mo)│
│    (SaaS MRR Engine)       │ • Unlimited clones of curated blueprints  │
│                            │ • Commercial use & priority exports       │
├────────────────────────────┼───────────────────────────────────────────┤
│ 🏢 Sponsored Blueprints    │ • B2B developer relations partnerships    │
│    (Cloud Vendor Grants)   │ • Sponsored by Supabase, Neon, Cloudflare │
└────────────────────────────┴───────────────────────────────────────────┘
```

### 1. Direct Creator Sales (70/30 Split)
- Independent database architects, DBA consultants, and software engineers publish specialized domain models.
- **Creator Share**: 70% – 80% paid directly to the creator.
- **Platform Fee**: 20% – 30% retained by `dbmaps` for hosting, indexing, validation, and transaction handling.
- Integrated with **AYA Pay PGW** (for Southeast Asia / Myanmar) and global payment processors.

### 2. Subscription Conversion Catalyst (Pro / Team Tier)
- Active Pro ($19/mo) and Team ($49/mo) members receive access to all or selected verified blueprints as part of their plan.
- Increases the perceived tangible value of recurring subscriptions.

### 3. B2B & Sponsored Blueprints
- Infrastructure platforms (e.g., PostgreSQL vendors, serverless SQL providers like Neon or Turso, Edge database engines) sponsor official reference architectures to demonstrate their specialized database features.

---

## 🛡️ Quality Bar & "Verified by dbmaps" Standard

To maintain developer trust and avoid low-quality sprawl, all marketplace schemas adhere to strict engineering benchmarks:

1. **Strict Referential Integrity**: Every foreign key must declare explicit cardinality (`1:1`, `1:N`, `N:M`) and referential actions (`ON DELETE CASCADE`, `RESTRICT`, or `SET NULL`).
2. **Normalized Data Models**: Tables must follow 3NF (Third Normal Form) conventions unless intentional denormalization for OLAP/reporting is explicitly documented.
3. **Comprehensive Documentation**: Every table and critical column must include clear `note:` annotations explaining its business purpose, populating the automated Data Dictionary.
4. **Multi-Dialect Portability**: Schemas are tested and verified across PostgreSQL, MySQL, SQLite, MS SQL Server, and DBML.
5. **Auditing & Timestamps**: System entities require `created_at`, `updated_at`, and audit identifiers where applicable.

---

## 🗺️ Three-Phase Rollout Plan

### Phase 1: Curated Template Library (MVP) — [Current Focus]
- [x] **Curated Domain Blueprints**: Launch with 12+ production-ready architectures spanning key software verticals:
  - Fintech & Double-Entry Ledger
  - Multi-Tenant B2B SaaS Subscriptions & Quotas
  - Healthcare & Telemedicine EMR (HIPAA Compliant)
  - Global Logistics & Fleet Dispatch
  - Multi-Vendor E-Commerce & Marketplace
  - Project Management & Agile Sprint Engine
  - Hospitality & Hotel Booking Engine
  - Learning Management System (LMS)
  - IoT Smart Meter & Telemetry Engine
  - Human Resources & Payroll Engine
  - Real Estate MLS & Property Listings
  - Social Network & Content Feed
- [x] **One-Click Clone & Launch**: Instant instantiation into the user's private workspace with pre-calculated visual canvas coordinates and color themes.
- [x] **Interactive Discovery UI**:
  - Filter by category (Fintech, SaaS, Healthcare, Logistics, etc.)
  - Filter by SQL dialect (Postgres, MySQL, SQLite, MSSQL, DBML)
  - Live table and relationship counters, complexity tags, and DBML code preview
  - Modal in Studio (`Navbar` / `Sidebar`) and dedicated `/marketplace` & `/templates` routes.
- [x] **Copy DBML Snippets**: Instant one-click copy of the raw DBML code for documentation.

---

### Phase 2: Community Submissions & Creator Profiles — [Implemented]
- [x] **"Publish to Community" Flow**: In-app modal and sidebar action allowing users to publish their created database architectures to the public marketplace.
- [x] **dbmaps System vs. Community Architecture**: Current built-in templates are flagged as official `dbmaps System` generated blueprints, distinguished by high-contrast system badges from user-submitted community models.
- [x] **Live Firestore Submissions Engine**: Real-time Firestore synchronization (`marketplace_templates` collection) via `onSnapshot` with secure write rules and graceful offline resilience.
- [x] **Source Filtering & Live Counters**: Instant filtering between "All Blueprints", "⚡ dbmaps System", and "🌐 Community Submissions" with live counter badges.
- [x] **Author Attribution & Management**: Dynamic author avatar, job title, architectural highlights, and creator-level unpublish/delete controls for submitted schemas.
- [x] **Multi-Surface Access**: Accessible from the Studio Sidebar project menus, Studio Navigation bar, `MarketplaceModal.vue`, and standalone `/marketplace` route.
- [x] **Admin Moderation & System Blueprint Management**:
  - Full-featured **Marketplace Blueprints Hub** in Admin Dashboard with live stats (total, system, community, dialects).
  - **Create Official System Blueprints**: Super-admin can generate official verified blueprints directly from active canvas schemas.
  - **Live Blueprint Editing**: Modify blueprint metadata (title, category, dialect, tier, tags) and sync latest table definitions from active projects.
  - **Status Promotion & Demotion**: One-click toggling between `dbmaps System` and `Community` blueprints with live Firestore persistence.
  - **Schema Moderation & Purge**: Delete inappropriate submissions and manage public blueprint catalog.
- [x] **Responsive Studio Header & "More" Hub**: Streamlined top navigation bar with smart breakpoint collapsing, dedicated "More" tools menu, and zero-overflow layout.
- [x] **Presto AI Authentication Gate & Streamlined Header**:
  - Restricted Presto AI Schema Assistant to authenticated accounts to drive developer onboarding.
  - Guests clicking Presto AI are prompted to sign in with Google, highlighting the 50,000 free monthly AI credit grant.
  - Removed redundant credit counter badge from the top header bar, centralizing credit metering cleanly inside the AI Generator dialog.
  - Reinforced `/api/generate-schema` backend endpoint with strict authentication checks.
- [ ] **Community Engagement & Reviews**: Upvoting, user ratings, star counts, and architectural discussion threads.

---

### Phase 3: Creator Monetization & Paid Transactions
- [ ] **Pricing Configuration**: Creators can set schemas as *Free* or *Paid* ($9, $19, $29).
- [ ] **Integrated Checkout**: Micro-transactions powered by AYA Pay PGW and Stripe.
- [ ] **Creator Payout Dashboard**: Earnings tracking, payout thresholds, and automated payouts.
- [ ] **Commercial Licensing Agreement**: Clear digital licensing terms granting users perpetual rights to build applications using purchased schemas without redistributing raw templates.

---

## 📊 Success Metrics & KPIs
- **Template Clone Rate**: % of new users who start from a marketplace template vs. a blank project.
- **Time-to-First-Export**: Speed at which a user creates/exports a working SQL script.
- **Conversion to Pro**: % of template users who upgrade to paid subscriptions.
- **Creator Retention**: Number of active community architects submitting models.
