<template>
  <div
    v-if="state.modals.docs"
    class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn"
    @click.self="state.modals.docs = false"
  >
    <div
      class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 relative"
    >
      <!-- Header Toolbar -->
      <div class="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80">
        <div class="flex items-center gap-3">
          <DbMapLogo class-name="w-9 h-9" />
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-bold text-base tracking-tight font-sans">dbdictionary Documentation</h2>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80">
                dbdictionary
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              Interactive database dictionary generated from schema tables, field types, and DBML notes
            </p>
          </div>
        </div>

        <!-- Right Header Actions -->
        <div class="flex items-center gap-2">
          <!-- Search Bar -->
          <div class="relative hidden lg:block">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search tables, fields, notes..."
              class="pl-8 pr-3 py-1.5 w-48 xl:w-60 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition text-slate-800 dark:text-slate-100"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X class="w-3 h-3" />
            </button>
          </div>

          <!-- Publish & Share Button (PRIMARY) -->
          <button
            @click="publishDictionary"
            :disabled="isPublishing"
            class="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
            title="Publish unique sharable link for read-only documentation"
          >
            <Loader2 v-if="isPublishing" class="w-3.5 h-3.5 animate-spin" />
            <Globe v-else class="w-3.5 h-3.5" />
            <span>{{ isPublishing ? 'Publishing...' : 'Publish & Share' }}</span>
          </button>

          <!-- Export Markdown -->
          <button
            @click="copyMarkdown"
            class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Copy Markdown Documentation"
          >
            <Copy v-if="!copied" class="w-3.5 h-3.5 text-indigo-500" />
            <Check v-else class="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
            <span class="hidden sm:inline">{{ copied ? 'Copied!' : 'Copy Markdown' }}</span>
          </button>

          <button
            @click="downloadMarkdown"
            class="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
            title="Export .md File"
          >
            <Download class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Export .md</span>
          </button>

          <div class="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

          <button
            @click="state.modals.docs = false"
            class="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Published Success Link Popover Modal -->
      <div
        v-if="showPublishedSuccessModal"
        class="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        @click.self="showPublishedSuccessModal = false"
      >
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-lg w-full space-y-4 text-slate-800 dark:text-slate-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Globe class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-base font-sans">dbdictionary Published!</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Unique shareable URL created successfully</p>
              </div>
            </div>
            <button @click="showPublishedSuccessModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <label class="block text-[11px] font-bold text-slate-500 uppercase font-mono tracking-wider">
              Shareable Read-Only URL
            </label>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="publishedUrl"
                class="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 outline-none select-all"
              />
              <button
                @click="copyPublishedUrl"
                class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
              >
                <Check v-if="publishedCopied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ publishedCopied ? 'Copied!' : 'Copy Link' }}</span>
              </button>
            </div>
          </div>

          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anyone with this link can view the rendered, interactive read-only database dictionary with search, field note descriptions, and ERD visual diagram options.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              :href="publishedUrl"
              target="_blank"
              class="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <ExternalLink class="w-3.5 h-3.5 text-indigo-500" />
              <span>Test Link in New Tab</span>
            </a>
            <button
              @click="showPublishedSuccessModal = false"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <!-- Main Modal Workspace Body -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar Navigation -->
        <div class="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col shrink-0 overflow-y-auto p-3 gap-2">
          <!-- Mobile Search Input -->
          <div class="lg:hidden mb-1">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search schema..."
              class="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>

          <!-- All Tables Header Item -->
          <button
            @click="activeTableFilter = null"
            class="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition text-left"
            :class="[
              activeTableFilter === null
                ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            ]"
          >
            <span class="flex items-center gap-2">
              <Layers class="w-4 h-4 text-indigo-500" /> All Tables Summary
            </span>
            <span class="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-200/60 dark:bg-slate-800 text-slate-500 font-mono">
              {{ activeProject.tables.length }}
            </span>
          </button>

          <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mt-2">
            Tables List
          </div>

          <!-- Table Items List -->
          <div class="space-y-1">
            <button
              v-for="tbl in filteredTablesList"
              :key="tbl.id"
              @click="scrollToTable(tbl.id)"
              class="w-full px-3 py-2 rounded-xl text-xs transition flex items-center justify-between text-left group"
              :class="[
                activeTableFilter === tbl.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              ]"
            >
              <div class="flex items-center gap-2 truncate">
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                ></span>
                <span class="font-mono font-medium truncate">{{ tbl.name }}</span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <FileText v-if="tbl.note || tbl.columns.some(c => c.note)" class="w-3 h-3 text-amber-500" title="Has notes" />
                <span class="text-[10px] font-mono text-slate-400">
                  {{ tbl.columns.length }}
                </span>
              </div>
            </button>

            <div v-if="filteredTablesList.length === 0" class="px-3 py-4 text-center text-xs text-slate-400">
              No matching tables found
            </div>
          </div>
        </div>

        <!-- Documentation Content Body -->
        <div ref="docsContentRef" class="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-900 scroll-smooth">
          <!-- Project Schema Title Overview Banner -->
          <div class="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden">
            <div class="relative z-10">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-xs text-indigo-300 font-mono font-semibold uppercase tracking-wider mb-1">
                  <span>dbdictionary</span> &bull; <span>{{ activeProject.dialect || 'PostgreSQL' }}</span>
                </div>
                <button
                  @click="publishDictionary"
                  class="px-3 py-1 bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 border border-indigo-400/30 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Globe class="w-3.5 h-3.5" />
                  <span>Publish Link</span>
                </button>
              </div>

              <h1 class="text-2xl font-extrabold tracking-tight font-sans text-white mb-2">
                {{ activeProject.name }}
              </h1>
              <p v-if="activeProject.description" class="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {{ activeProject.description }}
              </p>

              <!-- Quick Metrics Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Tables</div>
                  <div class="text-lg font-bold font-mono text-indigo-300">{{ activeProject.tables.length }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Fields</div>
                  <div class="text-lg font-bold font-mono text-emerald-300">{{ totalFieldsCount }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Relationships</div>
                  <div class="text-lg font-bold font-mono text-purple-300">{{ activeProject.relationships.length }}</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-mono font-semibold">Documented Notes</div>
                  <div class="text-lg font-bold font-mono text-amber-300">{{ totalNotesCount }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Documentation Sections per Table -->
          <div
            v-for="tbl in displayedTables"
            :key="tbl.id"
            :id="`doc-table-${tbl.id}`"
            class="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-4"
          >
            <!-- Table Header Bar -->
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-lg shrink-0"
                  :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
                ></div>
                <h3 class="font-bold text-lg font-mono text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{{ tbl.name }}</span>
                  <span class="text-xs font-sans font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {{ tbl.columns.length }} columns
                  </span>
                </h3>
              </div>

              <button
                @click="jumpToCanvasTable(tbl.id)"
                class="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition flex items-center gap-1"
                title="View on Canvas"
              >
                <span>View Canvas</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Table Note Box -->
            <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200 text-xs leading-relaxed space-y-1">
              <div class="font-bold text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center justify-between">
                <span class="flex items-center gap-1.5"><FileText class="w-3.5 h-3.5" /> Table Note</span>
                <button
                  @click="editingTableNoteId = editingTableNoteId === tbl.id ? null : tbl.id"
                  class="text-[10px] hover:underline"
                >
                  {{ editingTableNoteId === tbl.id ? 'Close Edit' : 'Edit Note' }}
                </button>
              </div>

              <div v-if="editingTableNoteId === tbl.id" class="pt-1">
                <textarea
                  :value="tbl.note || ''"
                  @input="onTableNoteChange(tbl.id, $event.target.value)"
                  placeholder="Enter table note..."
                  class="w-full h-20 p-2 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div v-else class="whitespace-pre-wrap font-sans text-slate-600 dark:text-slate-300">
                {{ tbl.note || 'No description provided for this table. Click "Edit Note" to add documentation.' }}
              </div>
            </div>

            <!-- Columns Documentation Table -->
            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-xs">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono font-semibold text-[10px]">
                  <tr>
                    <th class="py-2.5 px-3.5 w-1/4">Field</th>
                    <th class="py-2.5 px-3.5 w-1/5">Type</th>
                    <th class="py-2.5 px-3.5 w-1/5">Attributes</th>
                    <th class="py-2.5 px-3.5">Description / Note</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  <tr
                    v-for="(col, cIdx) in tbl.columns"
                    :key="cIdx"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <!-- Field Name -->
                    <td class="py-2.5 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-100">
                      {{ col.name }}
                    </td>

                    <!-- Type -->
                    <td class="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                      {{ col.type }}
                    </td>

                    <!-- Attributes -->
                    <td class="py-2.5 px-3.5 font-mono text-[10px]">
                      <div class="flex items-center gap-1 flex-wrap">
                        <span v-if="col.isPk" class="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">PK</span>
                        <span v-if="col.isFk" class="px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">FK</span>
                        <span v-if="col.isUnique" class="px-1.5 py-0.5 rounded font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">UQ</span>
                        <span v-if="col.isNull === false && !col.isPk" class="px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">NOT NULL</span>
                        <span v-if="!col.isPk && !col.isFk && !col.isUnique && col.isNull !== false" class="text-slate-400">-</span>
                      </div>
                    </td>

                    <!-- Note / Description -->
                    <td class="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 text-xs">
                      <div class="flex items-center justify-between gap-2 group/field">
                        <span :class="{ 'italic text-slate-400': !col.note }">
                          {{ col.note || 'No field note' }}
                        </span>
                        <button
                          @click="editingColKey = editingColKey === `${tbl.id}-${cIdx}` ? null : `${tbl.id}-${cIdx}`"
                          class="opacity-0 group-hover/field:opacity-100 p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition"
                          title="Edit Field Note"
                        >
                          <Edit3 class="w-3 h-3" />
                        </button>
                      </div>

                      <!-- Inline Column Note Editor -->
                      <div v-if="editingColKey === `${tbl.id}-${cIdx}`" class="mt-1.5">
                        <input
                          type="text"
                          :value="col.note || ''"
                          @input="onColumnNoteChange(tbl.id, cIdx, $event.target.value)"
                          placeholder="Field note..."
                          class="w-full px-2 py-1 text-xs font-mono rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Relationships Section -->
            <div v-if="getTableRelationships(tbl.name).length > 0" class="pt-1">
              <div class="text-[10px] font-mono uppercase font-bold text-slate-400 mb-2 flex items-center gap-1">
                <GitFork class="w-3 h-3 text-indigo-500" /> Foreign Keys & Relationships
              </div>
              <div class="space-y-1">
                <div
                  v-for="rel in getTableRelationships(tbl.name)"
                  :key="rel.id"
                  class="px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 font-mono text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-[10px] text-slate-600 dark:text-slate-300">
                    {{ rel.cardinality }}
                  </span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">{{ rel.toTable }}.{{ rel.toColumn }}</span>
                  <span v-if="rel.onDelete" class="text-[10px] text-slate-400 ml-auto font-sans">
                    On Delete: {{ rel.onDelete }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import DbMapLogo from './DbMapLogo.vue';
import {
  state,
  activeProject,
  addToast,
  updateTableNote,
  updateColumnNote
} from '../stores/schemaStore.js';
import { db, doc, setDoc } from '../firebase.js';
import { exportToMarkdownDocs } from '../utils/dbmlParser.js';
import {
  BookOpen,
  Search,
  Copy,
  Check,
  Download,
  X,
  Globe,
  Loader2,
  Layers,
  FileText,
  ExternalLink,
  Edit3,
  GitFork
} from 'lucide-vue-next';

const searchQuery = ref('');
const activeTableFilter = ref(null);
const copied = ref(false);
const docsContentRef = ref(null);

const editingTableNoteId = ref(null);
const editingColKey = ref(null);

const isPublishing = ref(false);
const showPublishedSuccessModal = ref(false);
const publishedUrl = ref('');
const publishedCopied = ref(false);

const totalFieldsCount = computed(() => {
  return activeProject.value?.tables.reduce((acc, t) => acc + t.columns.length, 0) || 0;
});

const totalNotesCount = computed(() => {
  if (!activeProject.value) return 0;
  let count = 0;
  activeProject.value.tables.forEach(t => {
    if (t.note) count++;
    t.columns.forEach(c => {
      if (c.note) count++;
    });
  });
  return count;
});

const filteredTablesList = computed(() => {
  if (!activeProject.value) return [];
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return activeProject.value.tables;

  return activeProject.value.tables.filter(t => {
    const matchTable = t.name.toLowerCase().includes(query) || (t.note && t.note.toLowerCase().includes(query));
    const matchCol = t.columns.some(c => c.name.toLowerCase().includes(query) || (c.note && c.note.toLowerCase().includes(query)));
    return matchTable || matchCol;
  });
});

const displayedTables = computed(() => {
  if (activeTableFilter.value) {
    return activeProject.value?.tables.filter(t => t.id === activeTableFilter.value) || [];
  }
  return filteredTablesList.value;
});

function scrollToTable(tblId) {
  activeTableFilter.value = null;
  const el = document.getElementById(`doc-table-${tblId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function jumpToCanvasTable(tblId) {
  state.selectedTableId = tblId;
  state.viewMode = 'canvas';
  state.modals.docs = false;
}

function onTableNoteChange(tblId, val) {
  updateTableNote(tblId, val);
}

function onColumnNoteChange(tblId, colIdx, val) {
  updateColumnNote(tblId, colIdx, val);
}

function getTableRelationships(tableName) {
  if (!activeProject.value) return [];
  return activeProject.value.relationships.filter(
    r => r.fromTable === tableName || r.toTable === tableName
  );
}

async function publishDictionary() {
  const proj = activeProject.value;
  if (!proj) return;
  
  isPublishing.value = true;
  try {
    const dictId = 'dict_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const docRef = doc(db, 'published_dictionaries', dictId);
    
    await setDoc(docRef, {
      id: dictId,
      title: proj.name,
      description: proj.description || '',
      dialect: proj.dialect || 'postgres',
      tables: JSON.parse(JSON.stringify(proj.tables)),
      relationships: JSON.parse(JSON.stringify(proj.relationships)),
      publishedBy: state.currentUser.name || 'Anonymous',
      publishedAt: new Date().toISOString(),
      views: 1
    });

    const url = new URL(window.location.href);
    url.searchParams.set('dbdictionary', dictId);
    publishedUrl.value = url.toString();
    showPublishedSuccessModal.value = true;
    
    addToast('dbdictionary Published!', 'Your unique shareable URL is live.', 'success');
  } catch (err) {
    console.error('Failed to publish dbdictionary:', err);
    addToast('Publish Error', err.message || 'Could not publish dbdictionary', 'error');
  } finally {
    isPublishing.value = false;
  }
}

function copyPublishedUrl() {
  navigator.clipboard.writeText(publishedUrl.value);
  publishedCopied.value = true;
  addToast('Copied Link', 'Sharable dbdictionary URL copied to clipboard!', 'success');
  setTimeout(() => {
    publishedCopied.value = false;
  }, 2000);
}

function generateMarkdown() {
  const proj = activeProject.value;
  if (!proj) return '';
  return exportToMarkdownDocs(proj.name, proj.tables, proj.relationships);
}

function copyMarkdown() {
  const md = generateMarkdown();
  navigator.clipboard.writeText(md);
  copied.value = true;
  addToast('Copied Docs', 'Database dictionary Markdown copied to clipboard', 'success');
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

function downloadMarkdown() {
  const md = generateMarkdown();
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${activeProject.value.name.toLowerCase().replace(/\s+/g, '_')}_dbdictionary.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  addToast('Exported Documentation', 'Downloaded Markdown dbdictionary file', 'success');
}
</script>
