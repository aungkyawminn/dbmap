<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
    <!-- Top Sticky Header Bar -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 transition-colors">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <!-- Brand Logo -->
        <div class="flex items-center gap-3">
          <button
            @click="scrollToTop"
            class="flex items-center gap-2.5 font-bold text-indigo-600 dark:text-indigo-400 text-lg hover:opacity-90 transition cursor-pointer"
            title="dbmaps - Home"
          >
            <DbMapLogo class-name="w-8 h-8 drop-shadow-sm" />
            <span class="font-mono tracking-tight text-slate-900 dark:text-slate-100 text-xl font-extrabold">
              db<span class="text-indigo-600 dark:text-indigo-400">maps</span>
            </span>
          </button>
        </div>

        <!-- Center Nav Anchor Links (Desktop) -->
        <nav class="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <a href="#core-features" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Core Features</a>
          <a href="#interactive-showcase" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Showcase</a>
          <a href="#dialects" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">SQL Dialects</a>
          <a href="#collaboration" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Collaboration</a>
          <button @click="goToMarketplace" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-medium flex items-center gap-1">
            <span>Marketplace</span>
          </button>
          <button @click="goToLearnDbml" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-medium">Learn DBML</button>
          <a href="#faq" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition">FAQ</a>
        </nav>

        <!-- Right Side: Dark Mode Toggle & Main Studio CTA -->
        <div class="flex items-center gap-2.5 sm:gap-3">
          <button
            @click="toggleDarkMode"
            class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            :title="state.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          >
            <Sun v-if="state.isDarkMode" class="w-4 h-4 text-amber-400" />
            <Moon v-else class="w-4 h-4 text-slate-600" />
          </button>

          <!-- Sign In CTA button (when in Guest mode) -->
          <button
            v-if="!state.currentUser.isLoggedIn"
            @click="state.modals.auth = true"
            class="px-2.5 sm:px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            title="Sign in with Google"
          >
            <LogIn class="w-3.5 h-3.5 text-indigo-500" />
            <span class="hidden sm:inline">Sign In</span>
          </button>

          <!-- User Profile Icon with Dropdown Menu -->
          <div class="relative" ref="profileDropdownRef">
            <button
              @click="toggleProfileMenu"
              class="flex items-center justify-center p-0.5 rounded-full border-2 transition shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              :class="[
                isProfileMenuOpen
                  ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
              ]"
              :title="state.currentUser.isLoggedIn ? `${state.currentUser.name} (${state.currentUser.email})` : 'User Profile & Settings (Guest Mode)'"
            >
              <UserAvatar
                :avatar="state.currentUser.avatar || state.currentUser.photoURL"
                :name="state.currentUser.name"
                :is-logged-in="state.currentUser.isLoggedIn"
                size="md"
                :show-status="true"
                :status-color="state.currentUser.isLoggedIn ? '#10b981' : '#94a3b8'"
                :status-title="state.currentUser.isLoggedIn ? 'Google SSO Authenticated' : 'Guest Mode'"
              />
            </button>

            <!-- Profile & Settings Dropdown Panel -->
            <transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="transform scale-95 opacity-0 -translate-y-1"
              enter-to-class="transform scale-100 opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="transform scale-100 opacity-100 translate-y-0"
              leave-to-class="transform scale-95 opacity-0 -translate-y-1"
            >
              <div
                v-if="isProfileMenuOpen"
                class="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-100"
              >
                <!-- Top Identity Card: Avatar, Name, Email, Status -->
                <div class="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/80">
                  <div class="flex items-center gap-3">
                    <UserAvatar
                      :avatar="state.currentUser.avatar || state.currentUser.photoURL"
                      :name="state.currentUser.name"
                      :is-logged-in="state.currentUser.isLoggedIn"
                      size="lg"
                      :show-status="true"
                      :status-color="state.currentUser.isLoggedIn ? '#10b981' : '#94a3b8'"
                      class="border-2 border-indigo-500 shadow-sm shrink-0"
                    />

                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {{ state.currentUser.name || 'Guest Developer' }}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                        {{ state.currentUser.email || 'guest@dbmaps.io' }}
                      </div>
                      <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          :class="state.currentUser.isLoggedIn ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
                        >
                          {{ state.currentUser.isLoggedIn ? 'Google SSO' : 'Guest Mode' }}
                        </span>
                        <span
                          class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                          :class="state.userProfile.tier === 'pro' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'"
                        >
                          <Crown v-if="state.userProfile.tier === 'pro'" class="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <Zap v-else class="w-2.5 h-2.5 text-indigo-500" />
                          {{ state.userProfile.tier || 'free' }} Plan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Settings & Quick Actions List -->
                <div class="p-2 space-y-0.5 text-xs">
                  <!-- Free AI Credits Left Display -->
                  <div
                    v-if="!isUpgradeCreditsEnabled"
                    class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-slate-700 dark:text-slate-200 mb-1"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <Zap class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold text-xs">Free Credits Left</div>
                        <div class="text-[11px] text-slate-400">For AI schema generation</div>
                      </div>
                    </div>
                    <span class="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                      {{ (state.userProfile.creditsRemaining || 0).toLocaleString() }}
                    </span>
                  </div>

                  <!-- AI Credits & Billing (When Upgrade is enabled) -->
                  <button
                    v-else
                    @click="openModal('billing')"
                    class="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between text-slate-700 dark:text-slate-200 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                        <Zap class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">AI Credits & Subscription</div>
                        <div class="text-[11px] text-slate-400">Upgrade tier & view limits</div>
                      </div>
                    </div>
                    <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      {{ (state.userProfile.creditsRemaining || 0).toLocaleString() }}
                    </span>
                  </button>

                  <!-- Account & Google SSO Settings -->
                  <button
                    @click="openModal('auth')"
                    class="w-full px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-left transition flex items-center justify-between text-slate-700 dark:text-slate-200 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <ShieldCheck class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">Account & Identity Settings</div>
                        <div class="text-[11px] text-slate-400">Manage profile & Google SSO sync</div>
                      </div>
                    </div>
                    <ChevronRight class="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <!-- Admin Dashboard (Conditional) -->
                  <button
                    v-if="state.userProfile.role === 'admin' || state.currentUser.email === 'aungkyawminn.aya@gmail.com'"
                    @click="navigateToAdmin"
                    class="w-full px-3 py-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-left transition flex items-center justify-between text-purple-700 dark:text-purple-300 group cursor-pointer"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400">
                        <Crown class="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div class="font-semibold">Admin Dashboard</div>
                        <div class="text-[11px] text-purple-500/80">Manage AI models, credits & payments</div>
                      </div>
                    </div>
                    <ChevronRight class="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <!-- Footer: Sign In or Sign Out -->
                <div class="p-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700/80">
                  <button
                    v-if="state.currentUser.isLoggedIn"
                    @click="handleLogout"
                    class="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-300 font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut class="w-3.5 h-3.5" />
                    <span>Sign Out of Google SSO</span>
                  </button>
                  <button
                    v-else
                    @click="handleLogin"
                    class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <LogIn class="w-3.5 h-3.5" />
                    <span>Sign In with Google SSO</span>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <button
            @click="goToStudio"
            class="px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-indigo-500/20 hover:shadow-lg cursor-pointer"
          >
            <span>Launch Studio</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content Stream -->
    <main class="flex-1 flex flex-col">
      <!-- HERO SECTION -->
      <section class="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800">
        <!-- Subtle Ambient Background Light -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>

        <div class="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          <!-- Eyebrow Pill -->
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles class="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/20" />
            <span>Interactive ERD Studio • Real-time DBML & SQL Architecture</span>
          </div>

          <!-- Main Hero Headline -->
          <h1 class="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.15]">
            Design, Visualize & Document Databases
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-teal-600 dark:from-indigo-400 dark:via-blue-400 dark:to-teal-300">
              at the Speed of Thought
            </span>
          </h1>

          <!-- Hero Subtitle -->
          <p class="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            <strong>dbmaps</strong> combines an interactive drag-and-drop canvas, live bi-directional DBML/SQL editor, Gemini-powered AI schema generation, and real-time team collaboration directly in your browser.
          </p>

          <!-- Action Buttons -->
          <div class="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              @click="goToStudio"
              class="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-sm sm:text-base transition-all flex items-center gap-2.5 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 cursor-pointer"
            >
              <Database class="w-4 h-4" />
              <span>Launch Studio Free</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <button
              @click="loadSampleAndLaunch('E-Commerce Platform')"
              class="px-5 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Layers class="w-4 h-4 text-indigo-500" />
              <span>Explore Sample Schema</span>
            </button>

            <button
              @click="goToMarketplace"
              class="px-5 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 rounded-xl font-bold text-sm sm:text-base border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Store class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Browse Blueprints</span>
            </button>

            <button
              @click="openAiGenAndLaunch"
              class="px-5 py-3.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-sm sm:text-base border border-indigo-300/60 dark:border-indigo-800/80 transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles class="w-4 h-4 text-amber-500" />
              <span>Generate with Presto AI</span>
            </button>
          </div>

          <!-- Feature Badges Row -->
          <div class="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              No credit card or install required
            </span>
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              Live bi-directional code synchronization
            </span>
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              Real-time multi-user collaboration
            </span>
            <span class="flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" />
              Export to Postgres, MySQL, SQLite, MSSQL
            </span>
          </div>

          <!-- Interactive Visual Mockup Preview -->
          <div class="mt-12 sm:mt-16 w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden text-left">
            <!-- Mockup Header Bar -->
            <div class="px-4 py-3 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-400/80"></span>
                <span class="w-3 h-3 rounded-full bg-amber-400/80"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-400/80"></span>
                <span class="ml-2 font-mono text-slate-600 dark:text-slate-400 font-semibold">dbmaps Studio — E-Commerce Schema</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
                  ● SYNC ACTIVE
                </span>
                <button
                  @click="goToStudio"
                  class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                >
                  <span>Open Live Studio</span>
                  <ExternalLink class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Split Interface Mockup -->
            <div class="grid grid-cols-1 md:grid-cols-12 min-h-[340px]">
              <!-- Left: DBML Editor Column (4 cols) -->
              <div class="md:col-span-5 bg-slate-950 text-slate-200 p-4 font-mono text-xs overflow-hidden border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between select-none">
                <div>
                  <div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span class="flex items-center gap-1.5 text-indigo-400 font-semibold">
                      <Code class="w-3.5 h-3.5" /> schema.dbml
                    </span>
                    <span class="text-[10px] text-slate-500">DBML v2</span>
                  </div>
                  <pre class="leading-relaxed text-[11px] text-slate-300">
