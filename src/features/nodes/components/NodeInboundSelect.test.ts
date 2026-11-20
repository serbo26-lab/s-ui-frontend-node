import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/locales'
import Nodes from '@/features/nodes/state/nodes'
import Data from '@/store/modules/data'
import { createInbound } from '@/types/inbounds'
import { createClient } from '@/types/clients'
import type { NodesBundle } from '@/features/nodes/types/nodes'
import HttpUtils from '@/plugins/httputil'
import NodeInboundSelect from './NodeInboundSelect.vue'

vi.mock('@/plugins/httputil', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('notivue', () => ({ push: { error: vi.fn(), success: vi.fn() } }))

const bundle: NodesBundle = {
  nodes: [1, 2].map(id => ({ id, name: `node-${id}`, enable: true, address: `https://node-${id}.example`, linkaddress: `node-${id}.example`, template_id: 0, desired_revision: 1, applied_revision: 1, last_seen: 1, control_tls_configured: true })),
  nodetemplates: [],
  nodeinbounds: [1, 2].map(id => ({ id, node_id: id, tag: 'same-tag', type: 'vless', enable: true, options: {}, client_tls: {} })),
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.mocked(HttpUtils.get).mockResolvedValue({ success: true, msg: '', obj: bundle })
})

describe('remote assignment selector', () => {
  it('keeps local IDs separate and distinguishes the same tag on two nodes', async () => {
    Data().inbounds = [createInbound('vless', { id: 1, tag: 'local-only' })]
    const wrapper = mount(NodeInboundSelect, {
      props: { modelValue: [1] },
      global: { plugins: [i18n], stubs: { VSelect: { name: 'VSelect', props: ['items', 'modelValue'], template: '<div />' }, VAlert: true, VBtn: true } },
    })
    await flushPromises()
    const select = wrapper.findComponent({ name: 'VSelect' })
    const items = select.props('items') as { title: string, value: number }[]
    expect(items.map(item => item.value)).toEqual([1, 2])
    expect(items[0].title).toContain('node-1 / same-tag')
    expect(items[1].title).toContain('node-2 / same-tag')
    expect(items.some(item => item.title.includes('local-only'))).toBe(false)
    select.vm.$emit('update:modelValue', [])
    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]])
    expect(Data().inbounds[0].id).toBe(1)
    wrapper.unmount()
  })

  it('retains loaded remote data when refreshing fails', async () => {
    const store = Nodes()
    store.setBundle(bundle)
    vi.mocked(HttpUtils.get).mockResolvedValue({ success: false, msg: 'offline', obj: null })
    await store.load()
    expect(store.failed).toBe(true)
    expect(store.inbounds).toHaveLength(2)
  })

  it('gives new clients independent local and node arrays', () => {
    const first = createClient({ inbounds: [21], nodeinbounds: [1] })
    const second = createClient()
    first.nodeinbounds?.push(2)
    expect(first.inbounds).toEqual([21])
    expect(second.nodeinbounds).toEqual([])
    expect(second.inbounds).toEqual([])
  })
})
