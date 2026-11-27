import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import HttpUtils, { registerHttpHooks } from '@/plugins/httputil'
import { useIPControl } from './state'
import { registerIPControlHttpHooks } from './integration'
import { i18n } from '@/locales'
import type { IPConfiguration } from './types'

vi.mock('@/plugins/httputil', () => ({ default: { get: vi.fn(), post: vi.fn() }, registerHttpHooks: vi.fn() }))
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })
const config: IPConfiguration = { revision: 1, enabled: true, activity_seconds: 60, transition_seconds: 120, groups: [] }

it('does not let a pre-save response overwrite saved group limits', async () => {
  let finish: (value: { success: boolean; msg: string; obj: IPConfiguration }) => void = () => {}
  vi.mocked(HttpUtils.get).mockImplementation(url => url.endsWith('groups')
    ? Promise.resolve({ success: true, msg: '', obj: [] }) : new Promise(resolve => { finish = resolve }))
  const store = useIPControl(), pending = store.loadSettings()
  vi.mocked(HttpUtils.post).mockResolvedValue({ success: true, msg: '', obj: { ...config, revision: 2 } })
  expect(await store.save(config)).toBe(true)
  finish({ success: true, msg: '', obj: config })
  expect(await pending).toBe(false)
  expect(store.config?.revision).toBe(2)
})

it('clears private state on logout and ignores the old account response', async () => {
  let finish: (value: { success: boolean; msg: string; obj: IPConfiguration }) => void = () => {}
  vi.mocked(HttpUtils.get).mockImplementation(url => url.endsWith('groups')
    ? Promise.resolve({ success: true, msg: '', obj: [] }) : new Promise(resolve => { finish = resolve }))
  const store = useIPControl(), pending = store.loadSettings()
  registerIPControlHttpHooks()
  vi.mocked(registerHttpHooks).mock.calls[0][0].onLogout?.()
  finish({ success: true, msg: '', obj: config })
  expect(await pending).toBe(false)
  expect(store.config).toBeNull()
  const error = vi.mocked(registerHttpHooks).mock.calls[0][0].errorMessage
  expect(error?.(': ip_control_conflict')).toBe(i18n.global.t('ipControl.errors.conflict'))
  expect(error?.('unrelated')).toBeUndefined()
})