<span class="text-blue-400">Table</span> <span class="text-amber-300 font-bold">users</span> {
  id <span class="text-indigo-400">bigserial</span> [<span class="text-amber-400">pk</span>, <span class="text-amber-400">unique</span>]
  email <span class="text-indigo-400">varchar(255)</span> [<span class="text-emerald-400">unique</span>, <span class="text-red-400">not null</span>]
  name <span class="text-indigo-400">varchar(100)</span>
  created_at <span class="text-indigo-400">timestamp</span> [<span class="text-slate-400">default: `now()`</span>]
}

<span class="text-blue-400">Table</span> <span class="text-amber-300 font-bold">orders</span> {
  id <span class="text-indigo-400">bigserial</span> [<span class="text-amber-400">pk</span>]
  user_id <span class="text-indigo-400">bigint</span> [<span class="text-red-400">not null</span>]
  total_amount <span class="text-indigo-400">numeric(10,2)</span>
  status <span class="text-indigo-400">varchar(32)</span>
}

<span class="text-purple-400">Ref</span>: orders.user_id &gt; users.id [<span class="text-rose-400">delete: cascade</span>]</pre>
                </div>
                <div class="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span class="text-emerald-400">✓ Syntax valid</span>
                  <span>Two-way live update enabled</span>
                </div>
              </div>

              <!-- Right: ERD Visual Canvas Column (7 cols) -->
              <div class="md:col-span-7 bg-slate-100/70 dark:bg-slate-900/70 p-4 sm:p-6 relative overflow-hidden flex items-center justify-center">
                <!-- Background Grid Dots -->
                <div class="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>

                <!-- ERD Diagram Mockup Cards -->
                <div class="relative z-10 w-full flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                  <!-- Table 1: users -->
                  <div class="w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden text-xs">
                    <div class="bg-indigo-600 text-white px-3 py-2 font-bold flex items-center justify-between text-[11px]">
                      <span class="font-mono">users</span>
                      <span class="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">4 cols</span>
                    </div>
                    <div class="p-2 space-y-1.5 font-mono text-[11px]">
                      <div class="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                        <span>id</span>
                        <span class="text-[9px] px-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded">PK</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span>email</span>
                        <span class="text-[9px] text-emerald-600 dark:text-emerald-400">UQ</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>name</span>
                        <span class="text-[9px]">varchar</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>created_at</span>
                        <span class="text-[9px]">ts</span>
                      </div>
                    </div>
                  </div>

                  <!-- Connector Line -->
                  <div class="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                    <span class="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 rounded font-bold">1 : N</span>
                    <span class="text-xs">──►</span>
                  </div>

                  <!-- Table 2: orders -->
                  <div class="w-52 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden text-xs">
                    <div class="bg-blue-600 text-white px-3 py-2 font-bold flex items-center justify-between text-[11px]">
                      <span class="font-mono">orders</span>
                      <span class="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono">4 cols</span>
                    </div>
                    <div class="p-2 space-y-1.5 font-mono text-[11px]">
                      <div class="flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold">
                        <span>id</span>
                        <span class="text-[9px] px-1 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 rounded">PK</span>
                      </div>
                      <div class="flex items-center justify-between text-purple-600 dark:text-purple-400 font-semibold">
                        <span>user_id</span>
                        <span class="text-[9px] px-1 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded">FK</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span>total_amount</span>
                        <span class="text-[9px]">num</span>
                      </div>
                      <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span>status</span>
                        <span class="text-[9px]">varchar</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 8 COMPREHENSIVE CORE FEATURES GRID -->
      <section id="core-features" class="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Layers class="w-3.5 h-3.5" />
            <span>Complete Feature Suite</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything You Need for Enterprise Database Modeling
          </h2>
          <p class="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Built from the ground up for backend engineers, database architects, and engineering teams. Explore every core capability that makes dbmaps fast, flexible, and reliable.
          </p>
        </div>

        <!-- 8 Core Feature Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Feature 1: Interactive ERD Canvas -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Database class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Interactive ERD Canvas
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag-and-drop table positioning with infinite pan and zoom. Color-code headers, filter relationships, view table tags, and quickly locate tables with smart search.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Auto-layout engines (Grid, Force, Tree)
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                1:1, 1:N, and N:M cardinality tags
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Canvas Minimap & quick-focus search
              </li>
            </ul>
          </div>

          <!-- Feature 2: Bi-directional DBML & SQL Editor -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <FileCode class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Bi-Directional Code Editor
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Live two-way synchronization. Edits in DBML code immediately update the diagram, and visual canvas edits instantly reflect in code with zero lag.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Full DBML v2 syntax support
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Real-time linting & error diagnostics
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Split-screen resizable workspace
              </li>
            </ul>
          </div>

          <!-- Feature 3: Presto AI Schema Assistant -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Sparkles class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Presto AI Assistant
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Describe your requirements in plain English. Presto uses Gemini 3.8 Flash to generate complete, normalized database architectures with fields and relationships.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Prompt to complete schema generation
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Schema optimization & normalization
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Generates realistic dummy mock data
              </li>
            </ul>
          </div>

          <!-- Feature 4: Multi-Dialect Import & Export -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <UploadCloud class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Universal SQL Import & Export
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Paste existing DDL from PostgreSQL, MySQL, SQLite, or MS SQL Server. Export to clean DDL scripts, DBML, PDF reports, or vector SVG/PNG diagrams.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Composite PK & named constraint support
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Foreign key cascade action preservation
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                High-res SVG, PNG & PDF exports
              </li>
            </ul>
          </div>

          <!-- Feature 5: Real-time Multi-User Collaboration -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
                <Users class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Real-Time Team Sync
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Collaborate simultaneously with colleagues. Track live cursor positions and table selections with Google Cloud Firestore backing every update safely.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Live collaborator avatars & status
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Public, Password & Whitelist sharing
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Zero merge conflicts
              </li>
            </ul>
          </div>

          <!-- Feature 6: Data Dictionary & Publishing -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4">
                <BookOpen class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Data Dictionary (`dbdictionary`)
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically generate human-readable schema documentation with field types, nullability, default values, and column notes in a clean catalog.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                One-click public read-only publishing
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Searchable & filterable table catalog
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Markdown field documentation
              </li>
            </ul>
          </div>

          <!-- Feature 7: Version Control & Time Machine -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <History class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Version Control & History
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatic snapshots and named checkpoints let you roll back schema changes safely. Compare iterations and prevent breaking schema changes.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Named version checkpoints
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                One-click schema restoration
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Complete changelog tracking
              </li>
            </ul>
          </div>

          <!-- Feature 8: Folders, Offline-First & Security -->
          <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between">
            <div>
              <div class="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <FolderTree class="w-6 h-6" />
              </div>
              <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Workspace Folders & Offline Resilience
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Organize projects into custom folders. Works offline via browser storage with seamless cloud synchronization once connection is restored.
              </p>
            </div>
            <ul class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Multi-project folder hierarchy
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Offline-first local caching
              </li>
              <li class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Check class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Project cloning & template starters
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE TABBED FEATURE DEEP-DIVE -->
      <section id="interactive-showcase" class="py-16 sm:py-24 px-4 sm:px-8 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div class="max-w-6xl mx-auto">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Experience the Four Pillars of dbmaps
            </h2>
            <p class="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Explore how dbmaps blends intuitive visual design with production-grade engineering tooling.
            </p>
          </div>

          <!-- Showcase Navigation Tabs -->
          <div class="flex items-center justify-center gap-2 sm:gap-3 mb-10 overflow-x-auto pb-2">
            <button
              v-for="tab in showcaseTabs"
              :key="tab.id"
              @click="activeShowcaseTab = tab.id"
              class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 whitespace-nowrap cursor-pointer"
              :class="[
                activeShowcaseTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
              ]"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- Active Tab Content Card -->
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <!-- Explanation Side (5 cols) -->
              <div class="lg:col-span-5 space-y-4">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                  <span>{{ currentShowcase.badge }}</span>
                </div>
                <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
                  {{ currentShowcase.title }}
                </h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {{ currentShowcase.description }}
                </p>

                <div class="pt-4 space-y-2.5">
                  <div
                    v-for="(point, idx) in currentShowcase.highlights"
                    :key="idx"
                    class="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{{ point }}</span>
                  </div>
                </div>

                <div class="pt-6">
                  <button
                    @click="currentShowcase.action"
                    class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>{{ currentShowcase.actionText }}</span>
                    <ArrowRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Interactive Mockup / Code View Side (7 cols) -->
              <div class="lg:col-span-7">
                <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 p-5 font-mono text-xs shadow-inner overflow-hidden">
                  <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                    <span class="flex items-center gap-2 text-indigo-400 font-bold">
                      <component :is="currentShowcase.icon" class="w-4 h-4" />
                      {{ currentShowcase.mockTitle }}
                    </span>
                    <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Preview</span>
                  </div>
                  <pre class="leading-relaxed text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap text-slate-300 font-mono">{{ currentShowcase.mockContent }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SUPPORTED SQL DIALECTS & ECOSYSTEM -->
      <section id="dialects" class="py-16 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div class="text-center max-w-3xl mx-auto mb-14">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Cpu class="w-3.5 h-3.5" />
            <span>Database Engines</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Works with Your Favorite Database Engine
          </h2>
          <p class="mt-3 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Import existing schemas from SQL files, paste DDL statements, or export directly to production-ready migration scripts for major SQL engines.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          <div
            v-for="engine in supportedEngines"
            :key="engine.id"
            @click="launchWithDialect(engine.id, engine.sample)"
            class="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center hover:border-indigo-500/80 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer relative overflow-hidden"
            :title="`Open dbmaps Studio with ${engine.name} support`"
          >
            <!-- Top accent subtle border glow -->
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <!-- Authentic Brand Icon Container -->
            <div class="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-2.5 mb-3 shadow-xs group-hover:scale-110 group-hover:shadow-md transition-transform duration-200">
              <img
                :src="engine.icon"
                :alt="`${engine.name} brand icon`"
                class="w-full h-full object-contain"
                loading="lazy"
              />
            </div>

            <div class="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {{ engine.name }}
            </div>

            <span class="inline-block mt-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border" :class="engine.badgeColor">
              {{ engine.tag }}
            </span>

            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-snug">
              {{ engine.description }}
            </div>

            <div class="mt-3 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open in Studio</span>
              <ArrowRight class="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      <!-- COLLABORATION & SECURITY HIGHLIGHT -->
      <section id="collaboration" class="py-16 sm:py-24 px-4 sm:px-8 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
              <ShieldCheck class="w-3.5 h-3.5" />
              <span>Real-Time Cloud Synchronization</span>
            </div>
            <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for Teams That Move Fast
            </h2>
            <p class="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              No more emailing outdated PDF ER diagrams or resolving messy git conflicts on manual schema files. Share a secure live link with teammates, see who is viewing or editing each table in real time, and protect sensitive architectures with passwords.
            </p>

            <div class="mt-6 space-y-4">
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Users class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">Live Multi-User Cursors</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Teammates can view, arrange, and modify tables simultaneously with instant sync.</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Lock class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">Flexible Access Permissions</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle between Public, Password-protected, or Email-whitelisted collaboration modes.</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                  <BookOpen class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">Public Data Dictionaries</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Publish a read-only interactive documentation URL for frontend devs, QA, and product managers.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Why Teams Choose dbmaps</span>
              <span class="text-xs text-indigo-600 dark:text-indigo-400 font-mono">Comparison</span>
            </h3>

            <div class="space-y-3 text-xs">
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Bi-Directional Code & Canvas Sync</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Yes (Instant)
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Generative AI Schema Modeling</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Built-in (Presto)
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Zero Local Install / Web Native</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> Yes (Pure Browser)
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Multi-Dialect SQL Converter</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> PG, MySQL, SQLite, MSSQL
                </span>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <span class="font-medium text-slate-700 dark:text-slate-300">Data Dictionary Publishing</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 class="w-3.5 h-3.5" /> 1-Click Link
                </span>
              </div>
            </div>

            <button
              @click="goToStudio"
              class="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Try dbmaps Now Free</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- FREQUENTLY ASKED QUESTIONS (FAQ) -->
      <section id="faq" class="py-16 sm:py-24 px-4 sm:px-8 max-w-4xl mx-auto w-full">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <HelpCircle class="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 class="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div class="space-y-4">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition"
          >
            <button
              @click="faq.open = !faq.open"
              class="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
            >
              <span>{{ faq.question }}</span>
              <ChevronDown
                class="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180': faq.open }"
              />
            </button>
            <div
              v-show="faq.open"
              class="px-6 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-3"
            >
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </section>

      <!-- BOTTOM CALL TO ACTION BANNER -->
      <section class="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden border-t border-indigo-800/40">
        <div class="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <h2 class="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            Ready to Model Your Next Database?
          </h2>
          <p class="text-indigo-200 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            No installation, no setup, no credit card required. Jump right into dbmaps Studio and start designing in seconds.
          </p>

          <div class="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              @click="goToStudio"
              class="px-8 py-3.5 bg-white text-indigo-900 hover:bg-indigo-50 active:bg-indigo-100 font-extrabold text-sm sm:text-base rounded-xl transition shadow-xl cursor-pointer flex items-center gap-2"
            >
              <span>Launch dbmaps Studio</span>
              <ArrowRight class="w-4 h-4" />
            </button>

            <button
              @click="loadSampleAndLaunch('SaaS Subscription & Billing')"
              class="px-6 py-3.5 bg-indigo-800/60 hover:bg-indigo-800 text-white border border-indigo-500/40 font-bold text-sm sm:text-base rounded-xl transition cursor-pointer flex items-center gap-2"
            >
              <Layers class="w-4 h-4 text-indigo-300" />
              <span>Try SaaS Billing Template</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER -->
    <footer class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400">
      <div class="max-w-7xl mx-auto space-y-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2.5">
            <DbMapLogo class-name="w-6 h-6" />
            <span class="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">
              db<span class="text-indigo-600 dark:text-indigo-400">maps</span>
            </span>
            <span class="text-slate-300 dark:text-slate-700">|</span>
            <span>Collaborative Database Schema Designer</span>
          </div>

          <!-- Quick Links -->
          <div class="flex items-center gap-5 font-medium flex-wrap justify-center">
            <button @click="scrollToTop" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">Home</button>
            <button @click="goToStudio" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400">Launch Studio</button>
            <button @click="goToMarketplace" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400">Marketplace</button>
            <button @click="goToLearnDbml" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer font-semibold text-purple-600 dark:text-purple-400">Learn DBML</button>
            <button @click="goToLegal('/privacy-policy')" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">Privacy Policy</button>
            <button @click="goToLegal('/terms-of-service')" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer">Terms of Service</button>
          </div>

          <div>
            &copy; {{ new Date().getFullYear() }} dbmaps. All rights reserved.
          </div>
        </div>

        <!-- DBML Original Maker Attribution Line -->
        <div class="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div class="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span class="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Sparkles class="w-3 h-3 text-amber-500" />
              Powered by DBML
            </span>
            <span class="text-slate-300 dark:text-slate-700">•</span>
            <span>DBML specification created by</span>
            <a
              href="https://dbml.org"
              target="_blank"
              rel="noopener noreferrer"
              class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
            >
              Holistics
            </a>
            <span>(dbdiagram.io). dbmaps runs an in-house, zero-dependency lightweight parser.</span>
          </div>

          <button
            @click="goToLearnDbml"
            class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer shrink-0"
          >
            Learn DBML Guide &rarr;
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  state,
  activeProject,
  navigateTo,
  toggleDarkMode,
  importSampleSchemaByName,
  openPrestoAiWithAuthCheck,
  loginWithGoogle,
  logoutUser,
  isUpgradeCreditsEnabled
} from '../stores/schemaStore.js';
import DbMapLogo from './DbMapLogo.vue';
import UserAvatar from './UserAvatar.vue';
import {
  Database,
  FileCode,
  Sparkles,
  UploadCloud,
  Users,
  BookOpen,
  History,
  FolderTree,
  CheckCircle2,
  Check,
  ArrowRight,
  Sun,
  Moon,
  ExternalLink,
  Code,
  Layers,
  Lock,
  Cpu,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  Store,
  LogIn,
  LogOut,
  Crown,
  Zap,
  ChevronRight
} from 'lucide-vue-next';

