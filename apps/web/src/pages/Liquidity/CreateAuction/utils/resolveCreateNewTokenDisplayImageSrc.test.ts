import { describe, expect, it } from 'vitest'
import { resolveCreateNewTokenDisplayImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveCreateNewTokenDisplayImageSrc'

describe('resolveCreateNewTokenDisplayImageSrc', () => {
  it('prefers the local blob preview when present', () => {
    expect(resolveCreateNewTokenDisplayImageSrc('blob:http://localhost/x', 'ipfs://bafkreitest')).toBe(
      'blob:http://localhost/x',
    )
  })

  it('falls back to resolving imageUrl when there is no local preview', () => {
    expect(resolveCreateNewTokenDisplayImageSrc('', 'ipfs://bafkreitest')).toBe(
      'https://gateway.pinata.cloud/ipfs/bafkreitest',
    )
  })

  it('returns undefined when both are empty', () => {
    expect(resolveCreateNewTokenDisplayImageSrc('', '')).toBeUndefined()
  })
})
