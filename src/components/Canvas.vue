<template>
  <div
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
    <div class="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs">
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
        </defs>

        <g v-for="rel in relationshipsWithCoords" :key="rel.id" class="group/rel">
          <!-- Outer Highlight Glow when Hovered / Selected -->
          <path
            :d="rel.pathD"
            fill="none"
            :stroke="rel.isSelected || hoveredRelId === rel.id ? '#3b82f6' : 'transparent'"
            stroke-width="8"
            stroke-opacity="0.25"
            stroke-linecap="round"
            class="transition-all duration-200"
          />

          <!-- Main ERD Relationship Path -->
          <path
            :d="rel.pathD"
            fill="none"
            :stroke="rel.isSelected || hoveredRelId === rel.id ? '#3b82f6' : state.isDarkMode ? '#64748b' : '#94a3b8'"
            :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2.5 : 2"
            :stroke-dasharray="rel.isSelected ? '6,4' : undefined"
            stroke-linecap="round"
            class="transition-all duration-150"
          />

          <!-- Wide Invisible Path for Easy Mouse Click / Hover Detection -->
          <path
            :d="rel.pathD"
            fill="none"
            stroke="transparent"
            stroke-width="16"
            class="cursor-pointer pointer-events-auto"
            @click="selectRel(rel.id)"
            @mouseenter="hoveredRelId = rel.id"
            @mouseleave="hoveredRelId = null"
          />

          <!-- Precision Anchor Circle Dots on Table Edge -->
          <circle
            :cx="rel.x1"
            :cy="rel.y1"
            r="4"
            :fill="rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b'"
            :stroke="state.isDarkMode ? '#0f172a' : '#ffffff'"
            stroke-width="2"
            class="pointer-events-none transition-colors"
          />
          <circle
            :cx="rel.x2"
            :cy="rel.y2"
            r="4"
            :fill="rel.isSelected || hoveredRelId === rel.id ? '#2563eb' : state.isDarkMode ? '#38bdf8' : '#64748b'"
            :stroke="state.isDarkMode ? '#0f172a' : '#ffffff'"
            stroke-width="2"
            class="pointer-events-none transition-colors"
          />

          <!-- Endpoint Cardinality Badges (1 / N) near Anchor Dots -->
          <g :transform="`translate(${rel.fromBadgeX}, ${rel.fromBadgeY})`" class="pointer-events-none">
            <rect
              x="-11"
              y="-10"
              width="22"
              height="20"
              rx="6"
              :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
              :stroke="rel.isSelected || hoveredRelId === rel.id ? (state.isDarkMode ? '#38bdf8' : '#2563eb') : (state.isDarkMode ? '#475569' : '#3b82f6')"
              stroke-width="2"
              class="transition-colors shadow-sm"
            />
            <text
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="state.isDarkMode ? '#38bdf8' : '#1d4ed8'"
              style="font-size: 11px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
            >
              {{ rel.fromLabel }}
            </text>
          </g>

          <g :transform="`translate(${rel.toBadgeX}, ${rel.toBadgeY})`" class="pointer-events-none">
            <rect
              x="-11"
              y="-10"
              width="22"
              height="20"
              rx="6"
              :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
              :stroke="rel.isSelected || hoveredRelId === rel.id ? (state.isDarkMode ? '#38bdf8' : '#2563eb') : (state.isDarkMode ? '#475569' : '#3b82f6')"
              stroke-width="2"
              class="transition-colors shadow-sm"
            />
            <text
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="state.isDarkMode ? '#38bdf8' : '#1d4ed8'"
              style="font-size: 11px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace;"
            >
              {{ rel.toLabel }}
            </text>
          </g>

          <!-- Midpoint Cardinality Badge & Connection Tooltip -->
          <g
            :transform="`translate(${rel.midX}, ${rel.midY})`"
            class="pointer-events-auto cursor-pointer"
            @click="selectRel(rel.id)"
            @mouseenter="hoveredRelId = rel.id"
            @mouseleave="hoveredRelId = null"
          >
            <!-- Badge background pill -->
            <rect
              :x="hoveredRelId === rel.id ? -(rel.hoverWidth / 2) : -26"
              y="-13"
              :width="hoveredRelId === rel.id ? rel.hoverWidth : 52"
              height="26"
              rx="13"
              :fill="state.isDarkMode ? '#0f172a' : '#ffffff'"
              :stroke="rel.isSelected || hoveredRelId === rel.id ? (state.isDarkMode ? '#38bdf8' : '#2563eb') : (state.isDarkMode ? '#475569' : '#64748b')"
              :stroke-width="rel.isSelected || hoveredRelId === rel.id ? 2 : 1.5"
              class="transition-all duration-200 shadow-md"
            />

            <!-- Standard Cardinality view -->
            <text
              v-if="hoveredRelId !== rel.id"
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="state.isDarkMode ? '#f8fafc' : '#0f172a'"
              style="font-size: 12px; font-weight: 900; font-family: ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.025em;"
            >
              {{ rel.cardinality || '1:N' }}
            </text>

            <!-- Expanded Info on Hover -->
            <text
              v-else
              x="0"
              y="0"
              text-anchor="middle"
              dominant-baseline="central"
              :fill="state.isDarkMode ? '#38bdf8' : '#2563eb'"
              style="font-size: 10px; font-weight: 800; font-family: ui-monospace, SFMono-Regular, monospace;"
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
      <div
        v-for="collab in state.collaborators.filter(c => c.id !== state.currentUser.id)"
        :key="collab.id"
        class="absolute z-30 pointer-events-none transition-all duration-300 flex items-center gap-1.5"
        :style="{ left: collab.cursor.x + 'px', top: collab.cursor.y + 'px' }"
      >
        <Navigation class="w-4 h-4 -rotate-45" :style="{ fill: collab.color, stroke: collab.color }" />
        <span
          class="px-2 py-0.5 rounded-full text-[10px] text-white font-medium shadow-md truncate max-w-[120px]"
          :style="{ backgroundColor: collab.color }"
        >
          {{ collab.name }}
        </span>
      </div>
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
  deleteTable,
  deleteColumn
} from '../stores/schemaStore.js';
import TableCard from './TableCard.vue';
import { ZoomIn, ZoomOut, Maximize2, Plus, Link, Navigation, Hand, Move, LayoutGrid, GitCommit } from 'lucide-vue-next';

