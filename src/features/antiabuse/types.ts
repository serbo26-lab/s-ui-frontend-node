export interface ClientIPPolicy { limit: number | null }
export interface GroupIPRule { group: string; limit: number }
export interface IPConfiguration {
  revision: number
  enabled: boolean
  activity_seconds: number
  transition_seconds: number
  groups: GroupIPRule[]
}
export interface ClientIPStatus {
  client_id: number
  limit_source: "client" | "group" | "default"
  requested_revision: number
  applied_revision: number
  limit: number
  available: boolean
  active_count: number | null
  checking: boolean
  applied: boolean
  updated_at: number
  denied: number
}
export interface IPEvent {
  id: number
  at: number
  client_id?: number
  client_created_at?: number
  code: 'configuration_changed' | 'admission_changed'
  denied: number
}

export function validLimit(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xFFFFFFFF
}

export function effectiveLimit(policy: ClientIPPolicy | undefined, group: string, config: IPConfiguration | null): number {
  return policy?.limit ?? config?.groups.find(rule => rule.group === group)?.limit ?? 0
}
