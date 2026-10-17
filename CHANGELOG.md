# CHANGELOG

All notable changes, bug fixes, and architectural improvements to `dbmaps` are documented in this file.
This changelog is also visible in-app at [`/changelog`](/changelog) alongside the integrated community issue tracker.

---

## [v1.5.0] - 2026-10-14

### Added
- **Academic & High-Definition Diagram Exporter (`iss-110`)**: Added complete export system for downloading schema diagrams as HD versions of JPG, PNG, PDF, and SVG for Computer Science students and researchers.
  - **HD PNG (.png)**: Lossless raster with customizable scale multiplier (1x standard 1080p, 2x Retina 300 DPI for academic papers, 3x Ultra-HD 4K). Supports transparent or solid paper white background.
  - **HD JPG (.jpg)**: High-resolution compressed image with clean background, optimal for student portals and coursework submissions with upload size limits.
  - **Vector SVG (.svg)**: Pure vector XML with exact bezier/orthogonal foreign key paths, cardinality badges, table entity cards, and embedded fonts. Never pixelates at any print scale or zoom level.
  - **Academic PDF (.pdf)**: Publication-ready formal report formatted for A4 or US Letter paper with Landscape or Portrait orientation, centered high-res diagram, title, and metadata header.
  - **Academic Report Header Banner**: Optional customizable banner displaying Project Title, SQL Dialect, Generation Date, Table and Relationship metrics, and custom Course / Author note (e.g. "CS401 Database Systems - Final Project ERD").
  - **Copy Image to Clipboard**: Direct one-click PNG copy to clipboard for immediate pasting into Microsoft Word, Google Docs, Overleaf LaTeX, and PowerPoint slides.
  - **Unified Export Center Modal**: Redesigned `ExportModal` with segmented navigation between "Visual Diagram (HD)" and "SQL & DBML Scripts", live interactive SVG preview, dimensions calculator, and quick-download pills.
  - **Canvas & Navbar Shortcuts**: Added "Export Diagram" button on the canvas top toolbar and direct link under Navbar "Import & Export" menu.

---

## [v1.4.6] - 2026-10-14

### Fixed
- **Google SSO Popup Concurrency & Cancelled-Popup Error (`iss-109`)**: Resolved `Google Auth Error: FirebaseError: Firebase: Error (auth/cancelled-popup-request)` when clicking Google sign in.
  - Implemented module-level concurrency locking (`isAuthOperationInProgress`) and reactive `state.isLoggingIn` state across the application.
  - Added disabled states and interactive loading spinners to "Sign In with Google" buttons in `AuthModal`, `Navbar`, `LandingPage`, `AiGenModal`, and `ChangelogPage`, preventing rapid multi-clicks or double-clicks from spawning concurrent popups.
  - Suppressed non-fatal popup cancellations (`auth/cancelled-popup-request`, `auth/popup-closed-by-user`, `auth/user-cancelled`) from logging console errors or displaying intrusive error toasts.
  - Removed premature `syncActiveProjectToFirestore()` call from `loginWithGoogle()`, allowing `onAuthStateChanged` to cleanly initialize and subscribe to user cloud projects without race conditions.
  - Wrapped Firestore write error reporting in `syncActiveProjectToFirestore` to avoid unhandled rejection popups.

---

## [v1.4.5] - 2026-10-14

### Fixed
- **Post-Login Firestore Write Permission Error on `projects/proj-1` (`iss-108`)**: Resolved `Firestore Error: {"error":"Missing or insufficient permissions...","operationType":"write","path":"projects/proj-1"}` when users sign in via Google SSO.
  - Added `isSampleProjectId()` helper to guard built-in static templates (`proj-1`, `proj-2`). Pristine sample schemas are preserved locally in browser memory and are never written to Firestore under static IDs.
  - Implemented Copy-on-Write auto-forking: when an authenticated developer edits a sample blueprint, the system automatically forks it into a fresh, unique user-owned project ID (`proj-xxx`) with their own `ownerUid`, ensuring clean document isolation and zero permission conflicts.
  - Fixed active project watcher transition flush: switching from a guest sample project to the user's authenticated cloud database no longer triggers an auto-sync write on the old sample schema ID.
  - Pruned sample templates when loading authenticated cloud projects in `subscribeToFirestoreProjects` to maintain strict workspace isolation.

---

## [v1.4.4] - 2026-10-11

### Fixed
- **Sign Out ReferenceError (`iss-107`)**: Fixed unhandled exception `"Sign Out Error: stopPresenceTracking is not defined"` when signing out of Google SSO. Declared and exported `stopPresenceTracking()` in `src/stores/schemaStore.js` to ensure clean disconnection from live rooms, unbinding of active presence records, and immediate rollback to guest mode.
- **Firestore Permission Rejections on Guest Sync (`iss-106`)**: Fixed `Firestore Error: {"error":"Missing or insufficient permissions...","operationType":"write","path":"projects/proj-1"}`. `syncActiveProjectToFirestore` now checks for guest / unauthenticated status before attempting Firestore writes, safely caching changes to browser `localStorage` and preventing security rule violations.
- **Vite Client HMR WebSocket Transport (`iss-105`)**: Resolved uncaught WebSocket connection errors (`createWebSocketModuleRunnerTransport/connect/@vite/client:454:22`) within Google Cloud preview container reverse proxies. Set `hmr: false` in `server.js` and `vite.config.ts`, and added global error suppression in `index.html` to silence benign connection drops in iframe sandboxes.

---

## [v1.4.3] - 2026-09-25

### Added & Improved
- **Sidebar Quick-Filter Ergonomics (`iss-104`)**: Redesigned database filter elements to compact micro-pills (<24px height), recovering over 80% vertical canvas real estate for tables.
- **Search Clear Triggers**: Added one-click [X] clear buttons to database Explorer and Table field search inputs.
- **Automated Folder Expansion**: Selecting a database filter pill automatically expands the corresponding folder accordion.

---

## [v1.4.2] - 2026-09-24

### Fixed & Added
- **Accidental Drag Initiation on Click (`iss-103`)**: Replaced root container draggable handlers with dedicated `GripVertical` drag handles to prevent accidental dimming lockups when expanding or collapsing database folders.
- **Cross-Database Schema Migration (`iss-102`)**: Added drag-and-drop support for moving schema cards between different database groups and reordering schemas within the same group.
- **Global Event Bus Cleanup**: Added Escape key and mouseup listeners to abort dragged states cleanly.

---

## [v1.4.1] - 2026-09-24

### Fixed
- **Filter Scroll Accessibility (`iss-101`)**: Resolved quick filter pill truncation on standard desktop mouse setups with improved flex-wrapping.

---

## [v1.3.0] - 2026-09-15

### Added
- **Nullable Cardinality Syntax (`iss-100`)**: Support for nullable foreign key cardinality operators (`>?`) in DBML export and parsing.

---

## [v1.0.0] - 2026-08-10

### Initial Launch
- Visual infinite pan/zoom canvas, CodeMirror 6 DBML editor, Presto AI Schema Assistant powered by Gemini 2.5 Flash, multi-dialect support (PostgreSQL, MySQL, SQLite, SQL Server, MariaDB), and Schema Marketplace.
