import { reactive, computed, watch } from 'vue';
import { SAMPLE_PROJECTS, INITIAL_FOLDERS } from '../utils/sampleSchemas.js';
import { generateDBML, parseDBML, exportToSQL } from '../utils/dbmlParser.js';
import {
  auth,
  googleProvider,
  db,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot
} from '../firebase.js';

// Load stored theme
const storedDark = localStorage.getItem('db_schema_dark');
const isDarkInitial = storedDark !== null ? storedDark === 'true' : true;

export const state = reactive({
  isDarkMode: isDarkInitial,
  isSidebarCollapsed: true,
  activeTab: 'tables', // 'explorer' | 'tables' | 'relationships' | 'history' | 'settings'
  viewMode: 'split', // 'split' | 'canvas' | 'editor'
  editorWidth: 420, // width in pixels for split view editor pane
  
  folders: [...INITIAL_FOLDERS],
  projects: [...SAMPLE_PROJECTS],
  activeProjectId: 'proj-1',
  
  zoomLevel: 1.0,
  panOffset: { x: 0, y: 0 },
  
  selectedTableId: null,
  selectedRelId: null,
  
  // Realtime collaboration state
  roomCode: 'ERD-8921-LIVE',
  isCollaborating: true,
  collaborators: [
    {
      id: 'guest',
      name: 'You (Host)',
      email: 'guest@dbmap.io',
      color: '#3b82f6',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      role: 'Owner'
    }
  ],
  
  // User Authentication State
  currentUser: {
    id: 'guest',
    name: 'Guest Developer',
    email: 'guest@dbmap.io',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    isLoggedIn: false,
    provider: null
  },
  
  // UI Modals
  modals: {
    export: false,
    share: false,
    auth: false,
    version: false,
    newTable: false,
    newRel: false,
    newProject: false,
    newFolder: false,
    docs: false,
    aiGen: false
  },

  toasts: []
});

// Get Active Project
export const activeProject = computed(() => {
  const proj = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  if (proj) {
    if (!proj.history) proj.history = [];
    if (!proj.dialect) proj.dialect = 'postgres';
    if (!proj.tables) proj.tables = [];
    if (!proj.relationships) proj.relationships = [];
  }
  return proj;
});

// Sync current project schema state to Firestore
export async function syncActiveProjectToFirestore() {
  const proj = activeProject.value;
  if (!proj) return;
  try {
    const docRef = doc(db, 'projects', proj.id);
    await setDoc(docRef, {
      id: proj.id,
      folderId: proj.folderId || 'folder-1',
      name: proj.name,
      description: proj.description || '',
      dialect: proj.dialect || 'postgres',
      tables: JSON.parse(JSON.stringify(proj.tables || [])),
      relationships: JSON.parse(JSON.stringify(proj.relationships || [])),
      history: JSON.parse(JSON.stringify(proj.history || [])),
      ownerUid: state.currentUser.id || 'guest',
      ownerEmail: state.currentUser.email || 'guest@dbmap.io',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.warn('Firestore sync note:', e.message);
  }
}

// Toast helper
export function addToast(title, message, type = 'info') {
  const id = Date.now() + Math.random();
  state.toasts.push({ id, title, message, type });
  setTimeout(() => {
    state.toasts = state.toasts.filter(t => t.id !== id);
  }, 3500);
}

// Subscribe to Firestore projects to sync account schemas
let unsubscribeProjects = null;

function subscribeToFirestoreProjects() {
  if (unsubscribeProjects) {
    unsubscribeProjects();
    unsubscribeProjects = null;
  }

  try {
    const projectsCol = collection(db, 'projects');
    unsubscribeProjects = onSnapshot(projectsCol, (snapshot) => {
      const remoteProjects = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.id) {
          remoteProjects.push({
            id: data.id,
            folderId: data.folderId || 'folder-1',
            name: data.name || 'Untitled Schema',
            description: data.description || '',
            dialect: data.dialect || 'postgres',
            tables: data.tables || [],
            relationships: data.relationships || [],
            history: data.history || [],
            ownerUid: data.ownerUid || 'guest',
            ownerEmail: data.ownerEmail || '',
            updatedAt: data.updatedAt || new Date().toISOString()
          });
        }
      });

      if (remoteProjects.length > 0) {
        remoteProjects.forEach(rp => {
          const idx = state.projects.findIndex(p => p.id === rp.id);
          if (idx !== -1) {
            // Update existing project if remote is newer or for inactive projects
            const localProj = state.projects[idx];
            if (rp.id !== state.activeProjectId || new Date(rp.updatedAt) > new Date(localProj.updatedAt || 0)) {
              state.projects[idx] = rp;
            }
          } else {
            // Add project loaded from Firestore
            state.projects.push(rp);
          }
        });
      }
    }, (err) => {
      console.warn('Firestore snapshot note:', err.message);
    });
  } catch (err) {
    console.warn('Firestore listener setup error:', err.message);
  }
}

