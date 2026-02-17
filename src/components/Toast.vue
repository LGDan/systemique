<script setup>
import { useToastStore } from '../stores/toastStore.js'

const toastStore = useToastStore()
</script>

<template>
  <div class="toast-container" aria-live="polite">
    <TransitionGroup name="toast" tag="div" class="toast-list">
      <div
        v-for="t in toastStore.toasts"
        :key="t.id"
        :class="['toast', `toast-${t.type}`]"
        role="alert"
      >
        <span class="toast-message">{{ t.message }}</span>
        <button
          type="button"
          class="toast-dismiss"
          aria-label="Dismiss"
          @click="toastStore.remove(t.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}

.toast-list {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: auto;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  background: var(--toast-bg, #fff);
  border: 1px solid var(--toast-border, #e0e0e0);
  font-size: 14px;
  line-height: 1.4;
  animation: toast-in 0.3s ease-out;
}

.toast-message {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--toast-text, #333);
}

.toast-dismiss {
  flex-shrink: 0;
  padding: 0;
  margin: -4px -4px 0 0;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--toast-text, #666);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  border-radius: 4px;
  opacity: 0.7;
}

.toast-dismiss:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.06);
}

.toast-info {
  --toast-bg: #fff;
  --toast-border: #ddd;
  --toast-text: #333;
}

.toast-error {
  --toast-bg: #ffebee;
  --toast-border: #ffcdd2;
  --toast-text: #b71c1c;
}

.toast-success {
  --toast-bg: #e8f5e9;
  --toast-border: #c8e6c9;
  --toast-text: #1b5e20;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease-out;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease-out;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

html[data-theme='dark'] .toast {
  --toast-bg: #2d2d2d;
  --toast-border: #444;
  --toast-text: #e0e0e0;
}

html[data-theme='dark'] .toast-error {
  --toast-bg: #4a2020;
  --toast-border: #6b2d2d;
  --toast-text: #ffcdd2;
}

html[data-theme='dark'] .toast-success {
  --toast-bg: #1e3a1e;
  --toast-border: #2d5a2d;
  --toast-text: #c8e6c9;
}
</style>
