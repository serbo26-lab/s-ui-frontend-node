import { defineStore } from 'pinia'
import HttpUtils from '@/plugins/httputil'
import type { IPConfiguration, IPEvent } from './types'

let session = 0
export function invalidateIPRequests() { session++ }

export const useIPControl = defineStore('IPControl', {
  state: () => ({
    config: null as IPConfiguration | null,
    groups: [] as string[],
    events: [] as IPEvent[],
    epoch: 0,
  }),
  actions: {
    async loadSettings(): Promise<boolean> {
      const current = session
      const epoch = ++this.epoch
      const [settings, groups] = await Promise.all([
        HttpUtils.get<IPConfiguration>('api/antiabuse/settings'),
        HttpUtils.get<string[]>('api/antiabuse/groups'),
      ])
      if (current !== session || epoch !== this.epoch) return false
      if (settings.success) this.config = settings.obj
      if (groups.success) this.groups = groups.obj
      return settings.success && groups.success
    },
    async save(value: IPConfiguration): Promise<boolean> {
      const current = session
      const epoch = ++this.epoch
      const result = await HttpUtils.post<IPConfiguration>('api/antiabuse/settings', value,
        { headers: { 'Content-Type': 'application/json' } })
      if (current !== session || epoch !== this.epoch || !result.success) return false
      this.config = result.obj
      return true
    },
    async loadEvents(): Promise<boolean> {
      const current = session
      const result = await HttpUtils.get<IPEvent[]>('api/antiabuse/events', { limit: 200 })
      if (current !== session || !result.success) return false
      this.events = result.obj
      return true
    },
  },
})