// Firebase Auth Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    state.currentUser = {
      id: user.uid,
      name: user.displayName || 'Developer',
      email: user.email || '',
      avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isLoggedIn: true,
      provider: 'google'
    };
    state.collaborators = [
      {
        id: user.uid,
        name: user.displayName ? `${user.displayName} (You)` : 'You (Host)',
        email: user.email || '',
        color: '#3b82f6',
        avatar: state.currentUser.avatar,
        role: 'Owner'
      }
    ];

    // Transfer guest project ownership to logged in user
    state.projects.forEach(p => {
      if (p.ownerUid === 'guest') {
        p.ownerUid = user.uid;
        p.ownerEmail = user.email || '';
      }
    });

    syncActiveProjectToFirestore();
    subscribeToFirestoreProjects();
  } else {
    state.currentUser = {
      id: 'guest',
      name: 'Guest Developer',
      email: 'guest@dbmap.io',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      isLoggedIn: false,
      provider: null
    };
    state.collaborators = [
      {
        id: 'guest',
        name: 'You (Host)',
        email: 'guest@dbmap.io',
        color: '#3b82f6',
        avatar: state.currentUser.avatar,
        role: 'Owner'
      }
    ];
    subscribeToFirestoreProjects();
  }
});

// Immediately trigger initial sync on store creation
setTimeout(() => {
  syncActiveProjectToFirestore();
  subscribeToFirestoreProjects();
}, 300);

// Deeply watch active project changes and auto-sync to Firestore
let syncTimeout = null;
watch(
  () => activeProject.value,
  () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncActiveProjectToFirestore();
    }, 1000);
  },
  { deep: true }
);

// Login with Google SSO
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    addToast('Google SSO Success', `Welcome back, ${result.user.displayName || 'User'}!`, 'success');
    state.modals.auth = false;
    await syncActiveProjectToFirestore();
  } catch (err) {
    console.error('Google Auth Error:', err);
    addToast('Authentication Failed', err.message || 'Google sign-in popup error', 'error');
  }
}

// Sign out
export async function logoutUser() {
  try {
    await signOut(auth);
    addToast('Logged Out', 'Signed out from session', 'info');
    state.modals.auth = false;
  } catch (err) {
    addToast('Sign Out Error', err.message, 'error');
  }
}

