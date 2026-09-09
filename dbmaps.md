# dbmaps — Modern Database Architecture & Schema Studio

> **Version**: 1.0.0  
> **Brand**: dbmaps  
> **Repository Name**: dbmaps  
> **Architecture**: Vue 3 (Composition API) + Express (Node.js) + Tailwind CSS + Firebase Firestore  
> **Live Routes**: `/` (Home & Features Landing), `/app` (Studio Workspace), `/privacy-policy`, `/terms-of-service`, `/dictionary` (Standalone Published Data Dictionary)

---

## 🤖 AI Agent Quick Context & Metadata

This section provides structured, machine-readable context for AI coding agents (Gemini, Claude, GPT, Antigravity) working on or integrating with the `dbmaps` codebase.

```json
{
  "system": "dbmaps",
  "archetype": "Database Schema Designer & Entity Relationship Studio",
  "frontend": {
    "framework": "Vue 3",
    "script_setup": true,
    "state_store": "src/stores/schemaStore.js",
    "styling": "Tailwind CSS v4",
    "editor": "CodeMirror 6 (@codemirror/state, @codemirror/view)",
    "icons": "lucide-vue-next",
    "brand_icons": "/public/icons/*.svg"
  },
  "backend": {
    "runtime": "Node.js (ESM)",
    "server": "server.js",
    "port": 3000,
    "gemini_sdk": "@google/genai",
    "gemini_model": "gemini-2.5-flash",
    "database": "Firebase Firestore"
  },
  "supported_dialects": [
    "postgres",
    "mysql",
    "sqlite",
    "mssql",
    "mariadb",
    "dbml"
  ],
  "routing_modes": {
    "/": "LandingPage.vue (Home & Interactive Showcase)",
    "/app": "Studio Workspace (Canvas, CodeEditor, Sidebar, Navbar)",
    "/privacy-policy": "LegalPage.vue (Privacy Policy)",
    "/terms-of-service": "LegalPage.vue (Terms of Service)",
    "?dictionary=<id>": "PublishedDictionaryView.vue (Standalone Data Dictionary)"
  }
}
```

---

## 🧭 System Overview & Core Philosophy

**dbmaps** is a professional, high-performance database schema visualization, design, and documentation platform. It blends a reactive visual Entity Relationship Diagram (ERD) canvas with a live bidirectional DBML v2 / SQL code editor and an AI-driven schema architect (**Presto AI**).

Key pillars:
1. **Zero-Lag Visual Canvas**: Smooth panning, zooming (10% to 250%), interactive table dragging, relationship routing with bezier or straight connectors, and topological crossing minimization.
2. **True Bidirectional Synchronization**: Code changes in the editor reflect instantly on the canvas; visual table edits, additions, and connection drawing synchronize seamlessly back to DBML.
3. **Enterprise Privacy & Security**: Server-side proxying for Gemini AI keys (`server.js`), full client-side parsing resilience, and zero leakage of database design data.
4. **Export & Portability**: Generates production-ready DDL scripts for PostgreSQL, MySQL, SQLite, and SQL Server, high-resolution SVG/PNG diagram exports, and comprehensive HTML data dictionaries.

---

## 💎 Features & Functions Catalog

### 1. Visual ERD Canvas (`src/components/Canvas.vue`, `TableCard.vue`, `RelationshipLine.vue`)
- **Table Cards**:
  - Color-coded headers with custom palette selection (Indigo, Emerald, Violet, Amber, Rose, Cyan, Slate).
  - Primary key (`PK`), Foreign key (`FK`), Unique (`UQ`), and Index badges.
  - In-place editing of table names, column names, data types, and default values.
  - Column note tooltips and inline table documentation notes.
  - Delete, clone, and jump-to-code quick actions.
- **Relationship Connectors**:
  - Drag-and-drop foreign key line drawing from column connector pins.
  - Cardinality indicators: One-to-One (`1 - 1`), One-to-Many (`1 - <`), and Many-to-Many (`< - >`).
  - Cascading rules display (`ON DELETE CASCADE`, `ON UPDATE RESTRICT`).
  - Interactive deletion and editing of foreign key references.
- **Canvas Viewport Tools**:
  - Infinite virtual grid with dot matrix pattern.
  - Fit-to-screen (`Zoom to Fit`) with automated bounding-box calculation.
  - Auto-layout engine using layer-based topological sorting to minimize relationship line crossings.
  - Interactive Minimap with draggable viewport rectangle.

