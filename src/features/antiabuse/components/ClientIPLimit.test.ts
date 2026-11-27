import { beforeEach, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { i18n } from '@/locales'
import { useIPControl } from '../state'
import ClientIPLimit from './ClientIPLimit.vue'

const field = {
  props: ['placeholder', 'modelValue'],
  emits: ['update:modelValue'],
  template: '<input :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)">',
}
const global = { plugins: [i18n], stubs: { VTextField: field } }
beforeEach(() => setActivePinia(createPinia()))

it('loads group inheritance for a new visible client without a traffic counter', async () => {
  const store = useIPControl()
  const load = vi.spyOn(store, 'loadSettings').mockImplementation(async () => {
    store.config = { revision: 1, enabled: true, activity_seconds: 60, transition_seconds: 120, trusted_proxies: [],
      groups: [{ group: 'group', limit: 4 }] }
    return true
  })
  const wrapper = mount(ClientIPLimit, { props: { group: 'group', visible: true }, global })
  await flushPromises()
  expect(load).toHaveBeenCalledOnce()
  expect(wrapper.find('input').attributes('placeholder')).toContain('4')
  await wrapper.find('input').setValue('0')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ limit: 0 }])
  await wrapper.find('input').setValue('')
  expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ limit: null }])
  wrapper.unmount()
})

it('does not fetch rules for a closed client dialog', async () => {
  const load = vi.spyOn(useIPControl(), 'loadSettings').mockResolvedValue(true)
  const wrapper = mount(ClientIPLimit, { props: { group: '', visible: false }, global })
  expect(load).not.toHaveBeenCalled()
  await wrapper.setProps({ visible: true })
  expect(load).toHaveBeenCalledOnce()
  wrapper.unmount()
})
