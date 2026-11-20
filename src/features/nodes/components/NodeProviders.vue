<template>
  <CertProvider
    v-model="visible"
    :visible="visible"
    :index="index"
    :data="JSON.stringify(current ?? {})"
    :tags="providers.map(item => item.tag)"
    :context-name="contextName"
    :http-clients="httpClients"
    remote
    @close="visible=false"
    @save="save"
  />
  <v-card
    class="my-4"
    variant="outlined"
  >
    <v-card-title class="d-flex align-center flex-wrap ga-2">
      {{ $t('nodes.certificateProviders') }}<v-spacer /><v-btn
        color="primary"
        variant="tonal"
        :disabled="!valid"
        @click="open(-1)"
      >
        {{ $t('nodes.addProvider') }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-list
        v-if="providers.length"
        density="compact"
      >
        <v-list-item
          v-for="(item,i) in providers"
          :key="i"
        >
          <div class="d-flex align-center flex-wrap ga-2">
            <span>{{ item.tag }} · {{ item.type }}</span><v-spacer /><v-btn
              size="small"
              variant="text"
              :aria-label="$t('actions.edit')+' '+item.tag"
              @click="open(i)"
            >
              {{ $t('actions.edit') }}
            </v-btn><v-btn
              size="small"
              variant="text"
              color="error"
              :aria-label="$t('actions.del')+' '+item.tag"
              @click="remove(i)"
            >
              {{ $t('actions.del') }}
            </v-btn>
          </div>
          <small>{{ 'domain' in item ? item.domain.join(', ') : '' }}</small>
        </v-list-item>
      </v-list>
      <p
        v-else
        class="text-medium-emphasis"
      >
        {{ $t('nodes.noProviders') }}
      </p>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed,ref } from 'vue'
import CertProvider from '@/layouts/modals/CertProvider.vue'
import type { certProvider } from '@/types/tls'
const props=defineProps<{modelValue:string,contextName:string}>()
const emit=defineEmits<{ 'update:modelValue':[string] }>()
const visible=ref(false),index=ref(-1),current=ref<certProvider>()
const config=computed(()=>{try{const value=JSON.parse(props.modelValue);return value&&typeof value==='object'&&!Array.isArray(value)?value:null}catch{return null}})
const valid=computed(()=>!!config.value)
const providers=computed<certProvider[]>(()=>Array.isArray(config.value?.certificate_providers)?config.value.certificate_providers:[])
const httpClients=computed<string[]>(()=>Array.isArray(config.value?.http_clients)?config.value.http_clients.map((item:{tag:string})=>item.tag).filter((tag:unknown)=>typeof tag==='string'):[])
function open(i:number){index.value=i;current.value=i<0?undefined:JSON.parse(JSON.stringify(providers.value[i]));visible.value=true}
function update(items:certProvider[]){if(!config.value)return;emit('update:modelValue',JSON.stringify({...config.value,certificate_providers:items},null,2))}
function save(value:certProvider){const items=JSON.parse(JSON.stringify(providers.value));if(index.value<0)items.push(value);else items[index.value]=value;update(items);visible.value=false}
function remove(i:number){update(providers.value.filter((_,index)=>index!==i))}
</script>
