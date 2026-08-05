<template>
  <div v-if="state.modals.share" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Users class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm">Real-time Team Collaboration</h3>
        </div>
        <button
          @click="state.modals.share = false"
          class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Invite Link -->
      <div class="p-5 space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Shareable Session Link (Unlimited Users)</label>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="shareUrl"
              class="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-xs select-all outline-none"
            />
            <button
              @click="copyShareLink"
              class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        <div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-start gap-2 text-blue-800 dark:text-blue-300">
          <ShieldCheck class="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p class="leading-relaxed text-[11px]">
            Changes made on the canvas or DBML editor are broadcast live via Firebase Firestore. Anyone with the link can edit simultaneously.
          </p>
        </div>

        <!-- Collaborators List -->
        <div>
          <span class="block font-bold text-slate-700 dark:text-slate-200 mb-2">Active Collaborators ({{ state.collaborators.length }})</span>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="user in state.collaborators"
              :key="user.id"
              class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between bg-white dark:bg-slate-800"
            >
              <div class="flex items-center gap-2.5">
                <img :src="user.avatar" class="w-8 h-8 rounded-full object-cover" />
                <div>
                  <div class="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{{ user.name }}</span>
                    <span
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: user.color }"
                    ></span>
                  </div>
                  <span class="text-[10px] text-slate-400 font-mono">{{ user.email }}</span>
                </div>
              </div>

              <span class="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300">
                {{ user.role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          @click="state.modals.share = false"
          class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs transition"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state, addToast } from '../stores/schemaStore.js';
import { Users, X, Copy, ShieldCheck } from 'lucide-vue-next';

const shareUrl = computed(() => {
  return `${window.location.origin}/#room=${state.roomCode}`;
});

function copyShareLink() {
  navigator.clipboard.writeText(shareUrl.value);
  addToast('Link Copied', 'Shareable room link copied to clipboard', 'success');
}
</script>
