<template>
  <aside
    id="tour-sidebar"
    class="h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/80 flex flex-col select-none text-xs transition-all duration-200 shrink-0 overflow-hidden"
    :class="[state.isSidebarCollapsed ? 'w-14' : 'w-80']"
  >
    <!-- Collapsed Compact Strip -->
    <div v-if="state.isSidebarCollapsed" class="flex-1 flex flex-col items-center py-2.5 gap-2">
      <!-- Vertical Icon Rail -->
      <div class="flex flex-col gap-1.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectTabAndExpand(tab.id)"
          class="p-2.5 rounded-xl transition flex flex-col items-center justify-center relative group"
          :class="[
            state.activeTab === tab.id
              ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          ]"
          :title="tab.label"
        >
          <component :is="tab.icon" class="w-4.5 h-4.5" />

          <!-- Hover Tooltip -->
          <span class="absolute left-14 px-2 py-1 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity border border-slate-800">
            {{ tab.label }}
          </span>
        </button>

        <!-- Marketplace Button in Collapsed Rail -->
        <button
          @click="state.modals.marketplace = true"
          class="p-2.5 rounded-xl transition flex flex-col items-center justify-center relative group text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          title="Marketplace & Templates"
        >
          <Store class="w-4.5 h-4.5" />
          <span class="absolute left-14 px-2 py-1 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity border border-slate-800">
            Marketplace Blueprints
          </span>
        </button>
      </div>

      <!-- Expand Sidebar Action at Bottom of Collapsed Rail -->
      <div class="mt-auto w-full flex flex-col items-center pb-2 pt-2 border-t border-slate-200 dark:border-slate-700/80 shrink-0">
        <button
          id="btn-expand-sidebar-rail"
          @click="state.isSidebarCollapsed = false"
          class="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition relative group cursor-pointer"
          title="Expand sidebar (Ctrl+B)"
        >
          <PanelLeftOpen class="w-4.5 h-4.5 text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
          <span class="absolute left-14 px-2 py-1 bg-slate-900 dark:bg-slate-950 text-slate-100 text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity border border-slate-800">
            Expand sidebar <span class="text-slate-400 font-mono text-[10px] ml-1">(Ctrl+B)</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Expanded Sidebar -->
    <template v-else>
      <!-- Sidebar Header Tabs -->
      <div class="flex items-center border-b border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 p-1 gap-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="state.activeTab = tab.id"
          class="flex-1 py-2 px-1 rounded-lg font-medium transition flex flex-col items-center gap-1"
          :class="[
            state.activeTab === tab.id
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          ]"
          :title="tab.label"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          <span class="text-[10px] font-semibold tracking-tight">{{ tab.shortLabel }}</span>
        </button>
      </div>

    <!-- TAB 1: EXPLORER (FOLDERS & PROJECTS TREE) -->
    <div v-if="state.activeTab === 'explorer'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Search & Quick Action Header -->
      <div class="flex items-center gap-1.5">
        <div class="relative flex-1">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            v-model="explorerQuery"
            type="text"
            placeholder="Filter databases"
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-xs text-slate-700 dark:text-slate-200"
          />
        </div>
        <button
          @click="state.modals.newFolder = true"
          title="Create New Database"
          class="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition shrink-0"
        >
          <Database class="w-4 h-4" />
        </button>
        <button
          @click="state.modals.importSchema = true"
          title="Import SQL (MySQL, PostgreSQL, MSSQL, DBML)"
          class="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 rounded-lg transition shrink-0"
        >
          <UploadCloud class="w-4 h-4" />
        </button>
        <button
          @click="state.modals.newProject = true"
          title="Create New Schema Project"
          class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shrink-0"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Action Bar with Quick Import & Samples -->
      <div class="flex items-center justify-between px-0.5 pt-0.5">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schemas ({{ state.projects.length }})</span>
        <div class="flex items-center gap-1">
          <button
            @click="state.modals.marketplace = true"
            title="Browse 12+ Curated Database Blueprints (Marketplace)"
            class="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Store class="w-3 h-3 text-indigo-500" />
            <span>Templates</span>
          </button>
          <span class="text-slate-300 dark:text-slate-700 text-[10px]">&bull;</span>
          <button
            @click="state.modals.importSchema = true"
            title="Import MySQL, Postgres, MSSQL DDL"
            class="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <UploadCloud class="w-3 h-3" />
            <span>Import</span>
          </button>
          <span class="text-slate-300 dark:text-slate-700 text-[10px]">&bull;</span>
          <button
            @click="importSampleSchemas()"
            title="Import sample schemas on demand"
            class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <Sparkles class="w-3 h-3" />
            <span>Samples</span>
          </button>
        </div>
      </div>

      <!-- Quick Database Filter Pills -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[11px]">
        <button
          @click="selectedFolderFilter = null"
          class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition"
          :class="[
            selectedFolderFilter === null
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          ]"
        >
          All ({{ state.projects.length }})
        </button>

        <button
          v-for="database in (state.databases || state.folders)"
          :key="database.id"
          @click="selectedFolderFilter = selectedFolderFilter === database.id ? null : database.id"
          class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5"
          :class="[
            selectedFolderFilter === database.id
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          ]"
        >
          <Database class="w-3 h-3" />
          <span>{{ database.name }}</span>
          <span class="opacity-75 font-mono text-[10px]">({{ getProjectsInFolder(database.id).length }})</span>
        </button>
      </div>

      <!-- Databases & Schemas Tree -->
      <div class="space-y-3 pt-1">
        <div
          v-for="database in displayedFolders"
          :key="database.id"
          class="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 overflow-hidden shadow-xs"
        >
          <!-- Database Header / Accordion Bar -->
          <div
            @click="toggleFolder(database.id)"
            class="p-2.5 bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between cursor-pointer transition select-none group/database"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <ChevronDown
                class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0"
                :class="{ '-rotate-90': !isFolderExpanded(database.id) }"
              />
              <Database
                class="w-4 h-4 text-amber-500 shrink-0"
              />

              <!-- Folder Name or Inline Rename -->
              <div v-if="editingFolderId === database.id" class="flex items-center gap-1.5 flex-1 min-w-0" @click.stop>
                <input
                  v-model="editingFolderName"
                  @keydown.enter="saveFolderRename(database.id)"
                  @keydown.esc="editingFolderId = null"
                  type="text"
                  class="w-full px-2 py-0.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-blue-500 rounded outline-none text-slate-800 dark:text-slate-100"
                  autofocus
                />
                <button
                  @click="saveFolderRename(database.id)"
                  class="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold shrink-0"
                >
                  Save
                </button>
              </div>
              <span
                v-else
                class="font-bold text-xs text-slate-700 dark:text-slate-200 truncate"
                :title="database.name"
              >
                {{ database.name }}
              </span>
            </div>

            <!-- Folder Actions & Badges -->
            <div class="flex items-center gap-1 shrink-0" @click.stop>
              <span class="text-[10px] font-mono font-medium text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {{ getProjectsInFolder(database.id).length }}
              </span>

              <!-- Quick Add Schema inside this database -->
              <button
                @click="openNewProjectInFolder(database.id)"
                title="Create schema inside this database"
                class="opacity-0 group-hover/database:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded transition"
              >
                <Plus class="w-3.5 h-3.5" />
              </button>

              <!-- Rename Folder Button -->
              <button
                @click="startFolderRename(database)"
                title="Rename database"
                class="opacity-0 group-hover/database:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded transition"
              >
                <Edit2 class="w-3 h-3" />
              </button>

              <!-- Delete Folder Button -->
              <button
                v-if="state.databases.length > 1"
                @click="confirmDeleteFolder(database)"
                title="Delete database"
                class="opacity-0 group-hover/database:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded transition"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Nested Schema Items inside this Folder -->
          <div v-show="isFolderExpanded(database.id)" class="p-2 space-y-1.5 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
            <!-- Empty state for database -->
            <div
              v-if="getProjectsInFolder(database.id).length === 0"
              class="py-3 px-2 text-center text-[11px] text-slate-400"
            >
              <div class="italic">No schemas in this database</div>
              <div class="mt-2 flex items-center justify-center gap-2">
                <button
                  @click="openNewProjectInFolder(database.id)"
                  class="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Plus class="w-3 h-3" /> Add Schema
                </button>
                <span class="text-slate-300 dark:text-slate-600">&bull;</span>
                <button
                  @click="state.modals.importSchema = true"
                  class="text-sky-600 dark:text-sky-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <UploadCloud class="w-3 h-3" /> Import SQL
                </button>
                <span class="text-slate-300 dark:text-slate-600">&bull;</span>
                <button
                  @click="importSampleSchemas(database.id)"
                  class="text-amber-600 dark:text-amber-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Sparkles class="w-3 h-3" /> Samples
                </button>
              </div>
            </div>

            <!-- Schema Cards in Folder -->
            <div
              v-for="proj in getProjectsInFolder(database.id)"
              :key="proj.id"
              @click="selectProject(proj.id)"
              class="p-2 rounded-lg border transition cursor-pointer flex flex-col gap-1 group relative"
              :class="[
                proj.id === state.activeProjectId
                  ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 shadow-xs'
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
              ]"
            >
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <div
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :class="proj.id === state.activeProjectId ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-300 dark:bg-slate-600'"
                  ></div>
                  <span class="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">{{ proj.name }}</span>
                  <Lock v-if="proj.accessMode === 'restricted'" class="w-3 h-3 text-amber-500 shrink-0" title="Account Restricted" />
                </div>

                <div class="flex items-center gap-1 shrink-0" @click.stop>
                  <span class="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold">
                    {{ proj.dialect }}
                  </span>

                  <!-- Move schema to another database -->
                  <div class="relative group/move">
                    <button
                      @click="toggleMovingProject(proj.id)"
                      title="Move to another database"
                      class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-500 transition"
                    >
                      <FolderInput class="w-3 h-3" />
                    </button>

                    <!-- Inline Move Dropdown -->
                    <div
                      v-if="movingProjectId === proj.id"
                      class="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-1 z-30 text-xs"
                    >
                      <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                        Move to Database
                      </div>
                      <button
                        v-for="targetF in (state.databases || state.folders)"
                        :key="targetF.id"
                        @click="handleMoveProject(proj.id, targetF.id)"
                        class="w-full px-2 py-1.5 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200"
                        :class="{ 'font-bold text-blue-600 dark:text-blue-400': targetF.id === proj.folderId }"
                      >
                        <span class="truncate">{{ targetF.name }}</span>
                        <Check v-if="targetF.id === proj.folderId" class="w-3 h-3 text-blue-600" />
                      </button>
                    </div>
                  </div>

                  <!-- Publish to Marketplace -->
                  <button
                    v-if="(proj.tables || []).length > 0"
                    @click.stop="openSubmitToMarketplace(proj.id)"
                    title="Publish schema to dbmaps Marketplace"
                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                  >
                    <UploadCloud class="w-3 h-3" />
                  </button>

                  <!-- Delete Schema -->
                  <button
                    v-if="state.projects.length > 1"
                    @click="delProject(proj.id)"
                    title="Delete Schema"
                    class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>

              <!-- Tables & Refs Summary -->
              <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>{{ proj.tables ? proj.tables.length : 0 }} Tables</span>
                <span>{{ proj.relationships ? proj.relationships.length : 0 }} Refs</span>
                <span v-if="proj.id === state.activeProjectId" class="text-blue-600 dark:text-blue-400 font-sans font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: TABLES & FIELDS MANAGER -->
    <div v-else-if="state.activeTab === 'tables'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <!-- Search and Add Table -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            v-model="tableQuery"
            type="text"
            placeholder="Search tables or fields..."
            class="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-xs text-slate-700 dark:text-slate-200"
          />
        </div>
        <button
          @click="state.modals.newTable = true"
          title="Add Table"
          class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <!-- Tables Accordion List -->
      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="tbl in filteredTables"
          :key="tbl.id"
          class="border rounded-xl bg-white dark:bg-slate-800 overflow-hidden"
          :class="[
            state.selectedTableId === tbl.id
              ? 'border-blue-500 dark:border-blue-400 shadow-sm'
              : 'border-slate-200 dark:border-slate-700/80'
          ]"
        >
          <!-- Table Header Card -->
          <div
            @click="state.selectedTableId = tbl.id"
            class="p-2.5 bg-slate-50 dark:bg-slate-700/40 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <div class="flex items-center gap-2 font-mono truncate">
              <span
                class="w-3 h-3 rounded-full shrink-0"
                :style="{ backgroundColor: tbl.headerColor || '#3b82f6' }"
              ></span>
              <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ tbl.name }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-400">
              <span class="text-[10px] font-mono font-medium">{{ tbl.columns.length }} cols</span>
              <button
                @click.stop="delTbl(tbl.id)"
                class="p-1 hover:text-red-500 transition"
                title="Delete Table"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Expanded Column Editor -->
          <div v-if="state.selectedTableId === tbl.id" class="p-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
            <div
              v-for="(col, cIdx) in tbl.columns"
              :key="cIdx"
              class="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5"
            >
              <div class="flex items-center gap-1.5">
                <input
                  v-model="col.name"
                  type="text"
                  class="flex-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                  placeholder="column_name"
                />
                <select
                  v-model="col.type"
                  class="w-24 px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-[10px] text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="integer">integer</option>
                  <option value="varchar(255)">varchar(255)</option>
                  <option value="text">text</option>
                  <option value="boolean">boolean</option>
                  <option value="decimal(10,2)">decimal(10,2)</option>
                  <option value="timestamp">timestamp</option>
                  <option value="uuid">uuid</option>
                  <option value="jsonb">jsonb</option>
                </select>
                <button
                  @click="delCol(tbl.id, cIdx)"
                  class="p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Column Flag Checkboxes -->
              <div class="flex items-center gap-3 text-[10px] font-mono text-slate-500 dark:text-slate-400 pt-0.5">
                <label class="flex items-center gap-1 cursor-pointer hover:text-amber-600">
                  <input type="checkbox" v-model="col.isPk" class="rounded text-amber-500 focus:ring-0" />
                  <span :class="{ 'font-bold text-amber-600 dark:text-amber-400': col.isPk }">PK</span>
                </label>

                <label class="flex items-center gap-1 cursor-pointer hover:text-red-500">
                  <input type="checkbox" v-model="col.isNull" class="rounded text-red-500 focus:ring-0" />
                  <span>Nullable</span>
                </label>

                <label class="flex items-center gap-1 cursor-pointer hover:text-purple-600">
                  <input type="checkbox" v-model="col.isUnique" class="rounded text-purple-500 focus:ring-0" />
                  <span>Unique</span>
                </label>
              </div>
            </div>

            <button
              @click="addCol(tbl.id)"
              class="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 hover:text-blue-500 rounded-lg transition text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" /> Add Field
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: RELATIONSHIPS MANAGER -->
    <div v-else-if="state.activeTab === 'relationships'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Entity Relationships</span>
        <button
          @click="state.modals.newRel = true"
          class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <Plus class="w-3.5 h-3.5" /> Add Foreign Key
        </button>
      </div>

      <div class="space-y-2 overflow-y-auto flex-1 pr-1">
        <div
          v-for="rel in activeProject.relationships"
          :key="rel.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-2"
          :class="{ 'ring-2 ring-blue-500': state.selectedRelId === rel.id }"
        >
          <!-- Source to Target -->
          <div class="flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold truncate">
              <span>{{ rel.fromTable }}.{{ rel.fromColumn }}</span>
            </div>
            <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-bold text-[10px]">
              {{ rel.cardinality || '1:N' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ArrowDown class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span class="font-mono text-slate-600 dark:text-slate-300 truncate">
              References {{ rel.toTable }}.{{ rel.toColumn }}
            </span>
          </div>

          <!-- Options & Delete -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] font-mono text-slate-400">
            <span>ON DELETE {{ rel.onDelete || 'CASCADE' }}</span>
            <button
              @click="delRel(rel.id)"
              class="text-red-500 hover:underline flex items-center gap-1"
            >
              <Trash2 class="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: VERSION CONTROL & SNAPSHOTS -->
    <div v-else-if="state.activeTab === 'history'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
      <div class="flex items-center justify-between">
        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400">Schema Version Control</span>
        <button
          @click="state.modals.version = true"
          class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium text-[11px] flex items-center gap-1"
        >
          <GitCommit class="w-3.5 h-3.5" /> Save Release
        </button>
      </div>

      <div class="space-y-3 overflow-y-auto flex-1 pr-1">
        <div
          v-if="!activeProject.history || activeProject.history.length === 0"
          class="p-6 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2"
        >
          <GitCommit class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
          <p class="font-medium text-xs">No saved releases yet</p>
          <p class="text-[11px]">Click "Save Release" to take a snapshot checkpoint of your tables and relationships.</p>
        </div>

        <div
          v-for="commit in activeProject.history"
          :key="commit.id"
          class="p-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 space-y-1.5 group"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-800 dark:text-slate-100 text-xs">{{ commit.versionName }}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono text-slate-400">{{ formatDate(commit.createdAt) }}</span>
              <button
                @click="delCommit(commit.id)"
                title="Delete Snapshot"
                class="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{{ commit.description }}</p>
          <div class="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
            <span>By {{ commit.author }}</span>
            <button
              @click="restore(commit.id)"
              class="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" /> Restore Checkpoint
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 5: DIALECT SETTINGS -->
    <div v-else-if="state.activeTab === 'settings'" class="flex-1 flex flex-col overflow-y-auto p-3 gap-4">
      <div>
        <label class="block font-bold text-slate-700 dark:text-slate-200 mb-1">Target SQL Dialect</label>
        <select
          v-model="activeProject.dialect"
          @change="onDialectChange"
          class="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:border-blue-500"
        >
          <option value="postgres">PostgreSQL 15+</option>
          <option value="mysql">MySQL 8.0+</option>
          <option value="sqlite">SQLite 3</option>
          <option value="mssql">Microsoft SQL Server</option>
        </select>
      </div>

      <div class="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
        <div class="font-semibold text-blue-900 dark:text-blue-300">Live Account & Cloud Sync</div>
        <p class="text-[11px] text-blue-700 dark:text-blue-400">
          Logged in as <span class="font-mono font-bold">{{ state.currentUser.email }}</span>. Changes to schemas, versions, and dialects automatically save to Firestore.
        </p>
      </div>

      <!-- Legal & Policies Info Card -->
      <div class="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
        <div class="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
          <ShieldCheck class="w-3.5 h-3.5 text-indigo-500" />
          <span>Legal & Policies</span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          dbmaps safeguards your database designs and schemas. You retain 100% intellectual property ownership.
        </p>
        <div class="flex flex-col gap-1 pt-1 border-t border-slate-200/80 dark:border-slate-800 text-[11px]">
          <button
            @click="navigateTo('/privacy-policy')"
            class="text-left text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between cursor-pointer group py-0.5"
          >
            <span>Privacy Policy</span>
            <span class="text-[10px] font-mono text-slate-400 group-hover:text-indigo-500">/privacy-policy</span>
          </button>
          <button
            @click="navigateTo('/terms-of-service')"
            class="text-left text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between cursor-pointer group py-0.5"
          >
            <span>Terms of Service</span>
            <span class="text-[10px] font-mono text-slate-400 group-hover:text-indigo-500">/terms-of-service</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Sidebar Bottom Actions Area: Collapse Toggle & Legal -->
    <div class="mt-auto border-t border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
      <!-- Collapse Sidebar Button -->
      <button
        id="btn-collapse-sidebar-bottom"
        @click="state.isSidebarCollapsed = true"
        class="w-full flex items-center justify-between px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors text-xs font-medium cursor-pointer group"
        title="Collapse sidebar to rail (Ctrl+B)"
      >
        <div class="flex items-center gap-2">
          <PanelLeftClose class="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
          <span>Collapse sidebar</span>
        </div>
        <kbd class="px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono border border-slate-300/60 dark:border-slate-700">
          Ctrl+B
        </kbd>
      </button>

      <!-- Sidebar Compact Legal & Home Footer -->
      <div class="px-3 py-1.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
        <button @click="navigateTo('/')" class="font-mono font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition">
          dbmaps
        </button>
        <div class="flex items-center gap-1.5">
          <button @click="navigateTo('/')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Home</button>
          <span>&bull;</span>
          <button @click="navigateTo('/privacy-policy')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Privacy</button>
          <span>&bull;</span>
          <button @click="navigateTo('/terms-of-service')" class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline cursor-pointer">Terms</button>
        </div>
      </div>
    </div>
  </template>
</aside>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import {
  state,
  activeProject,
  selectProject,
  addColumn,
  deleteColumn,
  deleteTable,
  deleteRelationship,
  restoreCommit,
  deleteCommit,
  deleteProject,
  deleteFolder,
  renameFolder,
  moveProjectToFolder,
  setProjectDialect,
  importSampleSchemas,
  importSampleSchemaByName,
  openSubmitToMarketplace,
  navigateTo
} from '../stores/schemaStore.js';
import {
  Database,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Layers,
  Link,
  GitCommit,
  Settings,
  Plus,
  Search,
  Trash2,
  X,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  Lock,
  Sparkles,
  ShieldCheck,
  UploadCloud,
  Store,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next';

function selectTabAndExpand(tabId) {
  state.activeTab = tabId;
  state.isSidebarCollapsed = false;
}

const tableQuery = ref('');
const explorerQuery = ref('');
const selectedFolderFilter = ref(null);
const expandedFolderMap = reactive({});
const editingFolderId = ref(null);
const editingFolderName = ref('');
const movingProjectId = ref(null);

const hasSampleSchemas = computed(() => {
  return state.projects.some(p => 
    p.name.includes('E-Commerce') || p.name.includes('SaaS Billing')
  );
});

// Initialize databases as expanded by default
function isFolderExpanded(folderId) {
  return expandedFolderMap[folderId] !== false;
}

function toggleFolder(folderId) {
  expandedFolderMap[folderId] = !isFolderExpanded(folderId);
}

function getProjectsInFolder(folderId) {
  return state.projects.filter(p => {
    const belongs = p.folderId === folderId;
    if (!belongs) return false;
    if (!explorerQuery.value) return true;
    const q = explorerQuery.value.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.dialect && p.dialect.toLowerCase().includes(q))
    );
  });
}

