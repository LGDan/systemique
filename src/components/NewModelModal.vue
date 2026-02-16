<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  initialTitle: { type: String, default: '' },
  initialDescription: { type: String, default: '' }
})

const emit = defineEmits(['submit', 'close'])

const dialogRef = ref(null)
const titleValue = ref('')
const descriptionValue = ref('')

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      titleValue.value = props.initialTitle
      descriptionValue.value = props.initialDescription
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
    emit('close')
  }
}

function onSubmit() {
  const title = (titleValue.value ?? '').trim()
  if (!title) return
  emit('submit', { title, description: (descriptionValue.value ?? '').trim() })
}

function onCancel() {
  emit('close')
}
</script>

<template>
  <dialog
    v-if="visible"
    ref="dialogRef"
    class="new-model-dialog"
    aria-labelledby="new-model-title"
    @close="emit('close')"
    @click="onDialogClick"
  >
    <div class="new-model-modal" @click.stop>
      <h3 id="new-model-title" class="new-model-title">New Model</h3>
      <div class="new-model-fields">
        <label for="new-model-title-input">Title</label>
        <input
          id="new-model-title-input"
          v-model="titleValue"
          type="text"
          class="new-model-input"
          placeholder="Model name"
          required
        />
        <label for="new-model-desc-input">Description (optional)</label>
        <textarea
          id="new-model-desc-input"
          v-model="descriptionValue"
          class="new-model-textarea"
          placeholder="Brief description of the model"
          rows="3"
        />
      </div>
      <div class="new-model-actions">
        <button type="button" class="new-model-btn cancel" @click="onCancel">Cancel</button>
        <button type="button" class="new-model-btn primary" @click="onSubmit">Create</button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.new-model-dialog {
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

.new-model-dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.new-model-modal {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.new-model-title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.new-model-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.new-model-fields label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #666);
}

.new-model-input,
.new-model-textarea {
  width: 94%;
  padding: 8px 12px;
  border: 1px solid var(--panel-border, #ddd);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #333);
  background: var(--input-bg, #fff);
}

.new-model-input:focus,
.new-model-textarea:focus {
  outline: none;
  border-color: var(--accent, #2A8A84);
  box-shadow: 0 0 0 2px rgba(42, 138, 132, 0.15);
}

.new-model-textarea {
  resize: vertical;
  min-height: 60px;
}

.new-model-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.new-model-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.new-model-btn.cancel {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  color: var(--text-primary, #333);
}

.new-model-btn.cancel:hover {
  background: var(--hover-bg, #f5f5f5);
  border-color: #ccc;
}

.new-model-btn.primary {
  background: var(--accent, #1F6B66);
  border: 1px solid var(--accent, #1F6B66);
  color: white;
}

.new-model-btn.primary:hover {
  background: #3AB8B0;
  border-color: #3AB8B0;
}
</style>
