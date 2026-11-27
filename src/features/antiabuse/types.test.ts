import { expect, it } from 'vitest'
import { effectiveLimit, validLimit } from './types'
import type { IPConfiguration } from './types'

const config: IPConfiguration = { revision: 1, enabled: true, activity_seconds: 60,
  transition_seconds: 120, trusted_proxies: [], groups: [{ group: 'group', limit: 4 }] }

it('preserves inheritance, explicit unlimited and both override directions', () => {
  expect(effectiveLimit(undefined, 'group', config)).toBe(4)
  expect(effectiveLimit({ limit: null }, 'group', config)).toBe(4)
  expect(effectiveLimit({ limit: 0 }, 'group', config)).toBe(0)
  expect(effectiveLimit({ limit: 5 }, 'group', config)).toBe(5)
  expect(effectiveLimit({ limit: 2 }, 'group', config)).toBe(2)
  expect(effectiveLimit(undefined, 'Group', config)).toBe(0)
})

it('rejects values that cannot round-trip through the IP policy API', () => {
  for (const value of [-1, 1.5, NaN, Infinity, 0x100000000, '', null]) expect(validLimit(value)).toBe(false)
  for (const value of [0, 1, 0xFFFFFFFF]) expect(validLimit(value)).toBe(true)
})
