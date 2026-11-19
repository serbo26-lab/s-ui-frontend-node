import {expect,it,vi} from 'vitest'
import {mount} from '@vue/test-utils'
import {i18n} from '@/locales'
import NodeProviders from './NodeProviders.vue'
vi.mock('@/store/modules/data',()=>({default:()=>{throw new Error('Remote provider editor must not read the panel store')}}))
const editor={name:'CertProvider',props:{remote:Boolean,httpClients:Array,contextName:String,tags:Array},template:'<div />'}
const global={plugins:[i18n],renderStubDefaultSlot:true,stubs:{CertProvider:editor,VCard:true,VCardTitle:true,VCardText:true,VList:true,VListItem:true,VSpacer:true,VBtn:true}}
it('passes only this node HTTP clients to the reused provider editor',()=>{
 const wrapper=mount(NodeProviders,{props:{contextName:'node one',modelValue:JSON.stringify({http_clients:[{tag:'node-ca-http'}],certificate_providers:[{type:'acme',tag:'node-ca',domain:['vpn.example']}]})},global})
 const provider=wrapper.findComponent({name:'CertProvider'})
 expect(provider.props('remote')).toBe(true)
 expect(provider.props('httpClients')).toEqual(['node-ca-http'])
 expect(provider.props('tags')).toEqual(['node-ca'])
 wrapper.unmount()
})
it('saves a provider into node config without discarding its routing and clients',async()=>{
 const source={route:{final:'own-route'},http_clients:[{tag:'own-client'}]}
 const wrapper=mount(NodeProviders,{props:{contextName:'node one',modelValue:JSON.stringify(source)},global})
 wrapper.findComponent({name:'CertProvider'}).vm.$emit('save',{type:'acme',tag:'ca',domain:['vpn.example']})
 await wrapper.vm.$nextTick()
 const saved=JSON.parse(wrapper.emitted('update:modelValue')![0][0] as string)
 expect(saved.route).toEqual(source.route)
 expect(saved.http_clients).toEqual(source.http_clients)
 expect(saved.certificate_providers[0].tag).toBe('ca')
 expect(source).not.toHaveProperty('certificate_providers')
 wrapper.unmount()
})