const isProfileMenuOpen = ref(false);
const profileDropdownRef = ref(null);

function toggleProfileMenu() {
  isProfileMenuOpen.value = !isProfileMenuOpen.value;
}

function openModal(modalKey) {
  isProfileMenuOpen.value = false;
  if (modalKey === 'adminDashboard') {
    navigateTo('/admin');
    return;
  }
  state.modals[modalKey] = true;
}

function navigateToAdmin() {
  isProfileMenuOpen.value = false;
  navigateTo('/admin');
}

function handleLogin() {
  isProfileMenuOpen.value = false;
  loginWithGoogle();
}

function handleLogout() {
  isProfileMenuOpen.value = false;
  logoutUser();
}

function handleGlobalClick(e) {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target)) {
    isProfileMenuOpen.value = false;
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleGlobalClick);
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleGlobalClick);
  }
});

function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function goToStudio() {
  navigateTo('/app');
}

function goToMarketplace() {
  navigateTo('/marketplace');
}

function goToLearnDbml() {
  navigateTo('/learn-dbml');
}

function goToLegal(path) {
  navigateTo(path);
}

function loadSampleAndLaunch(sampleName) {
  try {
    importSampleSchemaByName(sampleName);
  } catch (e) {
    console.warn('Sample import error:', e);
  }
  navigateTo('/app');
}

