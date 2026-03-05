<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'select'])

const openSubmenuId = ref(null)

watch(() => props.visible, (v) => {
  if (!v) openSubmenuId.value = null
})

function handleItemClick(item) {
  if (item.children?.length) {
    openSubmenuId.value = openSubmenuId.value === item.id ? null : item.id
    return
  }
  if (item.disabled) return
  emit('select', item)
  emit('close')
}

function handleChildClick(child) {
  if (child.disabled) return
  emit('select', child)
  emit('close')
}

function handleBackdropClick() {
  emit('close')
}
</script>

<template>
  <div v-if="visible" class="context-menu-overlay" @click="handleBackdropClick">
    <div
      class="context-menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @click.stop
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="context-menu-item-wrapper"
      >
        <div
          class="context-menu-item"
          :class="{ disabled: item.disabled, 'has-submenu': item.children?.length }"
          @click="handleItemClick(item)"
        >
          <span v-if="item.icon" class="menu-icon">{{ item.icon }}</span>
          <span class="menu-label">{{ item.label }}</span>
          <span v-if="item.shortcut" class="menu-shortcut">{{ item.shortcut }}</span>
          <span v-if="item.children?.length" class="submenu-arrow">▸</span>
        </div>
        <div
          v-if="item.children?.length && openSubmenuId === item.id"
          class="context-menu submenu"
        >
          <div
            v-for="child in item.children"
            :key="child.id"
            class="context-menu-item"
            :class="{ disabled: child.disabled }"
            @click.stop="handleChildClick(child)"
          >
            <span v-if="child.icon" class="menu-icon">{{ child.icon }}</span>
            <span class="menu-label">{{ child.label }}</span>
            <span v-if="child.shortcut" class="menu-shortcut">{{ child.shortcut }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: transparent;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 4px 0;
  z-index: 10001;
}

.context-menu-item-wrapper {
  position: relative;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background-color 0.15s;
}

.context-menu-item.has-submenu .menu-label {
  flex: 1;
}

.submenu-arrow {
  font-size: 10px;
  color: #999;
}

.context-menu.submenu {
  position: absolute;
  left: 100%;
  top: 0;
  min-width: 140px;
  margin-left: 2px;
}

.context-menu-item:hover:not(.disabled) {
  background-color: #f5f5f5;
}

.context-menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  width: 16px;
  text-align: center;
  font-size: 14px;
}

.menu-label {
  flex: 1;
}

.menu-shortcut {
  font-size: 11px;
  color: #999;
  font-family: monospace;
}
</style>