// Toggle Dark Mode
export function toggleDarkMode() {
  state.isDarkMode = !state.isDarkMode;
  localStorage.setItem('db_schema_dark', String(state.isDarkMode));
  if (state.isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Set Dark mode on startup
if (state.isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Update table position during canvas drag
export function updateTablePosition(tableId, newX, newY) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.x = Math.round(newX);
    tbl.y = Math.round(newY);
  }
}

// Auto Arrange / Auto Layout Tables with Topological Hierarchy & Barycenter Crossing Minimization
export function autoArrangeTables() {
  const proj = activeProject.value;
  if (!proj || !proj.tables || proj.tables.length === 0) return;

  const tables = proj.tables;
  const rels = proj.relationships || [];

  // In ERD relationships:
  // rel.fromTable contains the FK column (e.g., orders.user_id)
  // rel.toTable contains the referenced PK column (e.g., users.id)
  // Therefore, 'toTable' is the parent/upstream dependency (Level 0),
  // and 'fromTable' is the dependent child (Level 1+).

  const parentsOf = new Map();
  const childrenOf = new Map();
  tables.forEach(t => {
    const key = t.name.toLowerCase();
    parentsOf.set(key, new Set());
    childrenOf.set(key, new Set());
  });

  rels.forEach(rel => {
    const childKey = rel.fromTable?.toLowerCase(); // FK table
    const parentKey = rel.toTable?.toLowerCase();  // PK table
    if (childKey && parentKey && parentsOf.has(childKey) && parentsOf.has(parentKey) && childKey !== parentKey) {
      parentsOf.get(childKey).add(parentKey);
      childrenOf.get(parentKey).add(childKey);
    }
  });

  // Calculate topological level (0 = root lookup/parent tables like users, categories)
  const levels = new Map();
  tables.forEach(t => levels.set(t.name.toLowerCase(), 0));

  let changed = true;
  let passes = 0;
  while (changed && passes < tables.length) {
    changed = false;
    passes++;
    tables.forEach(t => {
      const childKey = t.name.toLowerCase();
      const currentLvl = levels.get(childKey);
      const parentKeys = parentsOf.get(childKey);
      parentKeys.forEach(pKey => {
        const parentLvl = levels.get(pKey) || 0;
        if (currentLvl <= parentLvl) {
          levels.set(childKey, parentLvl + 1);
          changed = true;
        }
      });
    });
  }

  // Group tables by level
  const levelGroups = new Map();
  tables.forEach(t => {
    const lvl = levels.get(t.name.toLowerCase()) || 0;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl).push(t);
  });

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  // Helper to get estimated table height
  const getTableHeight = (t) => {
    const colCount = t.columns ? t.columns.length : 1;
    return 44 + colCount * 33 + 24; // header + rows + footer
  };

  const posMap = new Map(); // tableKey -> { x, y }

  // Assign positions level by level with barycenter reordering
  const START_X = 60;
  const START_Y = 60;
  const COL_WIDTH = 420; // 280px table width + 140px clean routing channel
  const ROW_GAP = 55;

  sortedLevels.forEach((lvl) => {
    const group = levelGroups.get(lvl) || [];

    if (lvl === 0) {
      // Sort level 0 tables by number of outgoing children (most connected at top)
      group.sort((a, b) => {
        const aDegree = childrenOf.get(a.name.toLowerCase())?.size || 0;
        const bDegree = childrenOf.get(b.name.toLowerCase())?.size || 0;
        return bDegree - aDegree || a.name.localeCompare(b.name);
      });
    } else {
      // Sort level > 0 tables by barycenter (average Y position) of their connected parents
      group.sort((a, b) => {
        const aParents = Array.from(parentsOf.get(a.name.toLowerCase()) || []);
        const bParents = Array.from(parentsOf.get(b.name.toLowerCase()) || []);

        const aCenter = aParents.length > 0
          ? aParents.reduce((sum, p) => sum + (posMap.get(p)?.y || 0), 0) / aParents.length
          : 9999;
        const bCenter = bParents.length > 0
          ? bParents.reduce((sum, p) => sum + (posMap.get(p)?.y || 0), 0) / bParents.length
          : 9999;

        return aCenter - bCenter || a.name.localeCompare(b.name);
      });
    }

    const colX = START_X + lvl * COL_WIDTH;
    let curY = START_Y;

    group.forEach(t => {
      posMap.set(t.name.toLowerCase(), { x: colX, y: curY });
      curY += getTableHeight(t) + ROW_GAP;
    });
  });

  // Apply computed positions to table objects
  tables.forEach(t => {
    const pos = posMap.get(t.name.toLowerCase());
    if (pos) {
      t.x = Math.round(pos.x);
      t.y = Math.round(pos.y);
    }
  });

  proj.updatedAt = new Date().toISOString();
  addToast('Auto Arranged', `Organized ${tables.length} tables in clean schema flow`, 'success');
}

// Update Table Header Color
export function updateTableHeaderColor(tableId, color) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.headerColor = color;
    proj.updatedAt = new Date().toISOString();
  }
}

// Update Table Note
export function updateTableNote(tableId, note) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.note = note;
    proj.updatedAt = new Date().toISOString();
  }
}

// Update Column Note
export function updateColumnNote(tableId, colIndex, note) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns[colIndex].note = note;
    proj.updatedAt = new Date().toISOString();
  }
}

