<template>
  <div id="tour-code-editor" class="h-full flex flex-col bg-slate-900 text-slate-100 font-mono text-sm border-r border-slate-800 select-text">
    <!-- Editor Top Header -->
    <div class="px-3.5 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs select-none gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <FileCode class="w-4 h-4 text-blue-400 shrink-0" />
        <span class="font-semibold text-slate-200 truncate">schema.dbml</span>
        <span class="hidden sm:inline text-slate-500 text-[11px] shrink-0">(DBML Syntax)</span>
        <button
          @click="openLearnDbml"
          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/80 text-indigo-400 border border-indigo-800/80 hover:bg-indigo-900 transition cursor-pointer shrink-0"
          title="Learn DBML syntax & see Holistics attribution"
        >
          <BookOpen class="w-3 h-3 text-indigo-400" />
          <span class="hidden xs:inline">Learn DBML</span>
        </button>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <!-- Live Validation Badge / Toggle Drawer -->
        <button
          @click="showDiagnostics = !showDiagnostics"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition border shadow-sm cursor-pointer"
          :class="[
            validationResult.isValid && validationResult.diagnostics.length === 0
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80 hover:bg-emerald-900/80'
              : errorCount > 0
                ? 'bg-rose-950/80 text-rose-400 border-rose-800/80 hover:bg-rose-900/80'
                : 'bg-amber-950/80 text-amber-400 border-amber-800/80 hover:bg-amber-900/80'
          ]"
          :title="showDiagnostics ? 'Hide Validation Drawer' : 'View Validation Diagnostics'"
        >
          <CheckCircle2 v-if="validationResult.isValid && validationResult.diagnostics.length === 0" class="w-3.5 h-3.5 text-emerald-400" />
          <AlertTriangle v-else class="w-3.5 h-3.5" />
          <span>
            {{ validationResult.isValid && validationResult.diagnostics.length === 0 ? 'DBML Valid' : `${errorCount} Err, ${warningCount} Warn` }}
          </span>
          <ChevronUp v-if="showDiagnostics" class="w-3 h-3 ml-0.5" />
          <ChevronDown v-else class="w-3 h-3 ml-0.5" />
        </button>

        <button
          @click="formatCode"
          title="Auto Format DBML Code"
          class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition flex items-center gap-1.5 border border-slate-700 active:scale-95"
        >
          <Wand2 class="w-3.5 h-3.5 text-amber-400" />
          <span>Format</span>
        </button>
      </div>
    </div>

    <!-- Main Code Mirror Editor Body -->
    <div class="relative flex-1 flex overflow-hidden bg-slate-950">
      <div
        ref="cmEditorContainer"
        class="w-full h-full overflow-hidden text-xs font-mono"
      ></div>
    </div>

    <!-- Diagnostics / Validation Error Panel (Drawer) -->
    <div
      v-if="showDiagnostics"
      class="h-36 bg-slate-950 border-t border-slate-800 flex flex-col transition-all duration-200 shrink-0"
    >
      <div class="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <div class="flex items-center gap-2">
          <SlidersHorizontal class="w-3.5 h-3.5 text-blue-400" />
          <span>DBML Sentence Validation & Diagnostics</span>
          <span v-if="validationResult.diagnostics.length > 0" class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
            {{ validationResult.diagnostics.length }} issues found
          </span>
        </div>
        <button
          @click="showDiagnostics = false"
          class="text-slate-500 hover:text-slate-300 transition"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Diagnostics List -->
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div
          v-if="validationResult.diagnostics.length === 0"
          class="h-full flex items-center justify-center text-xs text-emerald-400 gap-1.5"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>All DBML sentences and syntax blocks are perfectly valid!</span>
        </div>

        <div
          v-for="(diag, idx) in validationResult.diagnostics"
          :key="idx"
          @click="jumpToLine(diag.line)"
          class="px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition cursor-pointer flex items-center justify-between gap-3 text-xs group"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
              :class="diag.severity === 'error' ? 'bg-rose-950 text-rose-400 border border-rose-800/80' : 'bg-amber-950 text-amber-400 border border-amber-800/80'"
            >
              Line {{ diag.line }}
            </span>
            <span class="text-slate-300 truncate font-mono text-[11px]">{{ diag.message }}</span>
          </div>
          <span class="text-[10px] font-mono text-slate-500 group-hover:text-blue-400 shrink-0 transition">
            Jump to line &rarr;
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Status Bar -->
    <div class="px-3.5 py-1.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between select-none shrink-0">
      <div class="flex items-center gap-3">
        <span v-if="validationResult.isValid" class="flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 class="w-3.5 h-3.5" /> DBML Synced
        </span>
        <span v-else class="flex items-center gap-1 text-rose-400 font-medium">
          <AlertCircle class="w-3.5 h-3.5" /> Syntax Errors
        </span>
        <span class="hidden sm:inline text-slate-500">|</span>
        <span>Line {{ activeLine }}</span>
        <span class="hidden sm:inline text-slate-500">|</span>
        <span>{{ activeProject.tables.length }} Tables</span>
      </div>
      <div class="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
        <button
          @click="openLearnDbml"
          class="hover:text-indigo-400 transition flex items-center gap-1 cursor-pointer"
          title="Powered by DBML (Language created by Holistics). Click to learn DBML syntax."
        >
          <Sparkles class="w-3 h-3 text-amber-400" />
          <span class="font-semibold text-slate-400 hover:text-indigo-300">Powered by DBML</span>
        </button>
        <span class="text-slate-700 hidden sm:inline">•</span>
        <a
          href="https://dbml.org"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-slate-300 transition hidden sm:inline-flex items-center gap-0.5 text-[10px]"
          title="DBML open source specification created by Holistics"
        >
          <span>by Holistics</span>
          <ExternalLink class="w-2.5 h-2.5 opacity-60" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { activeProject, state, addToast, navigateTo } from '../stores/schemaStore.js';
