import { describe, expect, it } from 'vitest'
import { toSearchQueryParam } from '~/utils/listRequestParams'

describe('toSearchQueryParam', () => {
  it('trims surrounding whitespace', () => {
    expect(toSearchQueryParam('  dai ')).toBe('dai')
  })

  it('returns undefined for an empty or whitespace-only string so the request stays unsearched', () => {
    expect(toSearchQueryParam('')).toBeUndefined()
    expect(toSearchQueryParam('   ')).toBeUndefined()
  })

  it('leaves case and inner whitespace to the backend normalizer', () => {
    expect(toSearchQueryParam('USD  Coin')).toBe('USD  Coin')
  })
})