// Add Table
export function addTable(tableData) {
  const proj = activeProject.value;
  if (!proj) return;

  const newTable = {
    id: 'tbl-' + Math.random().toString(36).substring(2, 9),
    name: tableData.name || 'new_table',
    headerColor: tableData.headerColor || '#3b82f6',
    x: tableData.x || 100 + Math.random() * 200,
    y: tableData.y || 100 + Math.random() * 200,
    note: tableData.note || '',
    columns: tableData.columns || [
      { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Auto primary key' }
    ]
  };

  proj.tables.push(newTable);
  proj.updatedAt = new Date().toISOString();
  state.selectedTableId = newTable.id;
  addToast('Table Added', `Created table "${newTable.name}"`, 'success');
}

// Delete Table
export function deleteTable(tableId) {
  const proj = activeProject.value;
  if (!proj) return;
  const tblIndex = proj.tables.findIndex(t => t.id === tableId);
  if (tblIndex !== -1) {
    const tblName = proj.tables[tblIndex].name;
    proj.tables.splice(tblIndex, 1);
    // Remove related foreign keys
    proj.relationships = proj.relationships.filter(
      r => r.fromTable !== tblName && r.toTable !== tblName
    );
    if (state.selectedTableId === tableId) {
      state.selectedTableId = null;
    }
    addToast('Table Removed', `Deleted table "${tblName}"`, 'warning');
  }
}

// Add Column
export function addColumn(tableId, colData) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl) {
    tbl.columns.push({
      name: colData.name || 'new_column',
      type: colData.type || 'varchar(255)',
      isPk: colData.isPk || false,
      isFk: colData.isFk || false,
      isNull: colData.isNull ?? true,
      isUnique: colData.isUnique || false,
      note: colData.note || ''
    });
    proj.updatedAt = new Date().toISOString();
  }
}

// Delete Column
export function deleteColumn(tableId, colIndex) {
  const proj = activeProject.value;
  if (!proj) return;
  const tbl = proj.tables.find(t => t.id === tableId);
  if (tbl && tbl.columns[colIndex]) {
    tbl.columns.splice(colIndex, 1);
    proj.updatedAt = new Date().toISOString();
  }
}

// Add Relationship
export function addRelationship(relData) {
  const proj = activeProject.value;
  if (!proj) return;

  const newRel = {
    id: 'rel-' + Math.random().toString(36).substring(2, 9),
    fromTable: relData.fromTable,
    fromColumn: relData.fromColumn,
    toTable: relData.toTable,
    toColumn: relData.toColumn,
    cardinality: relData.cardinality || '1:N',
    onDelete: relData.onDelete || 'CASCADE'
  };

  // Mark column as FK
  const tbl = proj.tables.find(t => t.name === relData.fromTable);
  if (tbl) {
    const col = tbl.columns.find(c => c.name === relData.fromColumn);
    if (col) col.isFk = true;
  }

  proj.relationships.push(newRel);
  proj.updatedAt = new Date().toISOString();
  addToast('Relationship Linked', `${relData.fromTable}.${relData.fromColumn} -> ${relData.toTable}.${relData.toColumn}`, 'success');
}

// Delete Relationship
export function deleteRelationship(relId) {
  const proj = activeProject.value;
  if (!proj) return;
  const idx = proj.relationships.findIndex(r => r.id === relId);
  if (idx !== -1) {
    proj.relationships.splice(idx, 1);
    proj.updatedAt = new Date().toISOString();
    addToast('Relationship Removed', 'Foreign key deleted', 'info');
  }
}

// Create Commit Snapshot (Version Control)
export function createCommit(versionName, description) {
  const proj = activeProject.value;
  if (!proj) return;
  if (!proj.history) proj.history = [];

  const commit = {
    id: 'v-' + Date.now(),
    versionName: versionName || `v1.${proj.history.length}`,
    description: description || 'Schema state checkpoint',
    createdAt: new Date().toISOString(),
    author: state.currentUser.name || 'Developer',
    tablesCount: proj.tables.length,
    relationshipsCount: proj.relationships.length,
    snapshotTables: JSON.parse(JSON.stringify(proj.tables)),
    snapshotRelationships: JSON.parse(JSON.stringify(proj.relationships))
  };

  proj.history.unshift(commit);
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Snapshot Saved', `Created release checkpoint "${commit.versionName}"`, 'success');
}

