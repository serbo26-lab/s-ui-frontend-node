import { beforeEach, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import Nodes, { invalidateNodesRequests } from './nodes'
import HttpUtils from '@/plugins/httputil'
import type { NodesBundle } from '@/features/nodes/types/nodes'
vi.mock('@/plugins/httputil', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('notivue', () => ({ push: { success: vi.fn() } }))
beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })
const empty: NodesBundle = { nodes: [], nodetemplates: [], nodeinbounds: [] }
it('does not overwrite a successful save with an older background poll', async () => {
  let finish: (value: {success:boolean,msg:string,obj:NodesBundle})=>void = () => {}
  vi.mocked(HttpUtils.get).mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const saved: NodesBundle = { ...empty, nodetemplates: [{ id: 1, name: 'new-template', config: {}, blueprints: [] }] }
  vi.mocked(HttpUtils.post).mockResolvedValue({success:true,msg:'',obj:saved})
  const store=Nodes(), poll=store.load()
  await store.save('nodetemplates','new',{name:'new-template',config:{}})
  finish({success:true,msg:'',obj:empty});await poll
  expect(store.templates.map(value=>value.name)).toEqual(['new-template'])
  expect(store.writes).toBe(0)
})
it('keeps records and an actionable error when save is rejected', async () => {
  const store=Nodes();store.setBundle({...empty,nodetemplates:[{id:1,name:'keep',config:{}}]})
  vi.mocked(HttpUtils.post).mockResolvedValue({success:false,msg:'template in use',obj:null})
  expect(await store.save('nodetemplates','del',1)).toBe(false)
  expect(store.templates[0].name).toBe('keep')
  expect(store.lastSaveError).toBe('template in use')
})

it('does not restore a previous account response after logout/reset', async () => {
  let finish: (value: {success:boolean,msg:string,obj:NodesBundle})=>void = () => {}
  vi.mocked(HttpUtils.get).mockImplementation(() => new Promise(resolve => { finish = resolve }))
  const store=Nodes(), poll=store.load()
  invalidateNodesRequests();store.$reset()
  finish({success:true,msg:'',obj:{...empty,nodetemplates:[{id:1,name:'previous-account',config:{}}]}});await poll
  expect(store.loaded).toBe(false)
  expect(store.templates).toEqual([])
})
