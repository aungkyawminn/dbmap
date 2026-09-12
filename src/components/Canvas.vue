<template>
  <div
    id="canvas-container"
    ref="canvasContainer"
    class="relative w-full h-full overflow-hidden bg-slate-50 dark:bg-slate-900 bg-grid-pattern select-none flex-1"
    :class="[
      isCurrentlyPanning
        ? 'cursor-grabbing'
        : isPanningModeActive || isSpacePressed
          ? 'cursor-grab'
          : 'cursor-default'
    ]"
    @wheel.prevent="onWheel"
    @mousedown="onCanvasMouseDown"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Top Floating Toolbar -->
    <div id="tour-canvas-toolbar" class="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs">
      <!-- Pan / Move Tool Toggle Button -->
      <button
        @click="isPanningModeActive = !isPanningModeActive"
        :title="isPanningModeActive ? 'Pan Tool Active (Click & drag anywhere)' : 'Pan Canvas Tool (Or hold Space / Drag background)'"
        class="px-2 py-1 rounded transition flex items-center gap-1.5 font-medium"
        :class="[
          isPanningModeActive || isSpacePressed
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
        ]"
      >
        <Hand class="w-3.5 h-3.5" />
        <span class="hidden sm:inline">Pan Canvas</span>
      </button>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Zoom In/Out -->
      <button
        @click="zoomIn"
        title="Zoom In"
        class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition"
      >
        <ZoomIn class="w-4 h-4" />
      </button>
      <span class="font-mono text-slate-600 dark:text-slate-300 w-12 text-center font-medium">
        {{ Math.round(state.zoomLevel * 100) }}%
      </span>
      <button
        @click="zoomOut"
        title="Zoom Out"
        class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition"
      >
        <ZoomOut class="w-4 h-4" />
      </button>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Reset Canvas View -->
      <button
        @click="resetZoom"
        title="Reset Canvas Zoom & Position"
        class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 transition flex items-center gap-1"
      >
        <Maximize2 class="w-4 h-4" />
      </button>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Auto Arrange / Auto Layout Button -->
      <button
        @click="autoArrangeTables"
        title="Auto Arrange Tables cleanly in logical flow with crossing minimization"
        class="px-2.5 py-1 bg-indigo-50 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg transition flex items-center gap-1.5 shadow-sm border border-indigo-200/50 dark:border-slate-600"
      >
        <LayoutGrid class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
        <span>Auto Arrange</span>
      </button>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Line Style Toggle Button -->
      <button
        @click="lineStyle = lineStyle === 'orthogonal' ? 'curved' : 'orthogonal'"
        :title="`Line Routing: ${lineStyle === 'orthogonal' ? 'Smart Orthogonal Elbows' : 'Smooth Bezier Curves'}`"
        class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5"
      >
        <GitCommit class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span class="capitalize hidden sm:inline">{{ lineStyle }} Lines</span>
      </button>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Table View Options (dbdiagram.io pro feature: All Fields, Tables Only, Keys Only) -->
      <div class="relative" ref="viewModeDropdownRef">
        <button
          type="button"
          @click.stop="showViewModeDropdown = !showViewModeDropdown"
          :title="`Table View Mode: ${currentViewModeLabel}. Click to switch between 1. All Fields, 2. Tables Only, 3. Keys Only.`"
          class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs border border-transparent"
          :class="{ 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-slate-600 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-slate-500': showViewModeDropdown }"
        >
          <component :is="currentViewModeIcon" class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span class="hidden sm:inline font-medium">{{ currentViewModeLabel }}</span>
          <ChevronDown class="w-3 h-3 text-slate-400 transition-transform duration-200" :class="{ 'rotate-180': showViewModeDropdown }" />
        </button>

        <!-- View Mode Dropdown Menu -->
        <div
          v-if="showViewModeDropdown"
          @click.stop
          class="absolute left-0 top-full mt-1.5 z-50 w-60 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl text-slate-800 dark:text-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div class="px-2 py-1 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Table Density</span>
            <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold rounded border border-indigo-200 dark:border-indigo-800">PRO FEATURE</span>
          </div>

          <div class="space-y-1">
            <!-- 1. All Fields -->
            <button
              type="button"
              @click="selectDisplayMode('all')"
              class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
              :class="state.tableDisplayMode === 'all' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <Columns class="w-3.5 h-3.5" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span>1. All fields</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">Full columns, data types & notes</div>
                </div>
              </div>
              <Check v-if="state.tableDisplayMode === 'all'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </button>

            <!-- 2. Tables Only -->
            <button
              type="button"
              @click="selectDisplayMode('tables')"
              class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
              :class="state.tableDisplayMode === 'tables' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-md flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <TableIcon class="w-3.5 h-3.5" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span>2. Tables only</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">Compact headers for bird's-eye view</div>
                </div>
              </div>
              <Check v-if="state.tableDisplayMode === 'tables'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </button>

            <!-- 3. Keys Only -->
            <button
              type="button"
              @click="selectDisplayMode('keys')"
              class="w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition cursor-pointer"
              :class="state.tableDisplayMode === 'keys' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'"
            >
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded-md flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Key class="w-3.5 h-3.5" />
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span>3. Keys only</span>
                  </div>
                  <div class="text-[10px] text-slate-400 font-normal">Primary (PK) & Foreign (FK) keys</div>
                </div>
              </div>
              <Check v-if="state.tableDisplayMode === 'keys'" class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      <div class="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5"></div>

      <!-- Quick Add Table Button -->
      <button
        @click="state.modals.newTable = true"
        class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-1.5 shadow-sm"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>Add Table</span>
      </button>

      <!-- Quick Add Foreign Key Button -->
      <button
        @click="state.modals.newRel = true"
        class="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition flex items-center gap-1.5"
      >
        <Link class="w-3.5 h-3.5" />
        <span>New Ref</span>
      </button>
    </div>

    <!-- Active Pan Indicator Toast Banner -->
    <div
      v-if="isPanningModeActive || isSpacePressed"
      class="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-blue-600 text-white font-mono text-xs rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-pulse"
    >
      <Move class="w-3.5 h-3.5" />
      <span>Pan Canvas Active — Drag anywhere to move schema view</span>
    </div>

    <!-- Scalable Canvas Viewport -->
    <div
      class="absolute inset-0 origin-top-left transition-transform duration-75"
      :style="{
        transform: `translate(${state.panOffset.x}px, ${state.panOffset.y}px) scale(${state.zoomLevel})`
      }"
    >
      <!-- SVG Layer for Foreign Key Relationship Lines & Badges -->
      <svg class="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-20">
        <defs>
          <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="badge-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.22" />
          </filter>
        </defs>

        <!-- LAYER 1: RELATIONSHIP PATHS & HOVER HITBOXES -->
        <g id="rel-paths-layer">
          <g v-for="rel in sortedRelationshipsForLines" :key="'line-' + rel.id" class="group/rel">
            <!-- Outer Highlight Glow when Hovered / Selected -->
            <path
              :d="rel.pathD"
              fill="none"
              :stroke="rel.isSelected || hoveredRelId === rel.id ? (rel.isOptional ? '#818cf8' : '#3b82f6') : 'transparent'"
              stroke-width="8"
              stroke-opacity="0.28"
              stroke-linecap="round"
              class="transition-all duration-200"
            />

            <!-- Main ERD Relationship Path: SOLID for standard (>), DASHED for optional (>?) -->
            <path
              :d="rel.pathD"
              fill="none"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional
                    ? (state.isDarkMode ? '#818cf8' : '#6366f1')
                    : (state.isDarkMode ? '#64748b' : '#94a3b8'))"
              :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2.5 : (rel.isOptional ? 2 : 1.8)"
              :stroke-dasharray="rel.isOptional ? '7,4' : undefined"
              stroke-linecap="round"
              class="transition-all duration-150"
            />

            <!-- Wide Invisible Path for Easy Mouse Click / Hover Detection -->
            <path
              :d="rel.pathD"
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="cursor-pointer pointer-events-auto"
              @click="selectRel(rel.id)"
              @mouseenter="hoveredRelId = rel.id"
              @mouseleave="hoveredRelId = null"
            />
          </g>
        </g>

        <!-- LAYER 2: ANCHOR DOTS & ENDPOINT BADGES -->
        <g id="rel-endpoints-layer" class="pointer-events-none">
          <g v-for="rel in relationshipsWithCoords" :key="'endpoints-' + rel.id">
            <!-- Anchor Dot 1 (From / FK side): Hollow ring for optional (>?), solid dot for standard (>) -->
            <circle
              :cx="rel.x1"
              :cy="rel.y1"
              :r="rel.isOptional ? 4.5 : 4"
              :fill="rel.isOptional ? (state.isDarkMode ? '#0f172a' : '#ffffff') : (rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b')"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#0f172a' : '#ffffff'))"
              :stroke-width="rel.isOptional ? 2.5 : 2"
              class="transition-colors"
            />
            <!-- Anchor Dot 2 (To / PK side): Solid dot -->
            <circle
              :cx="rel.x2"
              :cy="rel.y2"
              r="4"
              :fill="rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b'"
              :stroke="state.isDarkMode ? '#0f172a' : '#ffffff'"
              stroke-width="2"
              class="transition-colors"
            />

            <!-- Endpoint Cardinality Badges near Anchor Dots -->
            <g :transform="`translate(${rel.fromBadgeX}, ${rel.fromBadgeY})`">
              <rect
                :x="-(rel.fromLabelWidth / 2)"
                y="-10"
                :width="rel.fromLabelWidth"
                height="20"
                rx="6"
                :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
                :stroke="rel.isSelected || hoveredRelId === rel.id
                  ? (rel.isOptional ? '#818cf8' : '#2563eb')
                  : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#475569' : '#3b82f6'))"
                :stroke-dasharray="rel.isOptional ? '3,2' : undefined"
                stroke-width="1.8"
                class="transition-colors shadow-xs"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="central"
                :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#38bdf8' : '#1d4ed8')"
                style="font-size: 10px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
              >
                {{ rel.fromLabel }}
              </text>
            </g>

            <g :transform="`translate(${rel.toBadgeX}, ${rel.toBadgeY})`">
              <rect
                :x="-(rel.toLabelWidth / 2)"
                y="-10"
                :width="rel.toLabelWidth"
                height="20"
                rx="6"
                :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
                :stroke="rel.isSelected || hoveredRelId === rel.id ? (state.isDarkMode ? '#38bdf8' : '#2563eb') : (state.isDarkMode ? '#475569' : '#3b82f6')"
                stroke-width="1.8"
                class="transition-colors shadow-xs"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="central"
                :fill="state.isDarkMode ? '#38bdf8' : '#1d4ed8'"
                style="font-size: 10px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
              >
                {{ rel.toLabel }}
              </text>
            </g>
          </g>
        </g>

        <!-- LAYER 3: MIDPOINT CARDINALITY LABELS & TOOLTIPS (ALWAYS IN FRONT OF LINES) -->
        <g id="rel-labels-layer">
          <g
            v-for="rel in sortedRelationshipsForLabels"
            :key="'label-' + rel.id"
            :transform="`translate(${rel.midX}, ${rel.midY})`"
            class="pointer-events-auto cursor-pointer select-none"
            @click="selectRel(rel.id)"
            @mouseenter="hoveredRelId = rel.id"
            @mouseleave="hoveredRelId = null"
          >
            <!-- Badge background pill with solid fill and elevated shadow -->
            <rect
              :x="hoveredRelId === rel.id ? -(rel.hoverWidth / 2) : -(rel.pillWidth / 2)"
              y="-14"
              :width="hoveredRelId === rel.id ? rel.hoverWidth : rel.pillWidth"
              height="28"
              rx="14"
              :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
              :stroke="rel.isSelected || hoveredRelId === rel.id
                ? (rel.isOptional ? '#6366f1' : '#2563eb')
                : (rel.isOptional ? (state.isDarkMode ? '#818cf8' : '#6366f1') : (state.isDarkMode ? '#475569' : '#64748b'))"
              :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2.5 : 1.5"
              :stroke-dasharray="rel.isOptional && hoveredRelId !== rel.id ? '4,2.5' : undefined"
              filter="url(#badge-shadow)"
              class="transition-all duration-200"
            />

            <!-- Standard Cardinality view -->
            <text
              v-if="hoveredRelId !== rel.id"
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#f8fafc' : '#0f172a')"
              style="font-size: 11px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.025em;"
            >
              {{ rel.displayCardinality }}
            </text>

            <!-- Expanded Info on Hover / Focus -->
            <text
              v-else
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="rel.isOptional ? (state.isDarkMode ? '#a5b4fc' : '#4f46e5') : (state.isDarkMode ? '#38bdf8' : '#2563eb')"
              style="font-size: 10.5px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, monospace;"
            >
              {{ rel.hoverInfo }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Table Cards -->
      <div class="relative z-10" :class="{ 'pointer-events-none': isPanningModeActive || isSpacePressed }">
        <TableCard
          v-for="tbl in activeProject.tables"
          :key="tbl.id"
          :table="tbl"
          :is-selected="state.selectedTableId === tbl.id"
          :zoom="state.zoomLevel"
          @update-position="updateTablePos"
          @select-table="selectTable"
          @add-column="openAddCol"
          @delete-column="delCol"
          @delete-table="delTbl"
        />
      </div>

      <!-- Live Collaborators Realtime Cursors -->
      <template v-for="collab in state.collaborators" :key="collab.id">
        <div
          v-if="collab && collab.id !== state.currentUser?.id && !collab.isSelf && collab.cursor && typeof collab.cursor.x === 'number' && typeof collab.cursor.y === 'number'"
          class="absolute z-30 pointer-events-none transition-all duration-150 flex items-center gap-1.5"
          :style="{ left: `${collab.cursor.x}px`, top: `${collab.cursor.y}px` }"
        >
          <Navigation class="w-4 h-4 -rotate-45" :style="{ fill: collab.color || '#3b82f6', stroke: collab.color || '#3b82f6' }" />
          <span
            class="px-2 py-0.5 rounded-full text-[10px] text-white font-medium shadow-md truncate max-w-[120px]"
            :style="{ backgroundColor: collab.color || '#3b82f6' }"
          >
            {{ collab.name }}
          </span>
        </div>
      </template>
    </div>

    <!-- Empty Schema Canvas State -->
    <div
      v-if="!activeProject || !activeProject.tables || activeProject.tables.length === 0"
      class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
    >
      <div class="pointer-events-auto max-w-sm w-full mx-4 p-6 rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-3.5">
        <div class="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-xs">
          <Database class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
            {{ activeProject ? activeProject.name : 'Start Your Schema' }}
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your schema is currently empty. Add a table to begin, or import sample templates to explore.
          </p>
        </div>

        <div class="flex flex-col gap-2 pt-1">
          <button
            @click="state.modals.newTable = true"
            class="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Create First Table</span>
          </button>

          <button
            @click="state.modals.importSchema = true"
            class="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <UploadCloud class="w-3.5 h-3.5" />
            <span>Import SQL (MySQL / PG / MSSQL)</span>
          </button>

          <button
            @click="importSampleSchemas()"
            class="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Import Sample Schemas</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Table View Indicator Pill (dbdiagram.io pro feature) -->
    <div
      v-if="state.tableDisplayMode !== 'all'"
      class="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-900 shadow-md text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
      <span class="text-slate-600 dark:text-slate-300">View: <strong class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ currentViewModeLabel }}</strong></span>
      <button
        @click="selectDisplayMode('all')"
        class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-sans font-medium cursor-pointer ml-1"
        title="Show all fields"
      >
        Reset to All Fields
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  state,
  activeProject,
  updateTablePosition,
  autoArrangeTables,
  setTableDisplayMode,
  deleteTable,
  deleteColumn,
  importSampleSchemas
} from '../stores/schemaStore.js';
import TableCard from './TableCard.vue';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Plus,
  Link,
  Navigation,
  Hand,
  Move,
  LayoutGrid,
  GitCommit,
  Database,
  Sparkles,
  UploadCloud,
  Columns,
  Table as TableIcon,
  Key,
  ChevronDown,
  Check,
  Eye
} from 'lucide-vue-next';