// Delete Commit Snapshot
export function deleteCommit(commitId) {
  const proj = activeProject.value;
  if (!proj || !proj.history) return;
  const idx = proj.history.findIndex(h => h.id === commitId);
  if (idx !== -1) {
    const vName = proj.history[idx].versionName;
    proj.history.splice(idx, 1);
    proj.updatedAt = new Date().toISOString();
    syncActiveProjectToFirestore();
    addToast('Version Removed', `Deleted checkpoint "${vName}"`, 'info');
  }
}

// Restore Commit Snapshot
export function restoreCommit(commitId) {
  const proj = activeProject.value;
  if (!proj || !proj.history) return;
  const commit = proj.history.find(h => h.id === commitId);
  if (commit && commit.snapshotTables) {
    proj.tables = JSON.parse(JSON.stringify(commit.snapshotTables));
    proj.relationships = JSON.parse(JSON.stringify(commit.snapshotRelationships));
    proj.updatedAt = new Date().toISOString();
    syncActiveProjectToFirestore();
    addToast('Version Restored', `Restored schema to "${commit.versionName}"`, 'info');
  }
}

// Update Active Project Target SQL Dialect
export function setProjectDialect(dialect) {
  const proj = activeProject.value;
  if (!proj) return;
  proj.dialect = dialect;
  proj.updatedAt = new Date().toISOString();
  syncActiveProjectToFirestore();
  addToast('Dialect Updated', `Target dialect set to ${dialect.toUpperCase()}`, 'info');
}

// Create New Project
export function createProject(projectName, folderId, description = '') {
  const newProj = {
    id: 'proj-' + Date.now(),
    folderId: folderId || state.folders[0]?.id || 'folder-1',
    name: projectName,
    description: description || 'New database schema model',
    updatedAt: new Date().toISOString(),
    dialect: 'postgres',
    tables: [
      {
        id: 'tbl-users-' + Date.now(),
        name: 'users',
        headerColor: '#3b82f6',
        x: 100,
        y: 100,
        columns: [
          { name: 'id', type: 'integer', isPk: true, isFk: false, isNull: false, isUnique: true, note: 'Primary key' },
          { name: 'created_at', type: 'timestamp', isPk: false, isFk: false, isNull: false, isUnique: false, note: '' }
        ]
      }
    ],
    relationships: [],
    history: [],
    ownerUid: state.currentUser.id || 'guest',
    ownerEmail: state.currentUser.email || ''
  };

  state.projects.push(newProj);
  state.activeProjectId = newProj.id;
  syncActiveProjectToFirestore();
  addToast('Project Created', `Started "${projectName}" & saved to account`, 'success');
}

// Delete Project
export async function deleteProject(projectId) {
  const idx = state.projects.findIndex(p => p.id === projectId);
  if (idx !== -1) {
    const projName = state.projects[idx].name;
    state.projects.splice(idx, 1);
    if (state.activeProjectId === projectId && state.projects.length > 0) {
      state.activeProjectId = state.projects[0].id;
    }
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      addToast('Project Deleted', `Permanently removed "${projName}"`, 'info');
    } catch (e) {
      console.warn('Delete project error:', e.message);
    }
  }
}

// Create New Folder
export function createFolder(folderName) {
  const newFolder = {
    id: 'folder-' + Date.now(),
    name: folderName,
    icon: 'Folder'
  };
  state.folders.push(newFolder);
  addToast('Folder Created', `Created folder "${folderName}"`, 'success');
}

// Delete Folder
export function deleteFolder(folderId) {
  const idx = state.folders.findIndex(f => f.id === folderId);
  if (idx !== -1) {
    const fName = state.folders[idx].name;
    state.folders.splice(idx, 1);
    addToast('Folder Removed', `Deleted folder "${fName}"`, 'info');
  }
}

// Generate schema with server-side Gemini API
export async function generateSchemaWithAI(prompt, dialect = 'postgres', mode = 'new') {
  const proj = activeProject.value;
  const existingTables = (proj && mode === 'extend') ? proj.tables : [];

  const response = await fetch('/api/generate-schema', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      dialect,
      mode,
      existingTables
    })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate schema with AI');
  }

  return data.schema;
}

