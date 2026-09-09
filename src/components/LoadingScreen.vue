<template>
  <transition name="loading-fade">
    <div
      v-if="state.isInitialLoading"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none overflow-hidden"
      :class="state.isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-white'"
    >
      <!-- Ambient Background Glow Gradients -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
        <!-- Grid Pattern -->
        <div class="absolute inset-0 bg-grid-pattern opacity-30"></div>
      </div>

      <!-- Main Animated Content Container -->
      <div class="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-6 text-center space-y-6">
        
        <!-- Animated Logo & Radar Pulse -->
        <div class="relative flex items-center justify-center">
          <!-- Pulse rings -->
          <div class="absolute w-28 h-28 rounded-3xl bg-indigo-500/20 animate-ping opacity-75"></div>
          <div class="absolute w-24 h-24 rounded-2xl bg-blue-500/30 animate-pulse"></div>
          
          <!-- Logo container with subtle float -->
          <div class="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-2xl shadow-indigo-500/40 border border-white/20 transform hover:scale-105 transition-transform duration-300">
            <DbMapLogo class-name="w-14 h-14" />
          </div>
        </div>

        <!-- Brand Typography -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-center gap-2">
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              dbmaps
            </h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Studio
            </span>
          </div>
          <p class="text-xs sm:text-sm text-slate-400 font-medium">
            Collaborative Database Schema Designer
          </p>
        </div>

        <!-- Animated Miniature ERD Schema Simulation -->
        <div class="w-full bg-slate-900/80 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl backdrop-blur-md relative overflow-hidden">
          <!-- Miniature ERD Node cards -->
          <div class="flex items-center justify-between gap-2 relative z-10">
            <!-- Node 1: Users -->
            <div class="flex-1 bg-slate-800/90 border border-indigo-500/40 rounded-xl p-2 text-left shadow-xs transition-all duration-500"
                 :class="{ 'ring-2 ring-indigo-500/40': state.initialLoadingProgress >= 30 }">
              <div class="flex items-center gap-1.5 border-b border-slate-700/60 pb-1 mb-1">
                <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span class="text-[10px] font-bold font-mono text-indigo-300">users</span>
              </div>
              <div class="space-y-0.5 font-mono text-[9px] text-slate-400">
                <div class="flex items-center justify-between text-slate-300">
                  <span>id</span>
                  <span class="text-[8px] text-amber-400">PK</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>email</span>
                  <span class="text-[8px] text-slate-500">text</span>
                </div>
              </div>
            </div>

            <!-- Dynamic Connecting Wire with Moving Pulses -->
            <div class="flex items-center justify-center px-1 text-slate-500">
              <div class="relative w-8 h-4 flex items-center">
                <div class="w-full border-t-2 border-dashed border-indigo-400/50"></div>
                <!-- Moving signal pulse -->
                <div class="absolute w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400 animate-signal"></div>
              </div>
            </div>

            <!-- Node 2: Orders -->
            <div class="flex-1 bg-slate-800/90 border border-blue-500/40 rounded-xl p-2 text-left shadow-xs transition-all duration-500"
                 :class="{ 'ring-2 ring-blue-500/40': state.initialLoadingProgress >= 60 }">
              <div class="flex items-center gap-1.5 border-b border-slate-700/60 pb-1 mb-1">
                <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span class="text-[10px] font-bold font-mono text-blue-300">orders</span>
              </div>
              <div class="space-y-0.5 font-mono text-[9px] text-slate-400">
                <div class="flex items-center justify-between text-slate-300">
                  <span>id</span>
                  <span class="text-[8px] text-amber-400">PK</span>
                </div>
                <div class="flex items-center justify-between text-indigo-300">
                  <span>user_id</span>
                  <span class="text-[8px] text-indigo-400">FK</span>
                </div>
              </div>
            </div>

            <!-- Dynamic Connecting Wire 2 -->
            <div class="flex items-center justify-center px-1 text-slate-500">
              <div class="relative w-8 h-4 flex items-center">
                <div class="w-full border-t-2 border-dashed border-teal-400/50"></div>
                <!-- Moving signal pulse -->
                <div class="absolute w-2 h-2 rounded-full bg-teal-400 shadow-sm shadow-teal-400 animate-signal" style="animation-delay: 0.6s;"></div>
              </div>
            </div>

            <!-- Node 3: Items -->
            <div class="flex-1 bg-slate-800/90 border border-teal-500/40 rounded-xl p-2 text-left shadow-xs transition-all duration-500"
                 :class="{ 'ring-2 ring-teal-500/40': state.initialLoadingProgress >= 85 }">
              <div class="flex items-center gap-1.5 border-b border-slate-700/60 pb-1 mb-1">
                <span class="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                <span class="text-[10px] font-bold font-mono text-teal-300">items</span>
              </div>
              <div class="space-y-0.5 font-mono text-[9px] text-slate-400">
                <div class="flex items-center justify-between text-slate-300">
                  <span>id</span>
                  <span class="text-[8px] text-amber-400">PK</span>
                </div>
                <div class="flex items-center justify-between text-blue-300">
                  <span>order_id</span>
                  <span class="text-[8px] text-blue-400">FK</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar and Status Stage -->
        <div class="w-full space-y-2.5">
          <!-- Stage message and percentage -->
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-slate-300 font-medium flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>{{ state.initialLoadingStage || 'Loading database schemas...' }}</span>
            </span>
            <span class="text-indigo-400 font-semibold">{{ Math.round(state.initialLoadingProgress || 25) }}%</span>
          </div>

          <!-- The Progress Bar Track -->
          <div class="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60 shadow-inner">
            <div
              class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 transition-all duration-300 ease-out relative overflow-hidden"
              :style="{ width: `${Math.min(100, Math.max(10, state.initialLoadingProgress || 25))}%` }"
            >
              <!-- Shimmer light bar across progress -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        <!-- Feature Capabilities Pill Strip -->
        <div class="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] font-mono text-slate-400">
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">Postgres</span>
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">MySQL</span>
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">SQLite</span>
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">DBML</span>
          <span class="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">SQL DDL</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { state } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
</script>

<style scoped>
/* Smooth Fade Transition for the Loading Screen Overlay */
.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

/* Moving signal between schema nodes */
@keyframes signalMove {
  0% {
    left: 0%;
    opacity: 0.2;
    transform: scale(0.6);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    left: 100%;
    opacity: 0.2;
    transform: scale(0.6);
  }
}

.animate-signal {
  animation: signalMove 1.4s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

/* Shimmer highlight over progress bar */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 1.5s infinite linear;
}
</style>