const canvasContainer = ref(null);
const isPanningModeActive = ref(false);
const isSpacePressed = ref(false);
const isCurrentlyPanning = ref(false);

const lineStyle = ref('orthogonal');
const hoveredRelId = ref(null);

// Table Display Mode Dropdown (1. All fields, 2. Tables Only, 3. Keys Only)
const showViewModeDropdown = ref(false);
const viewModeDropdownRef = ref(null);

const currentViewModeLabel = computed(() => {
  if (state.tableDisplayMode === 'tables') return 'Tables Only';
  if (state.tableDisplayMode === 'keys') return 'Keys Only';
  return 'All Fields';
});

const currentViewModeIcon = computed(() => {
  if (state.tableDisplayMode === 'tables') return TableIcon;
  if (state.tableDisplayMode === 'keys') return Key;
  return Columns;
});

function selectDisplayMode(mode) {
  setTableDisplayMode(mode);
  showViewModeDropdown.value = false;
}

function handleClickOutside(e) {
  if (viewModeDropdownRef.value && !viewModeDropdownRef.value.contains(e.target)) {
    showViewModeDropdown.value = false;
  }
}

let startPanX = 0;
let startPanY = 0;

// Helper to construct SVG paths with smooth rounded elbow corners
function createRoundedPath(points, radius = 10) {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const dx1 = pCurr.x - pPrev.x;
    const dy1 = pCurr.y - pPrev.y;
    const len1 = Math.hypot(dx1, dy1);

    const dx2 = pNext.x - pCurr.x;
    const dy2 = pNext.y - pCurr.y;
    const len2 = Math.hypot(dx2, dy2);

    if (len1 < 0.1 || len2 < 0.1) {
      d += ` L ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}`;
      continue;
    }

    const actualR = Math.min(radius, len1 / 2, len2 / 2);

    const startX = pCurr.x - (dx1 / len1) * actualR;
    const startY = pCurr.y - (dy1 / len1) * actualR;
    const endX = pCurr.x + (dx2 / len2) * actualR;
    const endY = pCurr.y + (dy2 / len2) * actualR;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${pCurr.x.toFixed(1)} ${pCurr.y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

// Calculate Relationship line coordinates with high mathematical precision, parallel channel offsets & obstacle clearance
const relationshipsWithCoords = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.relationships) return [];

  const tableWidth = 280;
  const headerHeight = 40;
  const rowHeight = 33;

  // Calculate table bounding boxes for obstacle collision detection
  const tableBounds = (proj.tables || []).map(t => {
    let colCount = t.columns ? t.columns.length : 1;
    if (state.tableDisplayMode === 'tables') {
      colCount = 0;
    } else if (state.tableDisplayMode === 'keys') {
      const keys = (t.columns || []).filter(c => c.isPk || c.isFk || c.isUnique);
      colCount = keys.length === 0 ? 1 : keys.length;
    }
    const h = headerHeight + colCount * rowHeight + 28;
    return {
      id: t.id,
      name: t.name.toLowerCase(),
      left: t.x,
      right: t.x + tableWidth,
      top: t.y,
      bottom: t.y + h
    };
  });

  const minSchemaY = tableBounds.length > 0 ? Math.min(...tableBounds.map(b => b.top)) : 60;
  const maxSchemaY = tableBounds.length > 0 ? Math.max(...tableBounds.map(b => b.bottom)) : 500;

  // Pre-calculate count of relationships between table pairs to route parallel tracks cleanly
  const pairCounts = {};
  (proj.relationships || []).forEach(r => {
    const t1 = (r.fromTable || '').toLowerCase();
    const t2 = (r.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
  });
  const pairSeen = {};

  return proj.relationships.map(rel => {
    const fromTbl = proj.tables.find(t => t.name.toLowerCase() === rel.fromTable?.toLowerCase());
    const toTbl = proj.tables.find(t => t.name.toLowerCase() === rel.toTable?.toLowerCase());

    if (!fromTbl || !toTbl) return null;

    let y1 = fromTbl.y + (headerHeight / 2);
    let y2 = toTbl.y + (headerHeight / 2);

    if (state.tableDisplayMode === 'tables') {
      // Tables only mode: anchor to vertical center of table header
      y1 = fromTbl.y + (headerHeight / 2);
      y2 = toTbl.y + (headerHeight / 2);
    } else if (state.tableDisplayMode === 'keys') {
      // Keys only mode: anchor to visible key row
      const fromKeys = (fromTbl.columns || []).filter(c => c.isPk || c.isFk || c.isUnique);
      const toKeys = (toTbl.columns || []).filter(c => c.isPk || c.isFk || c.isUnique);

      const fromKeyIdx = rel.fromColumn
        ? fromKeys.findIndex(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase())
        : -1;
      const toKeyIdx = rel.toColumn
        ? toKeys.findIndex(c => c.name.toLowerCase() === rel.toColumn.toLowerCase())
        : -1;

      y1 = fromKeyIdx >= 0
        ? fromTbl.y + headerHeight + (fromKeyIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + (headerHeight / 2);

      y2 = toKeyIdx >= 0
        ? toTbl.y + headerHeight + (toKeyIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + (headerHeight / 2);
    } else {
      // All fields mode: anchor to exact column row
      let fromColIdx = -1;
      if (rel.fromColumn && fromTbl.columns) {
        fromColIdx = fromTbl.columns.findIndex(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
      }

      let toColIdx = -1;
      if (rel.toColumn && toTbl.columns) {
        toColIdx = toTbl.columns.findIndex(c => c.name.toLowerCase() === rel.toColumn.toLowerCase());
      }

      y1 = fromColIdx >= 0
        ? fromTbl.y + headerHeight + (fromColIdx * rowHeight) + (rowHeight / 2)
        : fromTbl.y + headerHeight + 16;

      y2 = toColIdx >= 0
        ? toTbl.y + headerHeight + (toColIdx * rowHeight) + (rowHeight / 2)
        : toTbl.y + headerHeight + 16;
    }

    // Optional (>?) Relationship Detection
    const isOptional = rel.optional === true ||
      rel.isOptional === true ||
      (typeof rel.operator === 'string' && rel.operator.includes('?')) ||
      (typeof rel.cardinality === 'string' && (rel.cardinality.includes('?') || rel.cardinality.includes('0..')));

    // Parallel relationship track shift (prevents parallel foreign key lines & labels from colliding)
    const t1 = (rel.fromTable || '').toLowerCase();
    const t2 = (rel.toTable || '').toLowerCase();
    const pairKey = t1 < t2 ? `${t1}<->${t2}` : `${t2}<->${t1}`;
    const totalInPair = pairCounts[pairKey] || 1;
    const pairIdx = pairSeen[pairKey] || 0;
    pairSeen[pairKey] = pairIdx + 1;
    const lineShift = totalInPair > 1 ? (pairIdx - (totalInPair - 1) / 2) * 20 : 0;

    // Self-referencing relationship
    if (fromTbl.id === toTbl.id) {
      const x1 = fromTbl.x + tableWidth;
      const x2 = fromTbl.x + tableWidth;
      const y2Offset = Math.abs(y1 - y2) < 10 ? y1 + 36 : y2;

      let pathD = '';
      if (lineStyle.value === 'orthogonal') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y1 },
          { x: x1 + 55 + Math.abs(lineShift), y: y2Offset },
          { x: x2, y: y2Offset }
        ];
        pathD = createRoundedPath(waypoints, 10);
      } else {
        const stub = 65 + Math.abs(lineShift);
        pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 + stub} ${y2Offset}, ${x2} ${y2Offset}`;
      }

      const midX = x1 + 55 + Math.abs(lineShift);
      const midY = (y1 + y2Offset) / 2;

      const cardStr = rel.cardinality || '1:N';
      const parts = cardStr.split(':');
      let fromLabel = parts[0]?.trim() || '1';
      let toLabel = parts[1]?.trim() || 'N';
      if (isOptional) {
        if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') fromLabel = '0..N';
        else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') toLabel = '0..N';
      }

      const displayCardinality = isOptional ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N') : cardStr;
      const pillWidth = isOptional ? 76 : 54;
      const hoverInfo = isOptional
        ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
        : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
      const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

      return {
        ...rel,
        isOptional,
        pathD,
        x1, y1,
        x2, y2: y2Offset,
        midX, midY,
        fromBadgeX: x1 + 16,
        fromBadgeY: y1 - 10,
        toBadgeX: x2 + 16,
        toBadgeY: y2Offset + 10,
        fromLabel,
        toLabel,
        fromLabelWidth: fromLabel.length > 2 ? 34 : 22,
        toLabelWidth: toLabel.length > 2 ? 34 : 22,
        displayCardinality,
        pillWidth,
        hoverInfo,
        hoverWidth,
        isSelected: state.selectedRelId === rel.id
      };
    }

    // Determine Anchor Ports (Left vs Right)
    const fromRight = fromTbl.x + tableWidth;
    const fromLeft = fromTbl.x;
    const toRight = toTbl.x + tableWidth;
    const toLeft = toTbl.x;

    let x1, x2;
    let fromSide, toSide;

    if (fromRight + 15 <= toLeft) {
      x1 = fromRight;
      x2 = toLeft;
      fromSide = 'right';
      toSide = 'left';
    } else if (toRight + 15 <= fromLeft) {
      x1 = fromLeft;
      x2 = toRight;
      fromSide = 'left';
      toSide = 'right';
    } else {
      if (fromTbl.x < toTbl.x) {
        x1 = fromRight;
        x2 = toRight;
        fromSide = 'right';
        toSide = 'right';
      } else {
        x1 = fromLeft;
        x2 = toLeft;
        fromSide = 'left';
        toSide = 'left';
      }
    }

    // Detect if intermediate tables sit directly in the line path
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const obstacles = tableBounds.filter(b => {
      if (b.id === fromTbl.id || b.id === toTbl.id) return false;
      const xOverlap = b.left < maxX - 15 && b.right > minX + 15;
      const yIntersect = b.top <= maxY + 20 && b.bottom >= minY - 20;
      return xOverlap && yIntersect;
    });

    let pathD = '';
    let midX = (x1 + x2) / 2;
    let midY = (y1 + y2) / 2;

    if (obstacles.length > 0) {
      // Route around obstacle tables using a bypass gutter (above or below schema)
      const avgY = (y1 + y2) / 2;
      const obsTop = Math.min(...obstacles.map(o => o.top));
      const obsBottom = Math.max(...obstacles.map(o => o.bottom));

      let bypassY;
      if (avgY < (obsTop + obsBottom) / 2) {
        bypassY = Math.min(obsTop - 40, minSchemaY - 40) - lineShift;
      } else {
        bypassY = Math.max(obsBottom + 40, maxSchemaY + 40) + lineShift;
      }

      const gutter1 = (fromSide === 'right' ? x1 + 40 : x1 - 40) + (fromSide === 'right' ? lineShift : -lineShift);
      const gutter2 = (toSide === 'left' ? x2 - 40 : x2 + 40) + (toSide === 'left' ? -lineShift : lineShift);

      const waypoints = [
        { x: x1, y: y1 },
        { x: gutter1, y: y1 },
        { x: gutter1, y: bypassY },
        { x: gutter2, y: bypassY },
        { x: gutter2, y: y2 },
        { x: x2, y: y2 }
      ];

      midX = (gutter1 + gutter2) / 2 + (totalInPair > 1 ? lineShift * 2 : 0);
      midY = bypassY;

      if (lineStyle.value === 'orthogonal') {
        pathD = createRoundedPath(waypoints, 10);
      } else {
        pathD = `M ${x1} ${y1} C ${gutter1} ${y1}, ${gutter1} ${bypassY}, ${midX} ${bypassY} S ${gutter2} ${y2}, ${x2} ${y2}`;
      }
    } else {
      // Clear path (no intermediate table obstacle)
      const midShiftX = midX + lineShift;
      if (fromSide === 'right' && toSide === 'left') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: midShiftX, y: y1 },
          { x: midShiftX, y: y2 },
          { x: x2, y: y2 }
        ];
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          const dx = Math.abs(x2 - x1);
          const stub = Math.max(45, dx * 0.45);
          pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 - stub} ${y2}, ${x2} ${y2}`;
        }
        midX = midShiftX;
        midY = (y1 + y2) / 2 + (totalInPair > 1 ? lineShift * 0.4 : 0);
      } else if (fromSide === 'left' && toSide === 'right') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: midShiftX, y: y1 },
          { x: midShiftX, y: y2 },
          { x: x2, y: y2 }
        ];
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          const dx = Math.abs(x2 - x1);
          const stub = Math.max(45, dx * 0.45);
          pathD = `M ${x1} ${y1} C ${x1 - stub} ${y1}, ${x2 + stub} ${y2}, ${x2} ${y2}`;
        }
        midX = midShiftX;
        midY = (y1 + y2) / 2 + (totalInPair > 1 ? lineShift * 0.4 : 0);
      } else {
        // Stacked in same column or same side
        const stubX = (fromSide === 'right' ? Math.max(x1, x2) + 55 : Math.min(x1, x2) - 55) + lineShift;
        const waypoints = [
          { x: x1, y: y1 },
          { x: stubX, y: y1 },
          { x: stubX, y: y2 },
          { x: x2, y: y2 }
        ];
        midX = stubX;
        midY = (y1 + y2) / 2;
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          pathD = `M ${x1} ${y1} C ${stubX} ${y1}, ${stubX} ${y2}, ${x2} ${y2}`;
        }
      }
    }

    const fromBadgeX = fromSide === 'right' ? x1 + 16 : x1 - 16;
    const fromBadgeY = y1 - 8;
    const toBadgeX = toSide === 'right' ? x2 + 16 : x2 - 16;
    const toBadgeY = y2 - 8;

    const cardStr = rel.cardinality || '1:N';
    const parts = cardStr.split(':');
    let fromLabel = parts[0]?.trim() || '1';
    let toLabel = parts[1]?.trim() || 'N';

    // In DBML `roles.created_by >? users.id`:
    // The child foreign key side is optional (can be NULL: 0..1 or 0..N).
    if (isOptional) {
      if (fromLabel === 'N' || fromLabel === 'M' || fromLabel === '*') {
        fromLabel = '0..N';
      } else if (toLabel === 'N' || toLabel === 'M' || toLabel === '*') {
        fromLabel = '0..N';
      } else if (cardStr === '1:1') {
        fromLabel = '0..1';
      } else {
        fromLabel = '0..N';
      }
    }

    const fromLabelWidth = fromLabel.length > 2 ? 34 : 22;
    const toLabelWidth = toLabel.length > 2 ? 34 : 22;

    const displayCardinality = isOptional
      ? (cardStr === '1:1' ? '1 : 0..1' : '1 : 0..N')
      : cardStr;
    const pillWidth = isOptional ? 76 : 54;

    const hoverInfo = isOptional
      ? `${rel.fromTable}.${rel.fromColumn} >? ${rel.toTable}.${rel.toColumn} (optional)`
      : `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
    const hoverWidth = Math.max(140, hoverInfo.length * 7 + 28);

    return {
      ...rel,
      isOptional,
      pathD,
      x1, y1,
      x2, y2,
      midX, midY,
      fromBadgeX, fromBadgeY,
      toBadgeX, toBadgeY,
      fromLabel, toLabel,
      fromLabelWidth, toLabelWidth,
      displayCardinality,
      pillWidth,
      hoverInfo,
      hoverWidth,
      isSelected: state.selectedRelId === rel.id
    };
  }).filter(Boolean);
});

// Relationships sorted so the currently hovered or selected relationship's line is rendered last (on top of other lines)
const sortedRelationshipsForLines = computed(() => {
  const list = [...relationshipsWithCoords.value];
  return list.sort((a, b) => {
    const aActive = a.id === hoveredRelId.value || a.isSelected;
    const bActive = b.id === hoveredRelId.value || b.isSelected;
    if (aActive === bActive) return 0;
    return aActive ? 1 : -1;
  });
});

// Relationships sorted so the currently hovered or selected relationship's badge/label is rendered last (in front of all other labels)
const sortedRelationshipsForLabels = computed(() => {
  const list = [...relationshipsWithCoords.value];
  return list.sort((a, b) => {
    const aActive = a.id === hoveredRelId.value || a.isSelected;
    const bActive = b.id === hoveredRelId.value || b.isSelected;
    if (aActive === bActive) return 0;
    return aActive ? 1 : -1;
  });
});

function updateTablePos(id, x, y) {
  updateTablePosition(id, x, y);
}

function selectTable(id) {
  state.selectedTableId = id;
  state.selectedRelId = null;
}

function selectRel(id) {
  state.selectedRelId = id;
  state.selectedTableId = null;
}

function openAddCol(tableId) {
  state.selectedTableId = tableId;
  state.activeTab = 'tables';
}

function delCol(tableId, colIdx) {
  deleteColumn(tableId, colIdx);
}

function delTbl(tableId) {
  deleteTable(tableId);
}

// Zoom handlers
function zoomIn() {
  state.zoomLevel = Math.min(2.0, state.zoomLevel + 0.15);
}

function zoomOut() {
  state.zoomLevel = Math.max(0.4, state.zoomLevel - 0.15);
}

function resetZoom() {
  state.zoomLevel = 1.0;
  state.panOffset = { x: 0, y: 0 };
}

function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  } else {
    state.panOffset.x -= e.deltaX * 0.8;
    state.panOffset.y -= e.deltaY * 0.8;
  }
}

// Key listeners for Spacebar Panning
function onKeyDown(e) {
  if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    isSpacePressed.value = true;
  }
}

function onKeyUp(e) {
  if (e.code === 'Space') {
    isSpacePressed.value = false;
  }
}

// Canvas Drag Panning
function onCanvasMouseDown(e) {
  const isButton = e.target.closest('button');
  if (isButton) return;

  // Canvas drag is activated ONLY when Pan Canvas mode is active, Space Bar is pressed, or Middle Click
  if (isPanningModeActive.value || isSpacePressed.value || e.button === 1) {
    isCurrentlyPanning.value = true;
    startPanX = e.clientX - state.panOffset.x;
    startPanY = e.clientY - state.panOffset.y;
    window.addEventListener('mousemove', onCanvasMouseMove);
    window.addEventListener('mouseup', onCanvasMouseUp);
  }
}

function onCanvasMouseMove(e) {
  if (!isCurrentlyPanning.value) return;
  state.panOffset.x = e.clientX - startPanX;
  state.panOffset.y = e.clientY - startPanY;
}

function onCanvasMouseUp() {
  isCurrentlyPanning.value = false;
  window.removeEventListener('mousemove', onCanvasMouseMove);
  window.removeEventListener('mouseup', onCanvasMouseUp);
}

// Touch Devices Drag Panning
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e) {
  if (e.touches.length === 1 && (isPanningModeActive.value || isSpacePressed.value) && !e.target.closest('.table-card')) {
    isCurrentlyPanning.value = true;
    touchStartX = e.touches[0].clientX - state.panOffset.x;
    touchStartY = e.touches[0].clientY - state.panOffset.y;
  }
}

function onTouchMove(e) {
  if (isCurrentlyPanning.value && e.touches.length === 1) {
    state.panOffset.x = e.touches[0].clientX - touchStartX;
    state.panOffset.y = e.touches[0].clientY - touchStartY;
  }
}

function onTouchEnd() {
  isCurrentlyPanning.value = false;
}

// Subtle collaborator cursor drift only when valid cursor coordinate exists
let cursorInterval;
onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', handleClickOutside);

  cursorInterval = setInterval(() => {
    state.collaborators.forEach(c => {
      if (c && c.id !== state.currentUser?.id && !c.isSelf && c.cursor && typeof c.cursor.x === 'number' && typeof c.cursor.y === 'number') {
        c.cursor.x += (Math.random() - 0.5) * 6;
        c.cursor.y += (Math.random() - 0.5) * 6;
      }
    });
  }, 3000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('click', handleClickOutside);
  if (cursorInterval) clearInterval(cursorInterval);
});
</script>

