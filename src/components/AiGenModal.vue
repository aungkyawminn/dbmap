<template>
  <div v-if="state.modals.aiGen" class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-5 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
            <Sparkles class="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 class="font-bold text-sm">AI Schema Generator</h3>
            <p class="text-[11px] text-indigo-100 opacity-90">Instant ERD database design powered by Gemini AI</p>
          </div>
        </div>
        <button @click="state.modals.aiGen = false" class="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-5 overflow-y-auto space-y-4 text-xs flex-1">
        <!-- Error Banner -->
        <div v-if="errorMsg" class="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300 text-xs">
          <AlertTriangle class="w-4 h-4 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="font-semibold">{{ errorMsg }}</p>
            <p class="text-[11px] opacity-90">
              Ensure <code class="font-mono bg-red-100 dark:bg-red-900/60 px-1 py-0.5 rounded">GEMINI_API_KEY</code> is set in platform environment variables.
            </p>
          </div>
        </div>

        <!-- Mode & Dialect selection -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target Mode</label>
            <select
              v-model="mode"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-medium"
            >
              <option value="new">✨ Create New Project</option>
              <option value="extend">🧩 Extend Active Project ({{ activeProject ? activeProject.name : 'Current' }})</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">SQL Dialect</label>
            <select
              v-model="dialect"
              class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 font-mono"
            >
              <option value="postgres">PostgreSQL 15+</option>
              <option value="mysql">MySQL 8.0+</option>
              <option value="sqlite">SQLite 3</option>
              <option value="mssql">SQL Server (T-SQL)</option>
              <option value="snowflake">Snowflake Data Warehouse</option>
            </select>
          </div>
        </div>

        <!-- Prompt Input -->
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center justify-between">
            <span>Describe your application domain or data requirements</span>
            <span class="text-[10px] text-slate-400 font-normal">Gemini 2.5 Flash</span>
          </label>
          <textarea
            v-model="userPrompt"
            rows="4"
            placeholder="e.g. An online food delivery app with customers, restaurants, menu items, orders, order items, delivery riders, driver locations, and customer reviews."
            class="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs leading-relaxed resize-none font-sans"
          ></textarea>
        </div>

        <!-- Quick Inspiration Chips -->
        <div>
          <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Try a sample prompt:</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="(chip, idx) in samplePrompts"
              :key="idx"
              @click="userPrompt = chip.prompt"
              class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] transition text-left border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5"
            >
              <Wand2 class="w-3 h-3 text-indigo-500 shrink-0" />
              <span>{{ chip.label }}</span>
            </button>
          </div>
        </div>

        <!-- Generated Result Preview -->
        <div v-if="previewResult" class="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ previewResult.schemaName || 'Generated Schema' }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
              {{ previewResult.tables ? previewResult.tables.length : 0 }} Tables • {{ previewResult.relationships ? previewResult.relationships.length : 0 }} Refs
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{{ previewResult.description }}</p>

          <div class="grid grid-cols-2 gap-2 pt-1 border-t border-indigo-200/60 dark:border-indigo-800/40 text-[11px]">
            <div v-for="tbl in previewResult.tables" :key="tbl.name" class="p-2 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
              <span class="font-mono font-semibold text-slate-700 dark:text-slate-200">{{ tbl.name }}</span>
              <span class="text-[10px] text-slate-400 font-mono">{{ tbl.columns ? tbl.columns.length : 0 }} cols</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <button
          @click="state.modals.aiGen = false"
          class="px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 transition"
        >
          Cancel
        </button>

        <div class="flex items-center gap-2">
          <button
            v-if="previewResult"
            @click="applySchema"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Check class="w-3.5 h-3.5" />
            <span>Apply to Diagram</span>
          </button>

          <button
            @click="generateSchema"
            :disabled="isLoading || !userPrompt.trim()"
            class="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl transition flex items-center gap-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
            <Sparkles v-else class="w-3.5 h-3.5 text-amber-300" />
            <span>{{ isLoading ? 'Designing Schema...' : (previewResult ? 'Regenerate' : 'Generate with AI') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { state, activeProject, generateSchemaWithAI, applyAiGeneratedSchema } from '../stores/schemaStore.js';
import { Sparkles, X, Wand2, Loader2, AlertTriangle, CheckCircle2, Check } from 'lucide-vue-next';

const mode = ref('new');
const dialect = ref('postgres');
const userPrompt = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const previewResult = ref(null);

const samplePrompts = [
  {
    label: '🛒 E-commerce Store',
    prompt: 'E-commerce platform with users, product categories, products, customer carts, orders, order items, payments, and product reviews.'
  },
  {
    label: '🏥 Hospital & Patients',
    prompt: 'Hospital management system tracking patients, doctors, medical departments, appointments, prescriptions, and billing invoices.'
  },
  {
    label: '🎓 LMS Learning Platform',
    prompt: 'Learning platform with instructors, students, courses, video lessons, course enrollments, quizzes, and student certificates.'
  },
  {
    label: '💼 B2B SaaS Subscriptions',
    prompt: 'Multi-tenant SaaS with organizations, team members, subscription plans, usage metrics, invoices, and API access keys.'
  }
];

watch(
  () => state.modals.aiGen,
  (isOpen) => {
    if (isOpen) {
      errorMsg.value = '';
      previewResult.value = '';
      if (activeProject.value && activeProject.value.dialect) {
        dialect.value = activeProject.value.dialect;
      }
    }
  }
);

async function generateSchema() {
  if (!userPrompt.value.trim()) return;

  isLoading.value = true;
  errorMsg.value = '';
  previewResult.value = null;

  try {
    const result = await generateSchemaWithAI(userPrompt.value, dialect.value, mode.value);
    previewResult.value = result;
  } catch (err) {
    errorMsg.value = err.message || 'Failed to generate schema with Gemini AI';
  } finally {
    isLoading.value = false;
  }
}

function applySchema() {
  if (!previewResult.value) return;
  applyAiGeneratedSchema(previewResult.value, mode.value);
  state.modals.aiGen = false;
}
</script>
