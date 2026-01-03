<script setup>
import { computed } from 'vue'
import { getIconPath } from '../config/iconLibrary.js'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 24
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})

const iconPath = computed(() => getIconPath(props.name))
const viewBox = computed(() => `0 0 24 24`)
</script>

<template>
  <svg 
    v-if="iconPath"
    :width="size" 
    :height="size" 
    :viewBox="viewBox"
    class="mdi-icon"
  >
    <path 
      :d="iconPath" 
      :fill="color"
    />
  </svg>
</template>

<style scoped>
.mdi-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>