import { generateDBML, parseDBML, validateDBML } from '../utils/dbmlParser.js';
import {
  dbmlLanguage,
  dbmlHighlightStyleDark,
  dbmlHighlightStyleLight,
  createEditorTheme
} from '../utils/dbmlCodeMirror.js';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import {
  FileCode,
  Wand2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  X,
  BookOpen,
  Sparkles,
  ExternalLink
} from 'lucide-vue-next';

function openLearnDbml() {
  navigateTo('/learn-dbml');
}

const cmEditorContainer = ref(null);
let editorView = null;

const dbmlContent = ref('');
const showDiagnostics = ref(false);
const activeLine = ref(1);

const validationResult = computed(() => {
  return validateDBML(dbmlContent.value);
});

const errorCount = computed(() => {
  return validationResult.value.diagnostics.filter(d => d.severity === 'error').length;
});

const warningCount = computed(() => {
  return validationResult.value.diagnostics.filter(d => d.severity === 'warning').length;
});

function initCodeMirror() {
  if (!cmEditorContainer.value) return;

  const isDark = state.isDarkMode;
  const initialText = generateDBML(
    activeProject.value.tables,
    activeProject.value.relationships,
    activeProject.value.name
  );
  dbmlContent.value = initialText;

  const startState = EditorState.create({
    doc: initialText,
    extensions: [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      dbmlLanguage,
      syntaxHighlighting(isDark ? dbmlHighlightStyleDark : dbmlHighlightStyleLight),
      createEditorTheme(isDark),
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          const mainSel = update.state.selection.main;
          activeLine.value = update.state.doc.lineAt(mainSel.head).number;
        }

        if (update.docChanged) {
          const newDocText = update.state.doc.toString();
          dbmlContent.value = newDocText;
          onCodeMirrorChange(newDocText);
        }
      })
    ]
  });

  editorView = new EditorView({
    state: startState,
    parent: cmEditorContainer.value
  });
}

function updateEditorText(newText) {
  if (!editorView) return;
  const currentDoc = editorView.state.doc.toString();
  if (currentDoc !== newText) {
    editorView.dispatch({
      changes: { from: 0, to: currentDoc.length, insert: newText }
    });
    dbmlContent.value = newText;
  }
}

function onCodeMirrorChange(newText) {
  try {
    const { tables, relationships } = parseDBML(newText);
    if (tables && tables.length >= 0) {
      const existingTablesMap = new Map();
      if (activeProject.value && activeProject.value.tables) {
        activeProject.value.tables.forEach((t) => {
          existingTablesMap.set(t.name.toLowerCase(), t);
        });
      }

      const mergedTables = tables.map((newTbl) => {
        const existing = existingTablesMap.get(newTbl.name.toLowerCase());
        if (existing) {
          return {
            ...newTbl,
            id: existing.id,
            x: existing.x,
            y: existing.y,
            headerColor: existing.headerColor || newTbl.headerColor
          };
        }
        return newTbl;
      });

      activeProject.value.tables = mergedTables;
      activeProject.value.relationships = relationships;
    }
  } catch (err) {
    // Graceful error handling during syntax typing
  }
}

function jumpToLine(lineNum) {
  if (!editorView) return;
  const doc = editorView.state.doc;
  const targetLine = Math.min(Math.max(1, lineNum), doc.lines);
  const lineInfo = doc.line(targetLine);

  editorView.dispatch({
    selection: { anchor: lineInfo.from, head: lineInfo.from },
    scrollIntoView: true
  });
  editorView.focus();
}

function formatCode() {
  if (activeProject.value) {
    const formatted = generateDBML(
      activeProject.value.tables,
      activeProject.value.relationships,
      activeProject.value.name
    );
    updateEditorText(formatted);
    addToast('Code Formatted', 'Cleaned up DBML syntax formatting & structure', 'info');
  }
}

// Re-theme CodeMirror when dark mode toggles
watch(
  () => state.isDarkMode,
  () => {
    if (editorView) {
      editorView.destroy();
      initCodeMirror();
    }
  }
);

// Watch store updates (e.g. table dragged on canvas) to keep CodeMirror updated
watch(
  () => activeProject.value.updatedAt,
  () => {
    if (editorView && !editorView.hasFocus) {
      const newText = generateDBML(
        activeProject.value.tables,
        activeProject.value.relationships,
        activeProject.value.name
      );
      updateEditorText(newText);
    }
  }
);

onMounted(() => {
  initCodeMirror();
});

onUnmounted(() => {
  if (editorView) {
    editorView.destroy();
  }
});
</script>

<style scoped>
.tab-4 {
  tab-size: 4;
}
</style>

