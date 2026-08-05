<template>
  <header class="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/80 px-4 flex items-center justify-between select-none z-30 shrink-0">
    <!-- Left Section: Logo & Sidebar Toggle & Project Name -->
    <div class="flex items-center gap-2 sm:gap-3">
      <!-- Sidebar Toggle Button -->
      <button
        @click="state.isSidebarCollapsed = !state.isSidebarCollapsed"
        :title="state.isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        class="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition flex items-center justify-center"
        :class="{ 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400': !state.isSidebarCollapsed }"
      >
        <PanelLeftClose v-if="!state.isSidebarCollapsed" class="w-4 h-4" />
        <PanelLeftOpen v-else class="w-4 h-4" />
      </button>

      <div class="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 text-lg">
        <DbMapLogo class-name="w-8 h-8 drop-shadow-sm" />
        <span class="hidden sm:inline font-mono tracking-tight text-slate-800 dark:text-slate-100">db<span class="text-indigo-600 dark:text-indigo-400">map</span></span>
      </div>

      <div class="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <!-- Project Name Input -->
      <div class="flex items-center gap-1.5">
        <input
          v-model="activeProject.name"
          type="text"
          class="font-semibold text-slate-800 dark:text-slate-100 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 px-2 py-1 rounded-lg outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 transition text-sm max-w-[180px] sm:max-w-[260px] truncate"
        />
        <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
          Sync Live
        </span>
      </div>
    </div>

    <!-- Center Section: View Mode Switcher -->
    <div class="hidden md:flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
      <button
        @click="state.viewMode = 'split'"
        class="px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5"
        :class="[
          state.viewMode === 'split'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
      >
        <Columns class="w-3.5 h-3.5" />
        <span>Split View</span>
      </button>

      <button
        @click="state.viewMode = 'canvas'"
        class="px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5"
        :class="[
          state.viewMode === 'canvas'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
      >
        <LayoutGrid class="w-3.5 h-3.5" />
        <span>Canvas</span>
      </button>

      <button
        @click="state.viewMode = 'editor'"
        class="px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5"
        :class="[
          state.viewMode === 'editor'
            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        ]"
      >
        <Code2 class="w-3.5 h-3.5" />
        <span>DBML Code</span>
      </button>
    </div>

    <!-- Right Section: Actions, Collaboration, Theme, User Auth -->
    <div class="flex items-center gap-2">
      <!-- Active Collaborators Facepile -->
      <div
        @click="state.modals.share = true"
        title="Active Collaborators (Click to Invite)"
        class="flex items-center -space-x-1.5 cursor-pointer hover:opacity-90 transition pr-1"
      >
        <img
          v-for="user in state.collaborators"
          :key="user.id"
          :src="user.avatar"
          :alt="user.name"
          class="w-7 h-7 rounded-full border-2 border-white dark:border-slate-800 object-cover shadow-xs"
        />
        <div
          v-if="state.collaborators.length > 3"
          class="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[10px] border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-xs"
        >
          +{{ state.collaborators.length - 3 }}
        </div>
        <div
          v-else
          class="w-7 h-7 rounded-full bg-blue-50 dark:bg-slate-700/80 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold text-xs border-2 border-white dark:border-slate-800 flex items-center justify-center transition shadow-xs"
          title="Invite collaborators"
        >
          +
        </div>
      </div>

      <!-- Share Button -->
      <button
        @click="state.modals.share = true"
        class="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-600 dark:text-blue-300 rounded-lg transition font-medium text-xs flex items-center gap-1.5"
      >
        <Users class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Share</span>
      </button>

      <!-- AI Schema Assistant Button -->
      <button
        @click="state.modals.aiGen = true"
        title="AI Prompt to ERD Schema Generator (Gemini AI)"
        class="px-3 py-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg transition font-semibold text-xs flex items-center gap-1.5 shadow-sm"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span class="hidden sm:inline">AI Schema</span>
      </button>

      <!-- dbdictionary Documentation Generator Button -->
      <button
        @click="state.modals.docs = true"
        title="Generate & Publish Database Dictionary (dbdictionary)"
        class="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 rounded-lg transition font-semibold text-xs flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/60"
      >
        <BookOpen class="w-3.5 h-3.5 text-indigo-500" />
        <span>dbdictionary</span>
      </button>

      <!-- Export SQL Button -->
      <button
        @click="state.modals.export = true"
        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-xs flex items-center gap-1.5 shadow-sm"
      >
        <Download class="w-3.5 h-3.5" />
        <span>Export SQL</span>
      </button>

      <div class="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <!-- Dark Mode Toggle -->
      <button
        @click="toggleDarkMode"
        title="Toggle Dark / Light Mode"
        class="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
      >
        <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
        <Moon v-else class="w-4 h-4 text-slate-600" />
      </button>

      <!-- User Auth Trigger / Google SSO Button -->
      <button
        @click="state.modals.auth = true"
        title="Google SSO Account & Cloud Sync Settings"
        class="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 transition"
      >
        <div class="relative">
          <img
            :src="state.currentUser.avatar"
            alt="User Profile"
            class="w-6 h-6 rounded-full object-cover border border-blue-500"
          />
          <span
            class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-white dark:border-slate-800"
            :class="state.currentUser.isLoggedIn ? 'bg-emerald-500' : 'bg-slate-400'"
          ></span>
        </div>
        <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden md:inline max-w-[100px] truncate">
          {{ state.currentUser.isLoggedIn ? state.currentUser.name : 'Sign In' }}
        </span>
      </button>
    </div>
  </header>
</template>

<script setup>
import { state, activeProject, toggleDarkMode } from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import {
  Database,
  Map,
  Columns,
  LayoutGrid,
  Code2,
  Users,
  Download,
  BookOpen,
  Sparkles,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next';
</script>
