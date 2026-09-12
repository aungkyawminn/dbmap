<template>
  <div
    class="relative rounded-full shrink-0 select-none flex items-center justify-center overflow-hidden"
    :class="[
      containerSizeClass,
      !hasPhoto ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80' : ''
    ]"
  >
    <!-- Real photo if logged in or has authentic photo URL -->
    <img
      v-if="hasPhoto && !imageLoadFailed"
      :src="avatar"
      :alt="name || 'User Avatar'"
      class="w-full h-full rounded-full object-cover"
      loading="lazy"
      @error="imageLoadFailed = true"
    />

    <!-- Consistent, clean vector User SVG for Guest mode or users without photos -->
    <div
      v-else
      class="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400"
    >
      <User :class="iconSizeClass" />
    </div>

    <!-- Optional Presence / Role / Online Status Indicator Badge -->
    <span
      v-if="showStatus"
      class="absolute rounded-full border-2 border-white dark:border-slate-900"
      :class="statusBadgeClass"
      :style="statusColor ? { backgroundColor: statusColor } : {}"
      :title="statusTitle || ''"
    ></span>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { User } from 'lucide-vue-next';

const props = defineProps({
  avatar: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: 'User'
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md' // 'xs' (20px), 'sm' (24px), 'md' (30px), 'lg' (44px), 'xl' (48px)
  },
  showStatus: {
    type: Boolean,
    default: false
  },
  statusColor: {
    type: String,
    default: ''
  },
  statusTitle: {
    type: String,
    default: ''
  }
});

const imageLoadFailed = ref(false);

watch(() => props.avatar, () => {
  imageLoadFailed.value = false;
});

const hasPhoto = computed(() => {
  if (!props.avatar) return false;
  if (props.avatar.startsWith('data:image/svg+xml')) return false;
  return Boolean(props.isLoggedIn || props.avatar.startsWith('http') || props.avatar.startsWith('blob:') || props.avatar.startsWith('data:image/'));
});

const containerSizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-5 h-5';
    case 'sm':
      return 'w-6 h-6';
    case 'md':
      return 'w-7.5 h-7.5 sm:w-8 sm:h-8';
    case 'lg':
      return 'w-11 h-11';
    case 'xl':
      return 'w-12 h-12';
    default:
      return 'w-7 h-7 sm:w-8 sm:h-8';
  }
});

const iconSizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'w-3 h-3';
    case 'sm':
      return 'w-3.5 h-3.5';
    case 'md':
      return 'w-4 h-4 sm:w-4.5 sm:h-4.5';
    case 'lg':
      return 'w-6 h-6';
    case 'xl':
      return 'w-6 h-6';
    default:
      return 'w-4 h-4';
  }
});

const statusBadgeClass = computed(() => {
  switch (props.size) {
    case 'xs':
    case 'sm':
      return '-bottom-0.5 -right-0.5 w-2 h-2';
    case 'lg':
    case 'xl':
      return '-bottom-0.5 -right-0.5 w-3 h-3';
    default:
      return '-bottom-0.5 -right-0.5 w-2.5 h-2.5';
  }
});
</script>
