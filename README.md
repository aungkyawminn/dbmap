# dbmaps — Modern Database Architecture & Schema Studio

**dbmaps** is a modern, real-time database Entity Relationship Diagram (ERD) designer, DBML/SQL editor, and AI Schema Generator built with Vue 3, Express, Tailwind CSS, and Firebase. It provides a visual canvas for designing database schemas, writing DBML/SQL code, generating AI-powered ERDs with Gemini 2.5 Flash, and syncing projects seamlessly to cloud storage.

---

## 🌟 Key Features

- 🏠 **Dedicated Home & Feature Showcase (`/`)**: Discover capabilities, interactive feature tabs, and jump directly into sample schemas.
- 🎨 **Interactive Visual ERD Studio (`/app`)**: Pan, zoom, drag tables, inspect column types, view relationship connectors, and auto-arrange with topological crossing minimization.
- 📝 **Live DBML / SQL Editor**: Real-time syntax highlighting with CodeMirror 6, instant parsing, and bidirectional synchronization with the visual diagram canvas.
- ⚡ **Presto AI Schema Assistant**: Prompt-to-ERD database designer powered by server-side **Google Gemini 2.5 Flash**. Available for registered users (50,000 free monthly AI credits granted upon Google SSO sign-in). Guests are guided to sign in to activate access.
- 🏪 **Curated Schema Marketplace (`/marketplace`, `/templates`)**: 12+ production-grade database blueprints across Fintech, Multi-Tenant SaaS, Healthcare (HIPAA), Logistics, E-Commerce, and more, complete with one-click cloning and DBML snippet copying.
- 🌐 **Community Blueprints & Creator Publishing**: Developers can publish their schemas to the public marketplace with author attribution, architecture highlights, and category tagging.
- 🛡️ **Admin Moderation & System Blueprint Studio**: Comprehensive admin control hub to author official `dbmaps System` blueprints directly from canvas schemas, edit metadata, promote/demote submissions, and moderate content in real time.
- 👥 **Real-Time Multiplayer Collaboration**: Shareable live rooms with multi-user cursor tracking, active collaborator presence indicators, and synchronized canvas state via Firestore.
- 📖 **Interactive Data Dictionary (`/dictionary`)**: Generate comprehensive data dictionaries with search, markdown notes, HTML export, and shareable read-only published links.
- 📥 **DDL Import & Migration Engine**: Parse and import existing SQL DDL tables from **PostgreSQL**, **MySQL**, **Microsoft SQL Server**, and **DBML**.
- 🐘 **Multi-Dialect Database Engines**: Native support for **PostgreSQL**, **MySQL**, **SQLite**, **Microsoft SQL Server**, **MariaDB**, and **DBML v2** with authentic vector brand icons.
- 🧭 **Interactive Guided Tour**: Built-in visual walkthrough highlighting essential studio tools, canvas gestures, and code editor shortcuts.
- 📚 **Learn DBML Interactive Guide (`/learn-dbml`)**: Built-in syntax cheatsheet, syntax reference, and official Holistics DBML creator attribution.
- 📱 **Responsive Header & Smart "More" Menu**: Zero-overflow responsive top bar with grouped actions, mobile-friendly touch targets, and persistent quick-access tools.
- 🔒 **Secure Express Server Proxy**: `GEMINI_API_KEY` is kept safe on the server side (`server.js`) so client browsers never expose your API credentials.
- 🔄 **Real-Time Cloud Persistence**: Auto-syncs schemas, tables, and project states to Firebase Firestore with Google SSO authentication support.
- 🕒 **Version Control & History**: Track schema changes, create version snapshots, and revert to previous states whenever needed.
- 📁 **Project & Folder Management**: Organize schemas into folders, search, clone, or export to DBML, SQL DDL, HTML Data Dictionary, PNG, or SVG.
- 📜 **Privacy & Legal Pages (`/privacy-policy`, `/terms-of-service`)**: 100% intellectual property ownership retention for database designs.
- 🌓 **Light & Dark Mode**: Accessible UI designed with Tailwind CSS for both dark and light modes.

---

## 🔑 How to Configure `GEMINI_API_KEY`

### 1. In AI Studio Preview (This Workspace)

In AI Studio, environment variables are managed securely via the platform interface:

1. Click the **Gear / Settings icon** ⚙️ in the top right corner of the AI Studio workspace.
2. Navigate to **Environment Variables**.
3. Add a new variable:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: `Your actual Gemini API Key from Google AI Studio (https://aistudio.google.com/)`
4. Save the settings. The running container immediately injects `process.env.GEMINI_API_KEY` into `server.js` without exposing it to the front-end browser JavaScript!
5. Open the app preview, click the **Presto** button in the top navigation bar, enter a prompt (e.g. *"Food delivery app database"*), and click **Generate with AI**.