const canvasContainer = ref(null);
const isPanningModeActive = ref(false);
const isSpacePressed = ref(false);
const isCurrentlyPanning = ref(false);

const lineStyle = ref('orthogonal');
const hoveredRelId = ref(null);

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

// Calculate Relationship line coordinates with high mathematical precision & obstacle clearance
const relationshipsWithCoords = computed(() => {
  const proj = activeProject.value;
  if (!proj || !proj.relationships) return [];

  const tableWidth = 280;
  const headerHeight = 40;
  const rowHeight = 33;

  // Calculate table bounding boxes for obstacle collision detection
  const tableBounds = (proj.tables || []).map(t => {
    const h = headerHeight + (t.columns ? t.columns.length : 1) * rowHeight + 16;
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

  return proj.relationships.map(rel => {
    const fromTbl = proj.tables.find(t => t.name.toLowerCase() === rel.fromTable?.toLowerCase());
    const toTbl = proj.tables.find(t => t.name.toLowerCase() === rel.toTable?.toLowerCase());

    if (!fromTbl || !toTbl) return null;

    let fromColIdx = -1;
    if (rel.fromColumn && fromTbl.columns) {
      fromColIdx = fromTbl.columns.findIndex(c => c.name.toLowerCase() === rel.fromColumn.toLowerCase());
    }

    let toColIdx = -1;
    if (rel.toColumn && toTbl.columns) {
      toColIdx = toTbl.columns.findIndex(c => c.name.toLowerCase() === rel.toColumn.toLowerCase());
    }

    const y1 = fromColIdx >= 0
      ? fromTbl.y + headerHeight + (fromColIdx * rowHeight) + (rowHeight / 2)
      : fromTbl.y + headerHeight + 16;

    const y2 = toColIdx >= 0
      ? toTbl.y + headerHeight + (toColIdx * rowHeight) + (rowHeight / 2)
      : toTbl.y + headerHeight + 16;

    // Self-referencing relationship
    if (fromTbl.id === toTbl.id) {
      const x1 = fromTbl.x + tableWidth;
      const x2 = fromTbl.x + tableWidth;
      const y2Offset = Math.abs(y1 - y2) < 10 ? y1 + 36 : y2;

      let pathD = '';
      if (lineStyle.value === 'orthogonal') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: x1 + 55, y: y1 },
          { x: x1 + 55, y: y2Offset },
          { x: x2, y: y2Offset }
        ];
        pathD = createRoundedPath(waypoints, 10);
      } else {
        const stub = 65;
        pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 + stub} ${y2Offset}, ${x2} ${y2Offset}`;
      }

      const midX = x1 + 55;
      const midY = (y1 + y2Offset) / 2;
      const hoverInfo = `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
      const hoverWidth = Math.max(120, hoverInfo.length * 6.5 + 24);

      return {
        ...rel,
        pathD,
        x1, y1,
        x2, y2: y2Offset,
        midX, midY,
        fromBadgeX: x1 + 14,
        fromBadgeY: y1 - 10,
        toBadgeX: x2 + 14,
        toBadgeY: y2Offset + 10,
        fromLabel: '1',
        toLabel: rel.cardinality?.includes('N') || rel.cardinality?.includes('*') ? 'N' : '1',
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
        bypassY = Math.min(obsTop - 40, minSchemaY - 40);
      } else {
        bypassY = Math.max(obsBottom + 40, maxSchemaY + 40);
      }

      const gutter1 = fromSide === 'right' ? x1 + 40 : x1 - 40;
      const gutter2 = toSide === 'left' ? x2 - 40 : x2 + 40;

      const waypoints = [
        { x: x1, y: y1 },
        { x: gutter1, y: y1 },
        { x: gutter1, y: bypassY },
        { x: gutter2, y: bypassY },
        { x: gutter2, y: y2 },
        { x: x2, y: y2 }
      ];

      midX = (gutter1 + gutter2) / 2;
      midY = bypassY;

      if (lineStyle.value === 'orthogonal') {
        pathD = createRoundedPath(waypoints, 10);
      } else {
        pathD = `M ${x1} ${y1} C ${gutter1} ${y1}, ${gutter1} ${bypassY}, ${midX} ${bypassY} S ${gutter2} ${y2}, ${x2} ${y2}`;
      }
    } else {
      // Clear path (no intermediate table obstacle)
      if (fromSide === 'right' && toSide === 'left') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: midX, y: y1 },
          { x: midX, y: y2 },
          { x: x2, y: y2 }
        ];
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          const dx = Math.abs(x2 - x1);
          const stub = Math.max(45, dx * 0.45);
          pathD = `M ${x1} ${y1} C ${x1 + stub} ${y1}, ${x2 - stub} ${y2}, ${x2} ${y2}`;
        }
      } else if (fromSide === 'left' && toSide === 'right') {
        const waypoints = [
          { x: x1, y: y1 },
          { x: midX, y: y1 },
          { x: midX, y: y2 },
          { x: x2, y: y2 }
        ];
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          const dx = Math.abs(x2 - x1);
          const stub = Math.max(45, dx * 0.45);
          pathD = `M ${x1} ${y1} C ${x1 - stub} ${y1}, ${x2 + stub} ${y2}, ${x2} ${y2}`;
        }
      } else {
        // Stacked in same column or same side
        const stubX = fromSide === 'right' ? Math.max(x1, x2) + 55 : Math.min(x1, x2) - 55;
        const waypoints = [
          { x: x1, y: y1 },
          { x: stubX, y: y1 },
          { x: stubX, y: y2 },
          { x: x2, y: y2 }
        ];
        midX = stubX;
        if (lineStyle.value === 'orthogonal') {
          pathD = createRoundedPath(waypoints, 10);
        } else {
          pathD = `M ${x1} ${y1} C ${stubX} ${y1}, ${stubX} ${y2}, ${x2} ${y2}`;
        }
      }
    }

    const fromBadgeX = fromSide === 'right' ? x1 + 14 : x1 - 14;
    const fromBadgeY = y1 - 8;
    const toBadgeX = toSide === 'right' ? x2 + 14 : x2 - 14;
    const toBadgeY = y2 - 8;

    const cardStr = rel.cardinality || '1:N';
    const parts = cardStr.split(':');
    const fromLabel = parts[0]?.trim() || '1';
    const toLabel = parts[1]?.trim() || 'N';

    const hoverInfo = `${rel.fromTable}.${rel.fromColumn} → ${rel.toTable}.${rel.toColumn}`;
    const hoverWidth = Math.max(120, hoverInfo.length * 6.5 + 24);

    return {
      ...rel,
      pathD,
      x1, y1,
      x2, y2,
      midX, midY,
      fromBadgeX, fromBadgeY,
      toBadgeX, toBadgeY,
      fromLabel, toLabel,
      hoverInfo,
      hoverWidth,
      isSelected: state.selectedRelId === rel.id
    };
  }).filter(Boolean);
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

// Simulate slight collaborator cursor movement
let cursorInterval;
onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  cursorInterval = setInterval(() => {
    state.collaborators.forEach(c => {
      if (c.id !== state.currentUser.id) {
        c.cursor.x += (Math.random() - 0.5) * 12;
        c.cursor.y += (Math.random() - 0.5) * 12;
      }
    });
  }, 2000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  if (cursorInterval) clearInterval(cursorInterval);
});
</script>

