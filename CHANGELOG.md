# CHANGELOG

All notable changes, bug fixes, and architectural improvements to `dbmaps` are documented in this file.
This changelog is also visible in-app at [`/changelog`](/changelog) alongside the integrated community issue tracker.

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
