<template>
  <button
    class="toggle-pill"
    :class="{ 'toggle-pill--active': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="toggle"
  >
    <span class="toggle-pill__track">
      <span class="toggle-pill__thumb" />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<style scoped>
.toggle-pill {
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.toggle-pill__track {
  display: flex;
  align-items: center;
  width: 44px;
  height: 24px;
  background: var(--glass-dark-medium);
  border-radius: var(--radius-full);
  padding: 2px;
  transition: background-color var(--duration-normal) var(--ease-default);
}

.toggle-pill--active .toggle-pill__track {
  background: var(--color-blue);
}

.toggle-pill__thumb {
  width: 20px;
  height: 20px;
  background: var(--color-white);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform var(--duration-normal) var(--ease-bounce);
}

.toggle-pill--active .toggle-pill__thumb {
  transform: translateX(20px);
}

/* Hover effect */
.toggle-pill:hover .toggle-pill__thumb {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Disabled state */
.toggle-pill:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