const displayedFolders = computed(() => {
  let databases = state.databases || state.folders || [];
  if (selectedFolderFilter.value) {
    databases = databases.filter(f => f.id === selectedFolderFilter.value);
  }
  if (!explorerQuery.value) return databases;
  const q = explorerQuery.value.toLowerCase();
  return databases.filter(f => {
    const matchName = f.name.toLowerCase().includes(q);
    const hasMatchingProjects = getProjectsInFolder(f.id).length > 0;
    return matchName || hasMatchingProjects;
  });
});

function openNewProjectInFolder(folderId) {
  state.modals.newProject = true;
}

function startFolderRename(database) {
  editingFolderId.value = database.id;
  editingFolderName.value = database.name;
}

function saveFolderRename(folderId) {
  if (editingFolderName.value.trim()) {
    renameFolder(folderId, editingFolderName.value.trim());
  }
  editingFolderId.value = null;
}

function confirmDeleteFolder(database) {
  const count = getProjectsInFolder(database.id).length;
  const msg = count > 0
    ? `Delete database "${database.name}"? Its ${count} schema(s) will be kept and moved to default database.`
    : `Delete database "${database.name}"?`;
  if (window.confirm(msg)) {
    delFolder(database.id);
  }
}

function toggleMovingProject(projId) {
  movingProjectId.value = movingProjectId.value === projId ? null : projId;
}

