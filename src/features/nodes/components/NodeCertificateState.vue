<template>
  <div
    v-if="report?.certificates?.length"
    class="mb-4"
  >
    <p class="text-subtitle-2">
      {{ $t('nodes.certificates') }}
    </p>
    <p class="text-caption text-medium-emphasis mb-2">
      {{ new Date(report.observed_at*1000).toLocaleString() }} · {{ $t('nodeUI.version') }} {{ report.revision }}
    </p>
    <v-list density="compact">
      <v-list-item
        v-for="item in report.certificates"
        :key="item.inbound"
      >
        <p class="text-caption text-medium-emphasis">
          {{ inboundLabel(item.inbound) }}
        </p>
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-break">{{ item.server_name || item.inbound }}</span><v-chip
            size="small"
            :color="item.state==='ready'?'success':'warning'"
          >
            {{ $t('nodes.certificateStates.'+item.state) }}
          </v-chip><small v-if="item.provider">{{ item.provider }}</small>
        </div>
        <small v-if="item.not_after">{{ $t('nodes.validUntil') }}: {{ new Date(item.not_after*1000).toLocaleString() }}</small>
        <small
          v-if="item.sha256 && !compact"
          class="d-block text-medium-emphasis"
          style="overflow-wrap:anywhere"
        >SHA256 {{ item.sha256 }}</small>
      </v-list-item>
    </v-list>
  </div>
</template>
<script setup lang="ts">
import type { NodeRecord,NodeInbound } from '@/features/nodes/types/nodes'
const props=defineProps<{report:NodeRecord['tls_status'],inbounds?:NodeInbound[],nodeId?:number,compact?:boolean}>()
function inboundLabel(tag:string){const inbound=props.inbounds?.find(value=>tag===`node-${props.nodeId}-inbound-${value.id}`);return inbound?`${inbound.display_name||inbound.tag} · ${inbound.type} · ${inbound.options.listen_port}`:tag}
</script>