### 2. In Local Development / Self-Hosting

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set your key:
   ```env
   GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
   ```
3. Start the Express server:
   ```bash
   npm run dev
   ```

---

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API, `<script setup>`)
- **Backend Server**: Express.js (`server.js`) for server-side Gemini API proxying & static serving
- **State Management**: Reactive Vue Store (`/src/stores/schemaStore.js`)
- **Code Editor**: CodeMirror 6 with custom DBML syntax highlights
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide Icons (`lucide-vue-next`) & Vector Brand Icons (`/public/icons/`)
- **Database**: Firebase Firestore & Firebase Auth (Google SSO)
- **AI Integration**: `@google/genai` (Server-Side Gemini 2.5 Flash model)
- **Build Tooling**: Vite, TypeScript, Esbuild

---

## 📂 Project Structure

```text
├── server.js                   # Express server with /api/generate-schema endpoint & Vite middleware
├── dbmaps.md                   # Complete architecture & agent operational reference manual
├── ROADMAP.md                  # Product & Revenue Strategy, Phase milestones & marketplace vision
├── public/                     # Static assets, favicon, and database brand SVG icons
├── src/
│   ├── components/             # UI Components
│   │   ├── Canvas.vue          # Interactive visual ERD canvas (pan, zoom, topological layout)
│   │   ├── CodeEditor.vue      # CodeMirror 6 DBML editor with live syntax diagnostics
│   │   ├── Navbar.vue          # Responsive header bar with "More" menu and quick tools
│   │   ├── Sidebar.vue         # Project tree, tables explorer, and version history
│   │   ├── MarketplacePage.vue # Standalone Schema Marketplace & Blueprints catalog
│   │   ├── MarketplaceModal.vue# In-studio blueprint drawer & quick-clone engine
│   │   ├── SubmitToMarketplaceModal.vue # Blueprint authoring & editing modal
│   │   ├── AdminDashboardModal.vue # Admin control hub (Blueprints, users, AI credits, logs)
│   │   ├── DataDictionaryPage.vue  # Interactive dictionary with public sharing & export
│   │   ├── LearnDbmlPage.vue   # Interactive DBML syntax reference & guide
│   │   ├── OnboardingTour.vue  # Guided visual studio walkthrough
│   │   ├── LandingPage.vue     # Modern landing page with interactive showcase
│   │   └── ShareModal.vue      # Live multiplayer collaboration & room sharing
│   ├── stores/
│   │   └── schemaStore.js      # Central reactive state management, Firestore & AI handlers
│   ├── utils/                  # DBML & SQL parser utilities, sample schemas & export engines
│   ├── firebase.js             # Firebase initialized app, auth, & Firestore instance
│   ├── App.vue                 # Root layout & route dispatcher component
│   └── main.js                 # Vue entry point
├── .env.example                # Environment variable template
├── firebase-applet-config.json # Firebase project environment configuration
├── firestore.rules              # Firestore security rules with marketplace and role rules
├── index.html                  # Main HTML template
├── package.json                # Clean dependencies and npm scripts
└── vite.config.ts              # Vite configuration
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** / **pnpm** / **yarn**

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd dbmaps
npm install
```

### 2. Environment Configuration

Create a `.env` file at the root of the project (refer to `.env.example`):

```env
# Server-side Gemini API key for Presto AI Schema Assistant
GEMINI_API_KEY="your-gemini-api-key"

# Application hosting URL
APP_URL="http://localhost:3000"
```

### 3. Run Development Server

Start the Express backend and Vite development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Firebase Setup & Deployment

**dbmaps** uses Firebase Firestore for persistent cloud storage and Firebase Authentication for user accounts.

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `dbmaps`.
3. Enable **Firestore Database** in test or production mode.
4. Enable **Authentication** and add **Google** as a Sign-in Provider.

### 2. Configure Firebase in the App
Replace the Firebase configuration in `src/firebase.js` or `firebase-applet-config.json` with your project credentials.

---

## 📦 Building & Deploying to Production

```bash
# Build Vite static assets
npm run build

# Start production server
npm start
```

---

## 🧪 Scripts & Quality Checks

- `npm run dev` — Launch Express backend + Vite dev server on port 3000
- `npm run build` — Build static production bundle to `dist/`
- `npm run start` — Run production server via `node server.js`
- `npm run lint` — Perform TypeScript compilation checks

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