function handleMoveProject(projId, targetFolderId) {
  moveProjectToFolder(projId, targetFolderId);
  movingProjectId.value = null;
}

const tabs = [
  { id: 'explorer', label: 'Databases & Schemas', shortLabel: 'Databases', icon: Database },
  { id: 'tables', label: 'Tables & Fields', shortLabel: 'Tables', icon: Layers },
  { id: 'relationships', label: 'Entity Relationships', shortLabel: 'Refs', icon: Link },
  { id: 'history', label: 'Version Control', shortLabel: 'History', icon: GitCommit },
  { id: 'settings', label: 'Dialect Settings', shortLabel: 'Dialect', icon: Settings }
];

const filteredTables = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.tables) return [];
  if (!tableQuery.value) return proj.tables;
  const q = tableQuery.value.toLowerCase();
  return proj.tables.filter(
    t => t.name.toLowerCase().includes(q) || t.columns.some(c => c.name.toLowerCase().includes(q))
  );
});

function addCol(tblId) {
  addColumn(tblId, { name: 'new_column', type: 'varchar(255)' });
}

function delCol(tblId, cIdx) {
  deleteColumn(tblId, cIdx);
}

function delTbl(tblId) {
  deleteTable(tblId);
}

function delRel(relId) {
  deleteRelationship(relId);
}

function restore(commitId) {
  restoreCommit(commitId);
}

function delCommit(commitId) {
  deleteCommit(commitId);
}

function delProject(projectId) {
  deleteProject(projectId);
}

function delFolder(folderId) {
  deleteFolder(folderId);
}

function onDialectChange() {
  if (activeProject.value) {
    setProjectDialect(activeProject.value.dialect);
  }
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function handleKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (tag !== 'input' && tag !== 'textarea') {
      e.preventDefault();
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>