function openAiGenAndLaunch() {
  const launched = openPrestoAiWithAuthCheck();
  if (launched) {
    navigateTo('/app');
  }
}

// Supported Database Dialects & Authentic Brand Icons
const supportedEngines = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: '/icons/postgresql.svg',
    tag: 'v12 - v17+',
    badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900',
    description: 'Full DDL, serial, UUID, JSONB & cascading constraints',
    sample: 'ecommerce'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    icon: '/icons/mysql.svg',
    tag: 'v5.7 - v8.4+',
    badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
    description: 'InnoDB engine, AUTO_INCREMENT, backticks & FKs',
    sample: 'social'
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    icon: '/icons/sqlite.svg',
    tag: 'v3.x Embedded',
    badgeColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900',
    description: 'Lightweight, embedded & zero-configuration DDL',
    sample: 'blog'
  },
  {
    id: 'mssql',
    name: 'SQL Server',
    icon: '/icons/mssql.svg',
    tag: 'T-SQL 2016+',
    badgeColor: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
    description: 'Bracketed identifiers, clustered PKs & IDENTITY',
    sample: 'ecommerce'
  },
  {
    id: 'mariadb',
    name: 'MariaDB',
    icon: '/icons/mariadb.svg',
    tag: 'v10.x - v11.x',
    badgeColor: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-900',
    description: 'Modern MySQL compatible engine, sequences & JSON',
    sample: 'social'
  },
  {
    id: 'dbml',
    name: 'DBML v2',
    icon: '/icons/dbml.svg',
    tag: 'Standard Spec',
    badgeColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900',
    description: 'Readable, developer-friendly schema definition format',
    sample: 'blog'
  }
];

