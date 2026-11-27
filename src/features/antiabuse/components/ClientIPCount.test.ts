import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import { useIPControl } from '../state'
import ClientIPCount from './ClientIPCount.vue'

vi.mock('@/plugins/httputil', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  vi.spyOn(useIPControl(), 'loadSettings').mockResolvedValue(true)
})
afterEach(() => vi.useRealTimers())
const global = { plugins: [i18n], stubs: { VTooltip: true } }

it('shows a complete zero but does not turn missing data into zero', async () => {
  vi.mocked(HttpUtils.get).mockResolvedValue({ success: true, msg: '', obj: {
    enabled: true, clients: [{ client_id: 1, available: true, active_count: 0 }],
  } })
  const wrapper = mount(ClientIPCount, { props: { clientId: 1, visible: true }, global })
  await flushPromises()
  expect(wrapper.text()).toMatch(/: 0$/)
  await wrapper.setProps({ clientId: 2 })
  vi.mocked(HttpUtils.get).mockResolvedValue({ success: true, msg: '', obj: {
    enabled: true, clients: [{ client_id: 2, available: false, active_count: null }],
  } })
  await wrapper.setProps({ visible: false })
  await wrapper.setProps({ visible: true })
  await flushPromises()
  expect(wrapper.text()).toMatch(/: -$/)
  expect(HttpUtils.post).not.toHaveBeenCalled()
  wrapper.unmount()
})

it('expires the displayed value while the next request is stalled', async () => {
  vi.useFakeTimers()
  vi.mocked(HttpUtils.get).mockResolvedValueOnce({ success: true, msg: '', obj: {
    enabled: true, clients: [{ client_id: 1, available: true, active_count: 2 }],
  } }).mockImplementation(() => new Promise(() => {}))
  const wrapper = mount(ClientIPCount, { props: { clientId: 1, visible: true }, global })
  await flushPromises()
  expect(wrapper.text()).toMatch(/: 2$/)
  await vi.advanceTimersByTimeAsync(15000)
  expect(wrapper.text()).toMatch(/: -$/)
  wrapper.unmount()
})
