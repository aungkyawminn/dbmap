<template>
  <div v-if="state.modals.newProject" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-xs">Create Schema Project</h3>
        <button @click="state.modals.newProject = false" class="p-1 text-slate-400 hover:text-slate-600 rounded">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-4 space-y-3 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Project Name</label>
          <input
            v-model="projectName"
            type="text"
            placeholder="e.g. Analytics Engine"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Select Database</label>
          <select
            v-model="folderId"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
          >
            <option v-for="f in (state.databases || state.folders)" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Starter Template</label>
          <select
            v-model="template"
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">Blank Schema (Clean & empty)</option>
            <option value="E-Commerce Database">E-Commerce Template (6 tables)</option>
            <option value="SaaS Billing & Subscriptions">SaaS Billing Template (3 tables)</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Description (Optional)</label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Architecture notes..."
            class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
        <button @click="state.modals.newProject = false" class="px-3 py-1.5 text-slate-600 dark:text-slate-300">Cancel</button>
        <button @click="confirm" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">Create Schema</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, createProject } from '../stores/schemaStore.js';
import { X } from 'lucide-vue-next';

const projectName = ref('');
const folderId = ref(state.folders[0]?.id || 'folder-1');
const description = ref('');
const template = ref('');

function confirm() {
  if (!projectName.value.trim()) return;
  createProject(projectName.value.trim(), folderId.value, description.value, template.value || null);
  projectName.value = '';
  description.value = '';
  template.value = '';
  state.modals.newProject = false;
}
</script>
