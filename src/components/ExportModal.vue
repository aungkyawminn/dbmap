<template>
  <div v-if="state.modals.export" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
      <!-- Header -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Download class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Export Schema Script</h3>
        </div>
        <button
          @click="state.modals.export = false"
          class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Controls & Format Tabs -->
      <div class="p-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/50">
        <div class="flex items-center gap-2 font-medium">
          <span>Target Output:</span>
          <select
            v-model="format"
            class="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono outline-none focus:border-blue-500"
          >
            <option value="postgres">PostgreSQL (.sql)</option>
            <option value="mysql">MySQL (.sql)</option>
            <option value="sqlite">SQLite (.sql)</option>
            <option value="mssql">MS SQL Server (.sql)</option>
            <option value="dbml">DBML Markup (.dbml)</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="copyToClipboard"
            class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Copy Code</span>
          </button>
          <button
            @click="downloadScript"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5 shadow"
          >
            <FileDown class="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      <!-- Code Preview Area -->
      <div class="p-4 flex-1 overflow-y-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed select-text">
        <pre class="whitespace-pre-wrap">{{ generatedScript }}</pre>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
        <span>Ready for deployment on production databases.</span>
        <button
          @click="state.modals.export = false"
          class="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, activeProject, addToast } from '../stores/schemaStore.js';
import { exportToSQL, generateDBML } from '../utils/dbmlParser.js';
import { Download, X, Copy, FileDown } from 'lucide-vue-next';

const format = ref('postgres');

watch(
  () => state.modals.export,
  (isOpen) => {
    if (isOpen && activeProject.value && activeProject.value.dialect) {
      format.value = activeProject.value.dialect;
    }
  },
  { immediate: true }
);

const generatedScript = computed(() => {
  const proj = activeProject.value;
  if (!proj) return '';
  if (format.value === 'dbml') {
    return generateDBML(proj.tables || [], proj.relationships || [], proj.name);
  }
  return exportToSQL(proj.tables || [], proj.relationships || [], format.value);
});

function copyToClipboard() {
  navigator.clipboard.writeText(generatedScript.value);
  addToast('Copied to Clipboard', 'Schema export script copied', 'success');
}

function downloadScript() {
  const ext = format.value === 'dbml' ? 'dbml' : 'sql';
  const blob = new Blob([generatedScript.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(activeProject.value?.name || 'db_schema').toLowerCase().replace(/\s+/g, '_')}_schema.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
  addToast('Download Started', `Saved ${a.download}`, 'success');
}
</script>