### 2. Bidirectional Code Editor (`src/components/CodeEditor.vue`)
- **CodeMirror 6 Engine**:
  - Custom syntax highlighter for DBML (tables, columns, settings, relationships, notes).
  - Real-time linting, line numbers, bracket matching, and fold gutters.
  - Full debounce synchronization with the store (`syncCodeToVisual` and `syncVisualToCode`).
  - Dark/light mode dynamic theme switching.

### 3. Presto AI Schema Assistant (`src/components/AiGenModal.vue`, `server.js`)
- **Prompt to Production Schema**:
  - Generates comprehensive normalized database architectures from plain English prompts (e.g. *"Multi-tenant B2B SaaS billing engine with Stripe subscriptions, metered usage, and invoice audit trails"*).
  - Generates tables, primary keys, foreign key constraints, indexes, timestamps, and column documentation notes.
- **Refactoring & Schema Extension**:
  - Supports `New Schema` mode (fresh generation) and `Extend Existing` mode (appends non-destructive tables and relations).
- **Authentication & Onboarding Gate**:
  - Available exclusively to registered, signed-in users (Google SSO) to drive platform onboarding.
  - Guests clicking Presto AI from the navbar or landing page are prompted to sign in with Google to claim their 50,000 free monthly AI credits.
  - The redundant credit display has been removed from the top navigation bar and centralized neatly inside the AI Generator modal.
- **Backend Architecture & Metering**:
  - Secured via `/api/generate-schema` on `server.js` using `@google/genai` (`gemini-2.5-flash`) with server-side authentication validation.
  - Client sends prompt and dialect; server maintains secret `GEMINI_API_KEY` and enforces structured JSON generation schema.
  - Tier-based quota system (Free tier: 50,000 credits/month; Pro tier: 500,000 credits/month).