export function applyAiGeneratedSchema(aiResult, mode = 'new') {
  if (!aiResult || !aiResult.tables) return;

  if (mode === 'new') {
    const newProjId = 'proj-' + Date.now();
    const newProjectObj = {
      id: newProjId,
      folderId: activeProject.value?.folderId || 'folder-1',
      name: aiResult.schemaName || 'AI Generated Schema',
      description: aiResult.description || 'Generated with Gemini AI',
      dialect: activeProject.value?.dialect || 'postgres',
      tables: aiResult.tables.map((t, idx) => ({
        id: 'tbl-ai-' + Date.now() + '-' + idx,
        name: t.name,
        headerColor: t.headerColor || '#3b82f6',
        comment: t.comment || '',
        x: 60 + (idx % 3) * 380,
        y: 60 + Math.floor(idx / 3) * 320,
        columns: (t.columns || []).map((c, cIdx) => ({
          id: 'col-' + Date.now() + '-' + idx + '-' + cIdx,
          name: c.name,
          type: c.type,
          pk: !!c.pk,
          fk: !!c.fk,
          notNull: !!c.notNull,
          unique: !!c.unique,
          comment: c.comment || ''
        }))
      })),
      relationships: (aiResult.relationships || []).map((r, rIdx) => ({
        id: 'rel-ai-' + Date.now() + '-' + rIdx,
        fromTable: r.fromTable,
        fromColumn: r.fromColumn,
        toTable: r.toTable,
        toColumn: r.toColumn,
        type: r.type || '1:N'
      })),
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    state.projects.push(newProjectObj);
    state.activeProjectId = newProjId;
    autoArrangeTables();
    syncActiveProjectToFirestore();
    addToast('AI Schema Created', `Generated '${newProjectObj.name}' with ${newProjectObj.tables.length} tables.`, 'success');
  } else {
    const proj = activeProject.value;
    if (!proj) return;

    let addedTables = 0;
    aiResult.tables.forEach((t, idx) => {
      const existingIdx = proj.tables.findIndex(existing => existing.name.toLowerCase() === t.name.toLowerCase());
      if (existingIdx >= 0) {
        const targetTable = proj.tables[existingIdx];
        (t.columns || []).forEach((c) => {
          const colExists = targetTable.columns.some(col => col.name.toLowerCase() === c.name.toLowerCase());
          if (!colExists) {
            targetTable.columns.push({
              id: 'col-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              name: c.name,
              type: c.type,
              pk: !!c.pk,
              fk: !!c.fk,
              notNull: !!c.notNull,
              unique: !!c.unique,
              comment: c.comment || ''
            });
          }
        });
      } else {
        proj.tables.push({
          id: 'tbl-ai-' + Date.now() + '-' + idx,
          name: t.name,
          headerColor: t.headerColor || '#3b82f6',
          comment: t.comment || '',
          x: 60 + (proj.tables.length % 3) * 380,
          y: 60 + Math.floor(proj.tables.length / 3) * 320,
          columns: (t.columns || []).map((c, cIdx) => ({
            id: 'col-' + Date.now() + '-' + idx + '-' + cIdx,
            name: c.name,
            type: c.type,
            pk: !!c.pk,
            fk: !!c.fk,
            notNull: !!c.notNull,
            unique: !!c.unique,
            comment: c.comment || ''
          }))
        });
        addedTables++;
      }
    });

    (aiResult.relationships || []).forEach((r, rIdx) => {
      const relExists = proj.relationships.some(existing => 
        existing.fromTable.toLowerCase() === r.fromTable.toLowerCase() &&
        existing.fromColumn.toLowerCase() === r.fromColumn.toLowerCase() &&
        existing.toTable.toLowerCase() === r.toTable.toLowerCase()
      );
      if (!relExists) {
        proj.relationships.push({
          id: 'rel-ai-' + Date.now() + '-' + rIdx,
          fromTable: r.fromTable,
          fromColumn: r.fromColumn,
          toTable: r.toTable,
          toColumn: r.toColumn,
          type: r.type || '1:N'
        });
      }
    });

    proj.updatedAt = new Date().toISOString();
    autoArrangeTables();
    syncActiveProjectToFirestore();
    addToast('AI Schema Extended', `Updated active project '${proj.name}'.`, 'success');
  }
}
