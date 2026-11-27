<template>
  <v-dialog
    :model-value="visible"
    width="800"
    scrollable
    transition="dialog-bottom-transition"
    :persistent="saving"
    @update:model-value="!$event && emit('close')"
  >
    <v-card
      class="rounded-lg"
      :loading="loading || saving"
    >
      <v-card-title>{{ $t('ipControl.title') }}</v-card-title>
      <v-divider />
      <v-card-text class="py-0 px-4">
        <v-alert
          v-if="failed"
          type="error"
          variant="tonal"
          class="my-4"
          :text="$t('ipControl.errors.unavailable')"
        />
        <v-form
          v-if="form"
          ref="editor"
          v-model="valid"
          :disabled="loading || saving"
        >
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="form.enabled"
                  color="primary"
                  :label="$t('enable')"
                  hide-details
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model.number="form.activity_seconds"
                  type="number"
                  min="16"
                  step="1"
                  :label="$t('ipControl.activityWindow')"
                  :rules="[activityRule]"
                  hide-details="auto"
                />
              </v-col>
              <v-col
                cols="12"
                sm="6"
              >
                <v-text-field
                  v-model.number="form.transition_seconds"
                  type="number"
                  :min="Math.max(30, form.activity_seconds)"
                  step="1"
                  :label="$t('ipControl.transitionWindow')"
                  :rules="[transitionRule]"
                  hide-details="auto"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <div class="text-center text-medium-emphasis">
                  {{ $t('ipControl.groups') }}
                </div>
                <v-divider class="mb-4" />
              </v-col>
            </v-row>
            <v-row
              v-for="(rule, index) in form.groups"
              :key="index"
              align="center"
            >
              <v-col
                cols="12"
                sm="6"
              >
                <v-select
                  v-model="rule.group"
                  :items="groupOptions(index)"
                  :label="$t('client.group')"
                  :rules="[requiredGroup]"
                  hide-details="auto"
                />
              </v-col>
              <v-col
                cols="9"
                sm="5"
              >
                <v-text-field
                  v-model.number="rule.limit"
                  type="number"
                  min="0"
                  max="4294967295"
                  step="1"
                  :label="$t('ipControl.limit')"
                  :suffix="rule.limit === 0 ? $t('unlimited') : undefined"
                  :rules="[limitRule]"
                  hide-details="auto"
                />
              </v-col>
              <v-col
                cols="3"
                sm="1"
              >
                <v-btn
                  variant="text"
                  icon="mdi-delete"
                  :aria-label="$t('actions.del')"
                  @click="form.groups.splice(index, 1)"
                />
              </v-col>
            </v-row>
            <v-btn
              class="my-4"
              variant="tonal"
              :disabled="!unusedGroups.length"
              @click="form.groups.push({ group: unusedGroups[0], limit: 0 })"
            >
              {{ $t('actions.add') }}
            </v-btn>
            <v-expansion-panels v-model="journal">
              <v-expansion-panel :title="$t('ipControl.journal')">
                <v-expansion-panel-text>
                  <v-data-table
                    :headers="eventHeaders"
                    :items="store.events"
                    :loading="eventsLoading"
                    :items-per-page="10"
                  >
                    <template #item.at="{ item }">
                      {{ new Date(item.at * 1000).toLocaleString(locale) }}
                    </template>
                    <template #item.client_id="{ item }">
                      {{ eventClient(item) }}
                    </template>
                    <template #item.code="{ item }">
                      {{ $t('ipControl.events.' + item.code) }}
                    </template>
                    <template #item.denied="{ item }">
                      {{ item.code === 'admission_changed' ? item.denied : '-' }}
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn
          variant="text"
          icon="mdi-refresh"
          :aria-label="$t('actions.update')"
          :disabled="loading || saving"
          @click="load"
        />
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          :disabled="saving"
          @click="emit('close')"
        >
          {{ $t('actions.close') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="tonal"
          :disabled="loading || !form || !valid"
          :loading="saving"
          @click="save"
        >
          {{ $t('actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { i18n, locale } from '@/locales'
import Data from '@/store/modules/data'
import { useIPControl } from '../state'
import { validLimit } from '../types'
import type { IPConfiguration, IPEvent } from '../types'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()
const store = useIPControl()
const form = ref<IPConfiguration | null>(null)
const editor = ref<{ validate: () => Promise<{ valid: boolean }> }>()
const loading = ref(false)
const saving = ref(false)
const failed = ref(false)
const valid = ref(false)
const journal = ref<number>()
const eventsLoading = ref(false)
let generation = 0

const unusedGroups = computed(() => store.groups.filter(group => !form.value?.groups.some(rule => rule.group === group)))
function groupOptions(index: number) {
  return store.groups.filter(group => !form.value?.groups.some((rule, position) => position !== index && rule.group === group))
}
const invalid = () => i18n.global.t('error.invalidData')
const activityRule = (value: unknown) => validLimit(value) && Number(value) > 15 || invalid()
const transitionRule = (value: unknown) => validLimit(value) && Number(value) >= Math.max(30, form.value?.activity_seconds ?? 60) || invalid()
const limitRule = (value: unknown) => validLimit(value) || invalid()
const requiredGroup = (value: unknown) => typeof value === 'string' && value.length > 0 || invalid()
const eventHeaders = computed(() => [
  { title: i18n.global.t('ipControl.time'), key: 'at' },
  { title: i18n.global.t('objects.client'), key: 'client_id' },
  { title: i18n.global.t('ipControl.event'), key: 'code' },
  { title: i18n.global.t('ipControl.denied'), key: 'denied' },
])
function eventClient(event: IPEvent) {
  if (!event.client_id) return '-'
  return Data().clients?.find(client => client.id === event.client_id && client.createdAt === event.client_created_at)?.name ?? `#${event.client_id}`
}
async function load() {
  const current = ++generation
  loading.value = true
  failed.value = false
  const success = await store.loadSettings()
  if (current !== generation) return
  const config = store.config
  form.value = success && config ? { ...config, groups: config.groups.map(rule => ({ ...rule })) } : null
  failed.value = !success
  loading.value = false
}
async function save() {
  if (!form.value || !(await editor.value?.validate())?.valid) return
  saving.value = true
  try {
    if (await store.save(form.value)) emit('close')
  } finally { saving.value = false }
}
watch(() => props.visible, visible => {
  if (visible) { journal.value = undefined; void load() }
  else { generation++; form.value = null; loading.value = false }
})
watch(journal, async value => {
  if (value == null) return
  eventsLoading.value = true
  try { await store.loadEvents() } finally { eventsLoading.value = false }
})
</script>
