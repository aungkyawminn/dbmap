<template>
  <aside
    class="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/80 flex flex-col select-none text-xs transition-all duration-200 shrink-0 overflow-hidden"
    :class="[state.isSidebarCollapsed ? 'w-14' : 'w-80']"
  >
    <!-- Collapsed Compact Strip -->
    <div v-if="state.isSidebarCollapsed" class="flex-1 flex flex-col items-center py-3 gap-3">
      <!-- Expand Button -->
      <button
        @click="state.isSidebarCollapsed = false"
        title="Expand Sidebar"
        class="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
      >
        <PanelLeftOpen class="w-5 h-5" />
      </button>

      <div class="w-8 h-[1px] bg-slate-200 dark:bg-slate-700/80 my-1"></div>

      <!-- Vertical Icon Rail -->
      <div class="flex flex-col gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectTabAndExpand(tab.id)"
          class="p-2.5 rounded-xl transition flex flex-col items-center justify-center relative group"
          :class="[
            state.activeTab === tab.id
              ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          ]"
          :title="tab.label"
        >
          <component :is="tab.icon" class="w-4.5 h-4.5" />

          <!-- Hover Tooltip -->
          <span class="absolute left-14 px-2 py-1 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity border border-slate-800">
            {{ tab.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Expanded Sidebar -->
    <template v-else>
      <!-- Sidebar Header Tabs -->
      <div class="flex items-center border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 p-1 gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="state.activeTab = tab.id"
          class="flex-1 py-2 px-1 rounded-lg font-medium transition flex flex-col items-center gap-1"
          :class="[
            state.activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          ]"
          :title="tab.label"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="text-[10px] font-semibold tracking-tight">{{ tab.shortLabel }}</span>
        </button>

        <!-- Collapse Toggle Button -->
        <button
          @click="state.isSidebarCollapsed = true"
          title="Collapse Sidebar"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 transition ml-0.5 shrink-0"
        >
          <PanelLeftClose class="w-4 h-4" />
        </button>
      </div>

    <!-- TAB 1: EXPLORER (FOLDERS & PROJECTS) -->
    <div v-if="state.activeTab === 'explorer'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-4">
      <!-- Folder Management Section -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Workspace Folders</span>
          <button
            @click="state.modals.newFolder = true"
            class="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <FolderPlus class="w-3.5 h-3.5" /> New Folder
          </button>
        </div>

        <div class="space-y-1">
          <div
            v-for="folder in state.folders"
            :key="folder.id"
            class="p-2 rounded-lg border border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between hover:border-blue-300 dark:hover:border-blue-500/50 transition cursor-pointer group"
          >
            <div class="flex items-center gap-2 min-w-0">
              <Folder class="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
              <span class="font-medium text-slate-700 dark:text-slate-200 truncate">{{ folder.name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                {{ state.projects.filter(p => p.folderId === folder.id).length }}
              </span>
              <button
                v-if="state.folders.length > 1"
                @click.stop="delFolder(folder.id)"
                title="Delete Folder"
                class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects List Section -->
      <div class="flex-1 flex flex-col">
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">All Schemas</span>
          <button
            @click="state.modals.newProject = true"
            class="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
          >
            <Plus class="w-3.5 h-3.5" /> New Schema
          </button>
        </div>

        <div class="space-y-2 overflow-y-auto pr-1">
          <div
            v-for="proj in state.projects"
            :key="proj.id"
            @click="state.activeProjectId = proj.id"
            class="p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 group relative"
            :class="[
              proj.id === state.activeProjectId
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400/80'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
            ]"
          >
            <div class="flex items-center justify-between gap-1">
              <span class="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">{{ proj.name }}</span>
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] uppercase">
                  {{ proj.dialect }}
                </span>
                <button
                  v-if="state.projects.length > 1"
                  @click.stop="delProject(proj.id)"
                  title="Delete Schema"
                  class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {{ proj.description || 'No description provided.' }}
            </p>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <span>{{ proj.tables ? proj.tables.length : 0 }} Tables</span>
              <span>{{ proj.relationships ? proj.relationships.length : 0 }} Refs</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: TABLES & FIELDS MANAGER -->
    <div v-else-if="state.activeTab === 'tables'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Search and Add Table -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            v-model="tableQuery"
            type="text"
            placeholder="Search tables or fields..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-xs text-slate-700 dark:text-slate-200"
          />
        </div>
        <button
          @click="state.modals.newTable = true"
          title="Add Table"
          class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Tables Accordion List -->
      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="tbl in filteredTables"
          :key="tbl.id"
          class="border rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
          :class="[
            state.selectedTableId === tbl.id
              ? 'border-blue-500 dark:border-blue-400 shadow-sm'
              : 'border-slate-200 dark:border-slate-700/80'
          ]"
        >
          <!-- Table Header Card -->
          <div
            @click="state.selectedTableId = tbl.id"
            class="p-2.5 bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <div class="flex items-center gap-2 font-mono truncate">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
              ></span>
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ tbl.name }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="text-[10px] font-mono font-medium">{{ tbl.columns.length }} cols</span>
              <button
                @click.stop="delTbl(tbl.id)"
                class="p-1 hover:text-red-500 transition"
                title="Delete Table"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Expanded Column Editor -->
          <div v-if="state.selectedTableId === tbl.id" class="p-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
            <div
              v-for="(col, cIdx) in tbl.columns"
              :key="cIdx"
              class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
            >
              <div class="flex items-center gap-1.5">
                <input
                  v-model="col.name"
                  type="text"
                  class="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  placeholder="column_name"
                />
                <select
                  v-model="col.type"
                  class="w-24 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="integer">integer</option>
                  <option value="varchar(255)">varchar(255)</option>
                  <option value="text">text</option>
                  <option value="boolean">boolean</option>
                  <option value="decimal(10,2)">decimal(10,2)</option>
                  <option value="timestamp">timestamp</option>
                  <option value="uuid">uuid</option>
                  <option value="jsonb">jsonb</option>
                </select>
                <button
                  @click="delCol(tbl.id, cIdx)"
                  class="p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Column Flag Checkboxes -->
              <div class="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <label class="flex items-center gap-1 cursor-pointer hover:text-amber-600">
                  <input type="checkbox" v-model="col.isPk" class="rounded text-amber-500 focus:ring-0" />
                  <span :class="{ 'font-bold text-amber-600 dark:text-amber-400': col.isPk }">PK</span>
                </label>

                <label class="flex items-center gap-1 cursor-pointer hover:text-red-500">
                  <input type="checkbox" v-model="col.isNull" class="rounded text-red-500 focus:ring-0" />
                  <span>Nullable</span>
                </label>

                <label class="flex items-center gap-1 cursor-pointer hover:text-purple-600">
                  <input type="checkbox" v-model="col.isUnique" class="rounded text-purple-500 focus:ring-0" />
                  <span>Unique</span>
                </label>
              </div>
            </div>

            <button
              @click="addCol(tbl.id)"
              class="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-500 rounded-lg transition text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> Add Field
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: RELATIONSHIPS MANAGER -->
    <div v-else-if="state.activeTab === 'relationships'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Entity Relationships</span>
        <button
          @click="state.modals.newRel = true"
          class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <Plus class="w-3.5 h-3.5" /> Add Foreign Key
        </button>
      </div>

      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="rel in activeProject.relationships"
          :key="rel.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-2"
          :class="{ 'ring-2 ring-blue-500': state.selectedRelId === rel.id }"
        >
          <!-- Source to Target -->
          <div class="flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold truncate">
              <span>{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
            </div>
            <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-bold text-[10px]">
              {{ rel.cardinality || '1:N' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ArrowDown class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span class="font-mono text-slate-600 dark:text-slate-300 truncate">
              References {{ rel.toTable }}.{{ rel.toColumn }}
            </span>
          </div>

          <!-- Options & Delete -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-mono text-slate-400">
            <span>ON DELETE {{ rel.onDelete || 'CASCADE' }}</span>
            <button
              @click="delRel(rel.id)"
              class="text-red-500 hover:underline flex items-center gap-1"
            >
              <Trash2 class="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: VERSION CONTROL & SNAPSHOTS -->
    <div v-else-if="state.activeTab === 'history'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Schema Version Control</span>
        <button
          @click="state.modals.version = true"
          class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <GitCommit class="w-3.5 h-3.5" /> Save Release
        </button>
      </div>

      <div class="space-y-3 overflow-y-auto flex-1 pr-1">
        <div
          v-if="!activeProject.history || activeProject.history.length === 0"
          class="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2"
        >
          <GitCommit class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p class="font-medium text-xs">No saved releases yet</p>
          <p class="text-[11px]">Click "Save Release" to take a snapshot checkpoint of your tables and relationships.</p>
        </div>

        <div
          v-for="commit in activeProject.history"
          :key="commit.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-1.5 group"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ commit.versionName }}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono text-slate-400">{{ formatDate(commit.createdAt) }}</span>
              <button
                @click="delCommit(commit.id)"
                title="Delete Snapshot"
                class="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{{ commit.description }}</p>
          <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
            <span>By {{ commit.author }}</span>
            <button
              @click="restore(commit.id)"
              class="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" /> Restore Checkpoint
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: DIALECT SETTINGS -->
    <div v-else-if="state.activeTab === 'settings'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-4">
      <div>
        <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target SQL Dialect</label>
        <select
          v-model="activeProject.dialect"
          @change="onDialectChange"
          class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:border-blue-500"
        >
          <option value="postgres">PostgreSQL 15+</option>
          <option value="mysql">MySQL 8.0+</option>
          <option value="sqlite">SQLite 3</option>
          <option value="mssql">Microsoft SQL Server</option>
        </select>
      </div>

      <div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
        <div class="font-semibold text-blue-900 dark:text-blue-300">Live Account & Cloud Sync</div>
        <p class="text-[11px] text-blue-700 dark:text-blue-400">
          Logged in as <span class="font-mono font-bold">{{ state.currentUser.email }}</span>. Changes to schemas, versions, and dialects automatically save to Firestore.
        </p>
      </div>
    </div>
  </template>
</aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  state,
  activeProject,
  addColumn,
  deleteColumn,
  deleteTable,
  deleteRelationship,
  restoreCommit,
  deleteCommit,
  deleteProject,
  deleteFolder,
  setProjectDialect
} from '../stores/schemaStore.js';
import {
  Folder,
  Layers,
  Link,
  GitCommit,
  Settings,
  FolderPlus,
  Plus,
  Search,
  Trash2,
  X,
  ArrowDown,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next';

function selectTabAndExpand(tabId) {
  state.activeTab = tabId;
  state.isSidebarCollapsed = false;
}

const tableQuery = ref('');

const tabs = [
  { id: 'tables', label: 'Tables & Fields', shortLabel: 'Tables', icon: Layers },
  { id: 'relationships', label: 'Entity Relationships', shortLabel: 'Refs', icon: Link },
  { id: 'explorer', label: 'Folders & Projects', shortLabel: 'Folders', icon: Folder },
  { id: 'history', label: 'Version Control', shortLabel: 'History', icon: GitCommit },
  { id: 'settings', label: 'Dialect Settings', shortLabel: 'Dialect', icon: Settings }
];

const filteredTables = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.tables) return [];
  if (!tableQuery.value) return proj.tables;
  const q = tableQuery.value.toLowerCase();
  return proj.tables.filter(
    t => t.name.toLowerCase().includes(q) || t.columns.some(c => c.name.toLowerCase().includes(q))
  );
});

function addCol(tblId) {
  addColumn(tblId, { name: 'new_column', type: 'varchar(255)' });
}

function delCol(tblId, cIdx) {
  deleteColumn(tblId, cIdx);
}

function delTbl(tblId) {
  deleteTable(tblId);
}

function delRel(relId) {
  deleteRelationship(relId);
}

function restore(commitId) {
  restoreCommit(commitId);
}

function delCommit(commitId) {
  deleteCommit(commitId);
}

function delProject(projectId) {
  deleteProject(projectId);
}

function delFolder(folderId) {
  deleteFolder(folderId);
}

function onDialectChange() {
  if (activeProject.value) {
    setProjectDialect(activeProject.value.dialect);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
</script>
