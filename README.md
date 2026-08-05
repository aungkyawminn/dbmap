# dbmap — Collaborative Database Schema Designer

**dbmap** is a modern, real-time database Entity Relationship Diagram (ERD) designer and DBML/SQL editor built with Vue 3, Tailwind CSS, and Firebase. It provides a visual canvas for designing database schemas, writing DBML/SQL code, generating AI-powered schemas with Gemini, and syncing projects seamlessly to cloud storage.

---

## 🌟 Key Features

- 🎨 **Interactive Visual ERD Canvas**: Pan, zoom, drag tables, inspect column types, and view relationship connectors (one-to-one, one-to-many, many-to-many).
- 📝 **Live DBML / SQL Editor**: Real-time syntax highlighting with CodeMirror, instant parsing, and bidirectional synchronization with the visual diagram canvas.
- ⚡ **AI Schema Assistant**: Generate complete database schemas or alter existing ones using Gemini AI prompts.
- 🔄 **Real-Time Cloud Persistence**: Auto-syncs schemas, tables, and project states to Firebase Firestore with Google SSO authentication support.
- 🕒 **Version Control & History**: Track schema changes, create version snapshots, and revert to previous states whenever needed.
- 📁 **Project & Folder Management**: Organize schemas into folders, search, clone, or export to DBML, SQL DDL, PNG, or SVG.
- 🌓 **Light & Dark Mode**: Modern, accessible UI designed with Tailwind CSS for both dark and light modes.

---

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API, Reactivity)
- **State Management**: Reactive Vue Store (`/src/stores/schemaStore.js`)
- **Code Editor**: CodeMirror 6 with custom DBML syntax highlights
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide Icons (`lucide-vue-next`)
- **Backend & Database**: Firebase Firestore & Firebase Auth (Google SSO)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Build Tooling**: Vite, TypeScript, Esbuild

---

## 📂 Project Structure

```text
├── src/
│   ├── components/         # UI Components (Navbar, CodeEditor, Canvas, Modals, etc.)
│   ├── stores/
│   │   └── schemaStore.js  # Central reactive state management & Firestore auto-sync logic
│   ├── utils/              # DBML & SQL parser utilities
│   ├── firebase.js         # Firebase initialized app, auth, & Firestore instance
│   ├── App.vue             # Root layout component
│   └── main.js             # Vue entry point
├── firebase-applet-config.json # Firebase project environment configuration
├── firestore.rules          # Firestore security rules
├── index.html              # Main HTML template
├── package.json            # Dependencies and npm scripts
└── vite.config.ts          # Vite configuration
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
cd dbflow
npm install
```

### 2. Environment Configuration

Create a `.env` file at the root of the project (refer to `.env.example`):

```env
# Optional Gemini API key for AI Schema Generation
GEMINI_API_KEY="your-gemini-api-key"

# Application hosting URL (used for OAuth redirects/callbacks)
APP_URL="http://localhost:3000"
```

### 3. Run Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔥 Firebase Setup & Deployment

**dbmap** uses Firebase Firestore for persistent cloud storage and Firebase Authentication for user accounts.

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `dbflow` (or your preferred project name).
3. Enable **Firestore Database** in test/production mode.
4. Enable **Authentication** and add **Google** as a Sign-in Provider.

### 2. Configure Firebase in the App
Replace the Firebase configuration in `src/firebase.js` or `firebase-applet-config.json` with your project's credentials:

```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### 3. Firestore Security Rules
Deploy `firestore.rules` to secure your Firestore database:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 📦 Building & Deploying to Production

### Option A: Firebase Hosting

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in and initialize Firebase Hosting:
   ```bash
   firebase login
   firebase init hosting
   ```
   - Select your project (`dbflow`)
   - Set public directory to `dist`
   - Configure as single-page app: **Yes**

3. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Option B: Cloud Run / Docker

1. Build the static production bundle:
   ```bash
   npm run build
   ```
2. Serve using Node/Express or Nginx on port `3000`.

---

## 🧪 Scripts & Quality Checks

- `npm run dev` — Launch Vite development server on port 3000
- `npm run build` — Build production bundle to `dist/`
- `npm run preview` — Preview the production build locally
- `npm run lint` — Perform TypeScript compilation checks

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
