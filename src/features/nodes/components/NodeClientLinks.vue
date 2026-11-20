<template>
  <div>
    <p class="text-subtitle-2 mt-3">
      {{ $t('nodes.clientConnections') }}
    </p>
    <v-progress-linear
      v-if="loading && !links.length"
      indeterminate
      class="my-2"
    />
    <v-alert
      v-if="failed"
      type="error"
      density="compact"
      variant="tonal"
      class="my-2"
    >
      {{ $t('nodes.linksFailed') }}
    </v-alert>
    <p
      v-else-if="!loading && !links.length"
      class="text-body-2 my-2"
    >
      {{ $t('nodes.linksPending') }}
    </p>
    <div
      v-for="link in links"
      :key="link.uri"
      class="my-4"
      :class="{ 'text-center': qr }"
    >
      <p class="text-body-2 mb-2">
        {{ link.remark }}
      </p>
      <QrcodeVue
        v-if="qr"
        :value="link.uri"
        :size="size"
        :margin="1"
        style="max-width: 100%; cursor: copy"
        @click="emit('copy', link.uri)"
      />
      <v-btn
        v-if="qr"
        variant="text"
        size="small"
        :aria-label="$t('copyToClipboard') + ' ' + link.remark"
        @click="emit('copy', link.uri)"
      >
        {{ $t('copyToClipboard') }}
      </v-btn>
      <p
        v-else
        dir="ltr"
        class="text-body-2"
        style="overflow-wrap: anywhere"
      >
        {{ link.uri }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import HttpUtils from '@/plugins/httputil'
const props=withDefaults(defineProps<{ clientId: number, active: boolean, qr?: boolean }>(),{qr:false})
const emit=defineEmits<{copy:[string]}>()
const links=ref<{remark:string,uri:string}[]>([]),loading=ref(false),failed=ref(false)
const size=computed(()=>Math.min(280,window.innerWidth-80))
let version=0,timer:ReturnType<typeof setInterval>|undefined
async function load() {
  if(loading.value)return
  const requestVersion=version;loading.value=true
  try {const msg=await HttpUtils.get<{remark:string,uri:string}[]>('api/node-links',{id:props.clientId});if(requestVersion!==version)return;if(msg.success && Array.isArray(msg.obj)){links.value=msg.obj;failed.value=false}else if(!msg.success)failed.value=true}
  catch {if(requestVersion===version)failed.value=true}
  finally {if(requestVersion===version)loading.value=false}
}
watch(()=>[props.clientId,props.active],()=>{version++;if(timer)clearInterval(timer);links.value=[];failed.value=false;loading.value=false;if(props.active&&props.clientId>0){void load();timer=setInterval(()=>void load(),5000)}},{immediate:true})
onUnmounted(()=>{version++;if(timer)clearInterval(timer)})
</script>
