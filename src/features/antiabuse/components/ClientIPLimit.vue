<template>
  <v-text-field
    :model-value="modelValue?.limit ?? null"
    type="number"
    min="0"
    max="4294967295"
    step="1"
    :label="$t('ipControl.limit')"
    :placeholder="$t('ipControl.inherit', { limit: inherited || $t('unlimited') })"
    :suffix="modelValue?.limit === 0 ? $t('unlimited') : undefined"
    :rules="[validate]"
    clearable
    persistent-placeholder
    hide-details="auto"
    @update:model-value="update"
  />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { i18n } from '@/locales'
import { useIPControl } from '../state'
import { effectiveLimit, validLimit } from '../types'
import type { ClientIPPolicy } from '../types'

const props = defineProps<{ modelValue?: ClientIPPolicy; group: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: ClientIPPolicy]
  'update:valid': [value: boolean]
}>()
const store = useIPControl()
const inherited = computed(() => effectiveLimit(undefined, props.group, store.config))
function validate(value: unknown): true | string {
  return value == null || value === '' || validLimit(Number(value)) || i18n.global.t('error.invalidData')
}
function update(value: string | number | null) {
  const valid = validate(value) === true
  emit('update:valid', valid)
  if (valid) emit('update:modelValue', { limit: value == null || value === '' ? null : Number(value) })
}
watch(() => props.modelValue, () => emit('update:valid', true))
</script>
