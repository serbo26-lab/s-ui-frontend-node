import { describe, expect, it } from 'vitest'
import { createI18n } from 'vue-i18n'
import { i18n, languages } from '@/locales'
import en from '@/locales/en'
import fa from '@/locales/fa'
import vi from '@/locales/vi'
import zhcn from '@/locales/zhcn'
import zhtw from '@/locales/zhtw'
import ru from '@/locales/ru'
import { ipMessages } from './index'

const baseMessages = { en, fa, vi, zhHans: zhcn, zhHant: zhtw, ru }

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path))
  }))
}

const locales = Object.keys(ipMessages) as (keyof typeof ipMessages)[]
const referenceMessages = flatten(ipMessages.en)
const expectedKeys = Object.keys(referenceMessages).sort()
const params = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

it('registers IP control messages for every language offered by the panel', () => {
  expect(locales.sort()).toEqual(languages.map(language => language.value).sort())
  for (const locale of locales) {
    for (const key of expectedKeys) expect(i18n.global.te(key, locale), `${locale}: ${key}`).toBe(true)
  }
})

describe.each(locales)('%s IP control translations', locale => {
  const messages = flatten(ipMessages[locale])

  it('has the complete schema and preserves named parameters', () => {
    expect(Object.keys(messages).sort()).toEqual(expectedKeys)
    for (const [key, value] of Object.entries(messages)) {
      expect(value.trim(), key).not.toBe('')
      expect(value, key).not.toContain('\uFFFD')
      expect(params(value), key).toEqual(params(referenceMessages[key]))
    }
  })

  it('resolves every message and linked term without an English fallback', () => {
    const failures: string[] = []
    const translator = createI18n({
      legacy: false,
      locale,
      fallbackLocale: false,
      messages: { [locale]: { ...baseMessages[locale], ...ipMessages[locale] } },
      missing: (_locale, key) => { failures.push(key) },
    })
    for (const key of expectedKeys) {
      const text = translator.global.t(key, { limit: '4' })
      expect(text, key).not.toBe(key)
      expect(text, key).not.toContain('@:')
      expect(text, key).not.toMatch(/\{limit\}/)
    }
    expect(failures).toEqual([])
  })

  it('keeps the dictionaries separate from the original panel', () => {
    expect(Object.keys(ipMessages[locale])).toEqual(['ipControl'])
    expect(Object.keys(ipMessages[locale]).filter(key => key in baseMessages[locale])).toEqual([])
    expect(messages['ipControl.errors.invalid']).toBe('@:error.invalidData')
  })
})
