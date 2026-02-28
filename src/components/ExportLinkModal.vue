<script setup>
import { ref, watch, nextTick } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'
import { useToastStore } from '../stores/toastStore.js'
import { encodeSharePayload, getShareUrl } from '../utils/shareLink.js'

const props = defineProps({
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const dialogRef = ref(null)
const shareUrl = ref('')

const systemStore = useSystemStore()
const toastStore = useToastStore()

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      const system = systemStore.currentSystem
      if (system) {
        const typesStore = useInterfaceTypesStore()
        const rulesStore = useInterfaceRulesStore()
        const payload = {
          system: system.toJSON(),
          interfaceTypes: typesStore.getAllTypes().map(t => t.toJSON()),
          interfaceRules: rulesStore.getAllRules()
        }
        const encoded = encodeSharePayload(payload)
        shareUrl.value = getShareUrl(encoded)
      } else {
        shareUrl.value = ''
      }
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

async function copyLink() {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    toastStore.show('Link copied to clipboard', 'success')
  } catch {
    toastStore.show('Could not copy link', 'error')
  }
}

function onClose() {
  emit('close')
}
</script>

<template>
  <dialog
    v-if="visible"
    ref="dialogRef"
    class="export-link-dialog"
    aria-labelledby="export-link-title"
    @close="emit('close')"
    @click="onDialogClick"
  >
    <div class="export-link-modal" @click.stop>
      <h3 id="export-link-title" class="export-link-title">Export As Link</h3>
      <p class="export-link-description">
        Copy the link below to share this model. Anyone who opens it can load this model into Systemique.
      </p>
      <div class="export-link-url-row">
        <input
          :value="shareUrl"
          type="text"
          class="export-link-input"
          readonly
          aria-label="Share link"
        />
      </div>
      <div class="export-link-actions">
        <button type="button" class="export-link-btn cancel" @click="onClose">Close</button>
        <button
          type="button"
          class="export-link-btn primary"
          :disabled="!shareUrl"
          @click="copyLink"
        >
          Copy link
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.export-link-dialog {
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

.export-link-dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
}

.export-link-modal {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 24px;
  max-width: 560px;
  width: 100%;
}

.export-link-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.export-link-description {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--text-secondary, #666);
  line-height: 1.4;
}

.export-link-url-row {
  margin-bottom: 20px;
}

.export-link-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--panel-border, #ddd);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-primary, #333);
  background: var(--input-bg, #f9f9f9);
  box-sizing: border-box;
}

.export-link-input:focus {
  outline: none;
  border-color: var(--accent, #2A8A84);
}

.export-link-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.export-link-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.export-link-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-link-btn.cancel {
  background: var(--panel-bg, #fff);
  border: 1px solid var(--panel-border, #ddd);
  color: var(--text-primary, #333);
}

.export-link-btn.cancel:hover {
  background: var(--hover-bg, #f5f5f5);
}

.export-link-btn.primary {
  background: var(--accent, #1F6B66);
  border: 1px solid var(--accent, #1F6B66);
  color: white;
}

.export-link-btn.primary:hover:not(:disabled) {
  background: #3AB8B0;
  border-color: #3AB8B0;
}
</style>