### 4. Multi-Dialect SQL & Custom DBML Engine (`src/utils/sqlImporter.js`, `src/utils/dbmlParser.js`, `src/utils/dbmlCodeMirror.js`)
- **Custom Client-Side DBML Engine (Zero External `@dbml/*` Dependencies)**:
  - **No `@dbml/*` packages**: Rather than relying on heavy external NPM packages (like `@dbml/core` or `@dbml/cli` from dbdocs/dbdiagram), `dbmaps` implements an in-house, zero-dependency client-side DBML parser, validator, and generator.
  - **Fault-Tolerant & Real-Time**: External AST packages often throw fatal exceptions on half-typed lines. The custom parser is resilient to incomplete states, typing pauses, and incremental changes during live canvas and code editing.
  - **Syntax Coverage**: Full support for DBML v2 constructs including:
    - Tables (`Table users as u { ... }`) and schemas (`public.orders`).
    - Columns, data types, and attribute settings (`[pk, increment, unique, not null, default: ...], note: '...'`).
    - References & Relationships: standalone `Ref: orders.user_id > users.id [delete: cascade]`, inline `[ref: > users.id]`, and cardinality symbols (`>` for 1:N, `-` for 1:1, `<>` for N:M).
    - Multi-line triple-quote documentation notes (`note: '''...'''`).
    - Graceful parsing of `Project`, `TableGroup`, `Enum`, and `indexes` blocks.
  - **CodeMirror 6 Custom Language Mode (`src/utils/dbmlCodeMirror.js`)**:
    - Custom `StreamLanguage` tokenizer providing syntax highlighting for DBML keywords, identifiers, types, relationship operators, and comments (`//`, `#`) across both dark and light themes.
  - **Interactive Validator (`validateDBML`)**:
    - Line-by-line linting and diagnostics that check for unmatched braces (`{}`), brackets (`[]`), unclosed strings, or orphaned table references with instant line markers.
  - **Attribution & Standard Credit to Holistics**:
    - DBML (Database Markup Language) was originally created and open-sourced by **Holistics** (the team behind [dbdiagram.io](https://dbdiagram.io) and [dbdocs.io](https://dbdocs.io)). `dbmaps` honors and attributes Holistics for creating this standard.
    - Dedicated interactive guide: `/learn-dbml` (`src/components/LearnDbmlPage.vue`) with a 5-minute interactive syntax guide, live playground snippets, and side-by-side SQL comparison.
- **SQL Importer**:
  - Automatic dialect detection analyzing syntax signatures (`SERIAL`, `AUTO_INCREMENT`, `IDENTITY`, `DATETIME`, backticks, square brackets, DBML keywords).
  - Robust tokenizer handling multi-line comments, inline comments (`--`, `/* */`), table constraints, and foreign key references.
- **Multi-Dialect Exporter**:
  - **PostgreSQL**: `CREATE TABLE`, `SERIAL` / `BIGSERIAL`, `UUID`, `VARCHAR`, `TIMESTAMP WITH TIME ZONE`, explicit `CONSTRAINT fk_... FOREIGN KEY`.
  - **MySQL**: `CREATE TABLE`, `AUTO_INCREMENT`, `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, backtick identifiers, table and column comments.
  - **SQLite**: Portable embedded syntax, `INTEGER PRIMARY KEY AUTOINCREMENT`, inline foreign keys.
  - **MS SQL Server**: `IDENTITY(1,1)`, bracketed identifiers `[dbo].[Table]`, clustered primary keys.
  - **DBML v2**: Clean, human-readable Database Markup Language export.

### 5. Interactive Data Dictionary (`src/components/DocsModal.vue`, `PublishedDictionaryView.vue`)
- **Comprehensive Documentation Engine**:
  - Automatically compiles all tables, columns, constraints, data types, and documentation notes into a searchable data dictionary.
  - Full-text search and table-of-contents navigation.
  - Generates standalone, self-contained HTML reports with embedded styles for offline sharing.
  - **Standalone Published Web View**: Shareable read-only link (`/dictionary?dictionary=<project-id>`) that renders directly for stakeholders without requiring an account or studio editing permissions.

### 6. Cloud Collaboration & Persistence (`src/stores/schemaStore.js`, `src/firebase.js`)
- **Firebase Firestore Integration**:
  - Real-time schema synchronization.
  - Google SSO authentication and frictionless guest mode.
  - Project hierarchy: multi-project workspace, folder categorization, project cloning, and soft deletion.
  - Project sharing with customizable permission levels (Read-Only vs. Editor).
- **Version Snapshotting (`src/components/VersionModal.vue`)**:
  - Instant point-in-time schema snapshots.
  - Compare historical versions and revert to previous states with one click.

### 7. Commercial Tiers & Payment Gateway (`src/components/BillingModal.vue`, `server.js`)
- **Tiers**:
  - **Free Tier**: Up to 3 active projects, 5 Presto AI schema generations/month, full SQL/DBML export.
  - **Pro Tier ($19/mo or 25,000 MMK)**: Unlimited projects, 200 AI generations/month, high-res PNG/SVG export, data dictionary publishing, priority cloud sync.
  - **Team Tier ($49/mo)**: Real-time team collaboration, unlimited AI generations, shared organization workspaces.
- **Payment Processing**:
  - Integrated with **AYA Pay PGW (Payment Gateway)** and **TallySale** for Southeast Asia / Myanmar and global billing.
  - Secure webhook callbacks, HMAC-SHA256 checksum verification, and instant tier unlocking upon payment confirmation.

### 8. Legal, Privacy & Terms (`src/components/LegalPage.vue`)
- **Privacy Policy (`/privacy-policy`)**: Complete GDPR & CCPA-compliant privacy policy outlining data collection, encryption in transit and at rest, and AI processing boundaries.
- **Terms of Service (`/terms-of-service`)**: Clear terms affirming that **users retain 100% intellectual property ownership** over all schemas, DDL scripts, and database models designed in dbmaps.

---

## 📁 Source Code Map

```text
dbmaps/
├── public/
│   ├── favicon.svg             # Official dbmaps vector emblem
│   └── icons/                  # High-resolution database brand vectors
│       ├── postgresql.svg      # Official PostgreSQL Slonik elephant
│       ├── mysql.svg           # Official MySQL Sakila dolphin
│       ├── sqlite.svg          # Official SQLite emblem
│       ├── mssql.svg           # Official Microsoft SQL Server emblem
│       ├── mariadb.svg         # Official MariaDB seal
│       └── dbml.svg            # Custom DBML v2 vector insignia
├── src/
│   ├── App.vue                 # Top-level route dispatcher (Home vs Studio vs Legal vs Docs)
│   ├── main.js                 # Vue 3 application bootstrapper
│   ├── firebase.js             # Firebase client SDK initialization & Firestore instance
│   ├── index.css               # Tailwind CSS v4 entrypoint
│   ├── components/
│   │   ├── LandingPage.vue     # Official Home Page & Feature Showcase (/)
│   │   ├── Navbar.vue          # Studio workspace navigation & tool actions (/app)
│   │   ├── Sidebar.vue         # Left drawer: Project list, folders, tables, relations, dialect
│   │   ├── Canvas.vue          # Interactive visual ERD canvas (pan, zoom, grid, connectors)
│   │   ├── TableCard.vue       # Draggable visual table node with field rows & connector pins
│   │   ├── RelationshipLine.vue# SVG bezier connector linking foreign keys
│   │   ├── CodeEditor.vue      # Split-screen CodeMirror 6 DBML editor
│   │   ├── Minimap.vue         # Draggable overview minimap
│   │   ├── AiGenModal.vue      # Presto AI prompt-to-schema modal
│   │   ├── ExportModal.vue     # Multi-format export dialog (SQL, DBML, PNG, SVG)
│   │   ├── ImportModal.vue     # SQL / DBML script import & sample loader
│   │   ├── DocsModal.vue       # Interactive Data Dictionary viewer & HTML exporter
│   │   ├── PublishedDictionaryView.vue # Standalone read-only data dictionary route
│   │   ├── BillingModal.vue    # Commercial tiers, TallySale & AYA PGW checkout
│   │   ├── ShareModal.vue      # Project collaboration link sharing & permissions
│   │   ├── VersionModal.vue    # Schema version snapshotting & rollback
│   │   ├── LegalPage.vue       # Privacy Policy & Terms of Service view
│   │   ├── LearnDbmlPage.vue   # Learn DBML guide, cheatsheet & Holistics attribution (/learn-dbml)
│   │   ├── LoadingScreen.vue   # Initial application loading & asset pre-fetch overlay
│   │   └── ToastContainer.vue  # Global feedback notification toasts
│   ├── stores/
│   │   └── schemaStore.js      # Central reactive store: projects, tables, lines, user, routes
│   └── utils/
│       ├── dbmlParser.js       # DBML syntax parser, validator & AST generator
│       ├── dbmlCodeMirror.js   # CodeMirror 6 custom DBML syntax highlighter mode
│       ├── sqlImporter.js      # SQL DDL dialect detection, tokenizer & importer
│       └── sampleSchemas.js    # Pre-built reference schemas (E-Commerce, SaaS, Social, Blog)
├── server.js                   # Node.js Express server: Gemini AI proxy, AYA PGW, static files
├── package.json                # Dependencies, npm scripts & build configuration
├── vite.config.ts              # Vite + Vue + Tailwind build configuration
├── firestore.rules             # Cloud Firestore security rules
└── metadata.json               # Google AI Studio application metadata
```

---

## 🔌 API & Integration Endpoints

All backend endpoints are routed through `server.js` running on port 3000:

### 1. `POST /api/generate-schema`
- **Purpose**: Generates or refactors DBML schemas using Gemini 2.5 Flash.
- **Payload**:
  ```json
  {
    "prompt": "Design an enterprise logistics tracking system",
    "dialect": "postgres",
    "currentSchema": "Table orders { id int [pk] }",
    "mode": "new"
  }
  ```
- **Response**:
  ```json
  {
    "dbml": "Table shipments {\n  id serial [pk]\n  tracking_number varchar\n}\n...",
    "explanation": "Created 5 normalized tables with shipment legs and audit logs."
  }
  ```

### 2. `POST /api/payment/aya/create-order`
- **Purpose**: Initiates an AYA Pay PGW checkout session for Pro or Team subscriptions.
- **Payload**: `{ "planId": "pro", "userId": "...", "currency": "MMK" }`
- **Response**: `{ "paymentUrl": "...", "merchOrderId": "..." }`

### 3. `POST /api/payment/aya/verify`
- **Purpose**: Validates payment checksum against AYA PGW secret key and upgrades user account.

---

## 🛠️ Instructions for AI Agents Working on `dbmaps`

When adding features or refactoring code in this repository, adhere to these guidelines:

1. **State Store Exclusivity**: All visual and schema data must flow through `src/stores/schemaStore.js`. Do not create secondary ad-hoc state managers.
2. **Synchronized Code & Visual State**: Whenever table attributes or relations are altered in code, call `syncCodeToVisual()` or `syncVisualToCode()` to preserve parity.
3. **No Frontend API Key Exposure**: Never place `GEMINI_API_KEY` or payment secret keys in client files (`src/*`). Keep all secrets in `server.js` and `.env.example`.
4. **Dialect Integrity**: When generating SQL, adhere to standard ANSI SQL or dialect-specific features supported in `dbmlParser.js` and `sqlImporter.js`.
5. **Brand Standards**: Keep the product name as **dbmaps** in lowercase/mixed style. Use authentic brand icons from `/public/icons/`.
