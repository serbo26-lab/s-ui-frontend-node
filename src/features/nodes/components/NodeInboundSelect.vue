<template>
  <v-select
    :model-value="modelValue"
    :items="items"
    :label="$t('nodes.inboundTags')"
    :loading="store.loading"
    :disabled="store.loading && !store.loaded"
    :readonly="readonly"
    multiple
    chips
    :clearable="!readonly"
    hide-details
    @update:model-value="emit('update:modelValue', $event ?? [])"
  />
  <v-alert
    v-if="store.failed"
    type="error"
    variant="tonal"
    density="compact"
    class="mt-2"
  >
    {{ $t('nodes.loadFailed') }}
    <v-btn
      variant="text"
      size="small"
      @click="store.load()"
    >
      {{ $t('nodes.retry') }}
    </v-btn>
  </v-alert>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Nodes from '@/features/nodes/state/nodes'

const props = defineProps<{ modelValue: number[]; readonly?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [number[]] }>()
const store = Nodes()
const { t } = useI18n()
const items = computed(() => {
  const result = store.inbounds.filter(inbound=>store.nodes.find(n=>n.id===inbound.node_id)?.assignment_mode!=='node').map(inbound => ({
    value: inbound.id as number,
    title: `${store.nodes.find(node => node.id === inbound.node_id)?.name ?? t('nodes.unavailable')} / ${inbound.tag} (${inbound.type})`,
  }))
  for (const id of props.modelValue) {
    if (!result.some(item => item.value === id)) result.push({ value: id, title: `${t('nodes.unavailable')} #${id}` })
  }
  return result
})
onMounted(() => store.load())
</script>
