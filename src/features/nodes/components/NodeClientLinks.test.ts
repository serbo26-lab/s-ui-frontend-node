import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/locales'
import HttpUtils from '@/plugins/httputil'
import NodeClientLinks from './NodeClientLinks.vue'
vi.mock('@/plugins/httputil',()=>({default:{get:vi.fn(),post:vi.fn()}}))
beforeEach(()=>vi.clearAllMocks())
const global={plugins:[i18n],stubs:{VAlert:true,VProgressLinear:true,QrcodeVue:true}}
it('loads confirmed links read-only and never posts them to Client.Links',async()=>{
  vi.mocked(HttpUtils.get).mockResolvedValue({success:true,msg:'',obj:[{remark:'node / vless',uri:'vless://test@node.example:443'}]})
  const wrapper=mount(NodeClientLinks,{props:{clientId:1,active:true},global})
  await flushPromises()
  expect(wrapper.text()).toContain('vless://test@node.example:443')
  expect(wrapper.find('input').exists()).toBe(false)
  expect(HttpUtils.post).not.toHaveBeenCalled()
  wrapper.unmount()
})
it('does not expose a late response after the dialog closes',async()=>{
  let finish:(value:{success:boolean,msg:string,obj:{remark:string,uri:string}[]})=>void=()=>{}
  vi.mocked(HttpUtils.get).mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
  const wrapper=mount(NodeClientLinks,{props:{clientId:1,active:true},global})
  await wrapper.setProps({active:false})
  finish({success:true,msg:'',obj:[{remark:'old',uri:'vless://old@node.example:443'}]});await flushPromises()
  expect(wrapper.text()).not.toContain('vless://old')
  wrapper.unmount()
})