function launchWithDialect(dialectId, sampleKey) {
  try {
    if (activeProject.value) {
      if (dialectId === 'mssql') {
        activeProject.value.dialect = 'mssql';
      } else if (dialectId === 'mariadb') {
        activeProject.value.dialect = 'mysql';
      } else if (dialectId === 'dbml') {
        activeProject.value.dialect = 'postgres';
      } else {
        activeProject.value.dialect = dialectId;
      }
    }
  } catch (e) {
    console.warn('Dialect switch error:', e);
  }
  goToStudio();
}

// Interactive Feature Showcase Tabs
const activeShowcaseTab = ref('canvas');

const showcaseTabs = [
  { id: 'canvas', label: 'Interactive Canvas', icon: Database },
  { id: 'code', label: 'DBML Code Sync', icon: FileCode },
  { id: 'ai', label: 'Presto AI Assistant', icon: Sparkles },
  { id: 'docs', label: 'Data Dictionary', icon: BookOpen }
];

const currentShowcase = computed(() => {
  switch (activeShowcaseTab.value) {
    case 'code':
      return {
        badge: 'Live Two-Way Synchronization',
        title: 'Write Declarative DBML with Instant Canvas Updates',
        description: 'Code-first developers love DBML. Write intuitive table schemas, column types, and foreign key references. Every keystroke is parsed and visually rendered on the ERD diagram with zero delay.',
        highlights: [
          'Full DBML v2 syntax highlighting with intelligent auto-complete',
          'Instant validation flagging misplaced constraints or syntax typos',
          'Export directly to clean PostgreSQL, MySQL, SQLite, or MSSQL DDL'
        ],
        icon: FileCode,
        actionText: 'Try DBML Editor in Studio',
        action: () => {
          state.viewMode = 'split';
          goToStudio();
        },
        mockTitle: 'schema.dbml (Editable)',
        mockContent: `// DBML Database Definition
Table users {
  id integer [pk, increment]
  email varchar(255) [unique, not null]
  full_name varchar(100)
  role varchar(20) [default: 'member']
  created_at timestamp [default: \`now()\`]
}

Table workspaces {
  id integer [pk, increment]
  owner_id integer [not null]
  name varchar(100) [not null]
}

Ref: workspaces.owner_id > users.id [delete: cascade]`
      };
    case 'ai':
      return {
        badge: 'Powered by Gemini 3.8 Flash',
        title: 'Presto: Natural Language to Normalized Architecture',
        description: 'Stop staring at a blank canvas. Simply describe your business domain or user stories, and Presto generates normalized tables, primary keys, foreign keys, and indexes in seconds.',
        highlights: [
          'Understands real-world business domains (e.g. Healthcare, Fintech, Logistics)',
          'Auto-generates foreign key relationships with appropriate delete rules',
          'Suggests schema optimizations, missing indexes, and normalization'
        ],
        icon: Sparkles,
        actionText: 'Generate Schema with Presto AI',
        action: () => {
          openAiGenAndLaunch();
        },
        mockTitle: 'Presto Prompt & Output',
        mockContent: `Prompt: "A multi-tenant SaaS billing platform with organizations, subscriptions, invoices, and payment methods."

Presto Result:
✓ Created 5 normalized tables: organizations, subscriptions, plans, invoices, payments
✓ Linked 6 foreign key constraints with ON DELETE CASCADE
✓ Configured status enums and decimal currency precisions
✓ Ready to inspect on ERD canvas!`
      };
    case 'docs':
      return {
        badge: 'Team Documentation (dbdictionary)',
        title: 'Automatic Living Data Dictionary for Stakeholders',
        description: 'Keep documentation permanently synchronized with your actual database design. dbmaps generates searchable catalogs detailing every column, data type, constraint, and field description.',
        highlights: [
          'Shareable read-only public URL (/dbdictionary?id=...) for teammates',
          'Full-text search across all tables, column names, and notes',
          'Eliminates outdated architectural wikis and spreadsheets'
        ],
        icon: BookOpen,
        actionText: 'Explore Data Dictionary',
        action: () => {
          state.modals.docs = true;
          goToStudio();
        },
        mockTitle: 'Data Dictionary Catalog',
        mockContent: `Catalog Summary: 8 Tables | 42 Columns | 9 Relationships

Table: subscriptions
• id            bigserial      PRIMARY KEY
• org_id        bigint         FOREIGN KEY -> organizations.id (CASCADE)
• plan_id       varchar(64)    FOREIGN KEY -> plans.id
• status        varchar(32)    Current billing status (active, past_due, canceled)
• renews_at     timestamp      Next automatic billing renewal timestamp`
      };
    case 'canvas':
    default:
      return {
        badge: 'Fluid Visual Workspace',
        title: 'Infinite Visual ERD Canvas with Smart Layouts',
        description: 'Interact directly with your schema. Position cards freely or use auto-layout engines (Grid, Hierarchical, Force) to automatically organize dozens of interconnected tables into clean diagrams.',
        highlights: [
          'Auto-layout engines to clean up messy relationship line crossings',
          'Interactive connector lines displaying 1:1, 1:N, and N:M cardinality',
          'Color-coded table headers, field notes, and quick column badges (PK, FK, UQ)'
        ],
        icon: Database,
        actionText: 'Open Interactive Canvas',
        action: () => {
          state.viewMode = 'canvas';
          goToStudio();
        },
        mockTitle: 'Visual Canvas Layout Engine',
        mockContent: `Canvas Workspace:
• Zoom range: 10% to 200% with smooth wheel and pinch zoom
• Minimap: Top-down radar overview for rapid viewport panning
• Table Search: Instant keyboard-driven auto-focus on any entity
• Snap-to-grid: 16px magnetic alignment for pixel-perfect diagrams`
      };
  }
});

