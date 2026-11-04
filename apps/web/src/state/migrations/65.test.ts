import { migration65 } from '~/state/migrations/65'

describe('migration65', () => {
  it('returns undefined when state is undefined', () => {
    expect(migration65(undefined)).toBeUndefined()
  })

  it('bumps the persisted version to 65 and removes Blast transactions, search history, and token visibility', () => {
    const previousState = {
      _persist: { version: 64, rehydrated: true },
      transactions: { '0xabc': { 1: { a: { id: 'a' } }, 81457: { b: { id: 'b' } } } },
      searchHistory: { results: [{ chainId: 1 }, { chainId: 81457 }, { address: '0xabc' }] },
      visibility: { positions: {}, tokens: { '1-0xa': { isVisible: false }, '81457-0xb': { isVisible: false } } },
    }
    const result: any = migration65(previousState as any)
    expect(result._persist.version).toBe(65)
    expect(result.transactions).toEqual({ '0xabc': { 1: { a: { id: 'a' } } } })
    expect(result.searchHistory.results).toEqual([{ chainId: 1 }, { address: '0xabc' }])
    expect(result.visibility).toEqual({ positions: {}, tokens: { '1-0xa': { isVisible: false } } })
  })
})
