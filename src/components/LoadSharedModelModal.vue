<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  modelName: { type: String, default: '' }
})

const emit = defineEmits(['load', 'cancel'])

const dialogRef = ref(null)

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        dialogRef.value?.showModal()
      })
    } else {
      dialogRef.value?.close()
    }
  }
)

function onDialogClick(e) {
  if (e.target === dialogRef.value) {
    emit('cancel')
  }
}

function onLoad() {
  emit('load')
}

function onCancel() {
  emit('cancel')
}
</script>

<template>
  <dialog
    v-if="visible"
    ref="dialogRef"
    class="load-shared-dialog"
    aria-labelledby="load-shared-title"
    @close="emit('cancel')"
    @click="onDialogClick"
  >
    <div class="load-shared-modal" @click.stop>
      <h3 id="load-shared-title" class="load-shared-title">Load shared model?</h3>
      <p class="load-shared-description">
        A shared model has been detected in the link. Do you want to replace your current model with this shared model?
      </p>
      <div class="load-shared-actions">
        <button type="button" class="load-shared-btn cancel" @click="onCancel">Cancel</button>
        <button type="button" class="load-shared-btn primary" @click="onLoad">Load</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.load-shared-dialog {
  padding: 0;
  margin: 0;
  border: none;
  max-width: none;
  width: 100%;
  height: 100%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-shared-dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.load-shared-modal {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.load-shared-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.load-shared-description {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
}

.load-shared-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.load-shared-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.load-shared-btn.cancel {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  color: var(--text-primary, #333);
}

.load-shared-btn.cancel:hover {
  background: var(--hover-bg, #f5f5f5);
}

.load-shared-btn.primary {
  background: var(--accent, #1F6B66);
  border: 1px solid var(--accent, #1F6B66);
  color: white;
}

.load-shared-btn.primary:hover {
  background: #3AB8B0;
  border-color: #3AB8B0;
}
</style>