// FAQ Items with Accordion State
const faqs = ref([
  {
    question: 'Is dbmaps free to use?',
    answer: 'Yes! dbmaps is free to use directly in your browser with zero installation. You can create unlimited tables, export SQL DDL, visualize diagrams, and use generous free monthly AI credits for Presto schema generation.',
    open: true
  },
  {
    question: 'Which database dialects and SQL engines are supported?',
    answer: 'dbmaps natively supports PostgreSQL, MySQL, SQLite, and Microsoft SQL Server, in addition to the DBML standard. You can import existing DDL scripts, edit visually, and export formatted SQL for any of these engines with one click.',
    open: false
  },
  {
    question: 'How does real-time collaboration work?',
    answer: 'dbmaps connects to Google Cloud Firestore to provide real-time multi-user editing. When multiple teammates open a shared schema, changes to tables, columns, and relationships update instantly across all active screens with collaborator presence indicators.',
    open: false
  },
  {
    question: 'Does dbmaps connect to or store my production database data?',
    answer: 'No. dbmaps is strictly a schema modeling and design tool. It never connects to your private database servers or accesses actual production data rows. All models represent schema definitions (tables, columns, types, constraints), ensuring 100% data privacy.',
    open: false
  },
  {
    question: 'Can I export my schemas as diagrams or images?',
    answer: 'Yes! You can export your ERD diagrams as high-resolution PNG images, vector SVG files for documentation, or printable PDF architecture reports, as well as raw SQL migration scripts and DBML code.',
    open: false
  },
  {
    question: 'What is DBML and why does dbmaps use it?',
    answer: 'DBML (Database Markup Language) is an open-source schema standard originally invented and open-sourced by Holistics (the creators of dbdiagram.io and dbdocs.io). dbmaps implements an in-house, zero-dependency lightweight client-side DBML engine that enables real-time bidirectional visual diagram synchronization without heavy compiler bloat.',
    open: false
  }
]);
</script>
