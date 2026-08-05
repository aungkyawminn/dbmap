<template>
  <!-- Read-only Standalone Published dbdictionary View -->
  <PublishedDictionaryView v-if="publishedDictId" :dictionary-id="publishedDictId" />

  <!-- Full ERD Studio Workspace -->
  <div v-else class="w-screen h-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none" :class="{ 'cursor-col-resize select-none': isResizing }">
    <!-- Navbar -->
    <Navbar />

    <!-- Main Workspace Layout -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left Sidebar (Tables, Relationships, Folders, History, Settings) -->
      <Sidebar />

      <!-- Center Workspace (Split / Canvas / Editor Views) -->
      <main class="flex-1 flex overflow-hidden relative" ref="workspaceRef">
        <!-- Editor View (Shown in 'split' or 'editor' mode) -->
        <div
          v-if="state.viewMode === 'split' || state.viewMode === 'editor'"
          class="h-full flex-shrink-0 relative overflow-hidden"
          :style="state.viewMode === 'split' ? { width: `${state.editorWidth}px` } : { width: '100%' }"
        >
          <CodeEditor />
        </div>

        <!-- Draggable Resizer Bar (Shown in 'split' mode) -->
        <div
          v-if="state.viewMode === 'split'"
          @mousedown="startResize"
          @touchstart="startResize"
          class="w-2 hover:w-2 bg-slate-300 dark:bg-slate-800/90 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize flex items-center justify-center transition-colors select-none z-20 group relative border-x border-slate-300/80 dark:border-slate-800"
          title="Drag handle to adjust split editor & canvas width"
        >
          <div class="w-1 h-8 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:bg-white group-active:bg-white transition-colors"></div>
        </div>

        <!-- ERD Canvas View (Shown in 'split' or 'canvas' mode) -->
        <div
          v-if="state.viewMode === 'split' || state.viewMode === 'canvas'"
          class="flex-1 h-full relative overflow-hidden min-w-[280px]"
        >
          <Canvas />
        </div>
      </main>
    </div>

    <!-- Toast Notifications Floating Stack -->
    <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      <div
        v-for="toast in state.toasts"
        :key="toast.id"
        class="p-3.5 rounded-xl shadow-xl border backdrop-blur-md text-xs pointer-events-auto flex items-start gap-2.5 transition-all duration-300"
        :class="[
          toast.type === 'success' ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700' :
          toast.type === 'warning' ? 'bg-amber-900/90 text-amber-100 border-amber-700' :
          toast.type === 'error' ? 'bg-red-900/90 text-red-100 border-red-700' :
          'bg-slate-900/90 text-slate-100 border-slate-700'
        ]"
      >
        <div class="flex-1">
          <div class="font-bold text-sm">{{ toast.title }}</div>
          <div class="opacity-90 leading-relaxed mt-0.5">{{ toast.message }}</div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ExportModal />
    <ShareModal />
    <AuthModal />
    <NewTableModal />
    <NewRelModal />
    <NewProjectModal />
    <NewFolderModal />
    <VersionModal />
    <DocsModal />
    <AiGenModal />
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { state } from './stores/schemaStore.js';
import Navbar from './components/Navbar.vue';
import Sidebar from './components/Sidebar.vue';
import CodeEditor from './components/CodeEditor.vue';
import Canvas from './components/Canvas.vue';
import ExportModal from './components/ExportModal.vue';
import ShareModal from './components/ShareModal.vue';
import AuthModal from './components/AuthModal.vue';
import NewTableModal from './components/NewTableModal.vue';
import NewRelModal from './components/NewRelModal.vue';
import NewProjectModal from './components/NewProjectModal.vue';
import NewFolderModal from './components/NewFolderModal.vue';
import VersionModal from './components/VersionModal.vue';
import DocsModal from './components/DocsModal.vue';
import AiGenModal from './components/AiGenModal.vue';
import PublishedDictionaryView from './components/PublishedDictionaryView.vue';

const urlParams = new URLSearchParams(window.location.search);
const publishedDictId = ref(
  urlParams.get('dbdictionary') || urlParams.get('dictionary') || urlParams.get('doc')
);

const workspaceRef = ref(null);
const isResizing = ref(false);

function startResize(e) {
  isResizing.value = true;
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopResize);
}

function handleMouseMove(e) {
  if (!isResizing.value || !workspaceRef.value) return;
  const rect = workspaceRef.value.getBoundingClientRect();
  const newWidth = e.clientX - rect.left;
  const maxW = Math.max(280, rect.width - 280);
  if (newWidth >= 240 && newWidth <= maxW) {
    state.editorWidth = Math.round(newWidth);
  }
}

function handleTouchMove(e) {
  if (!isResizing.value || !workspaceRef.value || !e.touches[0]) return;
  const rect = workspaceRef.value.getBoundingClientRect();
  const newWidth = e.touches[0].clientX - rect.left;
  const maxW = Math.max(280, rect.width - 280);
  if (newWidth >= 240 && newWidth <= maxW) {
    state.editorWidth = Math.round(newWidth);
  }
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopResize);
}

onUnmounted(() => {
  stopResize();
});
</script>
