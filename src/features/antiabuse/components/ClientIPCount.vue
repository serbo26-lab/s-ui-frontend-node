<template>
  <span>{{ $t('ipControl.active') }}: {{ count }}</span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import HttpUtils from '@/plugins/httputil'
import type { ClientIPStatus } from '../types'
import { useIPControl } from '../state'

const props = defineProps<{ clientId: number; visible: boolean }>()
const status = ref<ClientIPStatus | null>(null)
const received = ref(0)
const clock = ref(Date.now())
const count = computed(() => status.value?.available && clock.value - received.value < 15000
  ? status.value.active_count ?? '-' : '-')

watch(() => [props.visible, props.clientId] as const, ([visible, id], _old, cleanup) => {
  status.value = null
  if (!visible) return
  void useIPControl().loadSettings()
  if (!id) return
  const abort = new AbortController()
  let busy = false
  async function refresh() {
    clock.value = Date.now()
    if (busy) return
    busy = true
    const requested = Date.now()
    try {
      const result = await HttpUtils.get<{ enabled: boolean; clients: ClientIPStatus[] }>(
        'api/antiabuse/clients', { ids: id }, { signal: abort.signal })
      if (abort.signal.aborted) return
      status.value = result.success && result.obj.enabled ? result.obj.clients[0] ?? null : null
      received.value = requested
      clock.value = Date.now()
    } finally { busy = false }
  }
  void refresh()
  const timer = window.setInterval(() => { void refresh() }, 5000)
  cleanup(() => { abort.abort(); window.clearInterval(timer) })
}, { immediate: true })
</script>
