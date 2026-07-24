import { describe, expect, it } from 'vitest'
import { resolveTokenImageSrc } from '~/pages/Liquidity/CreateAuction/utils/resolveTokenImageSrc'

describe('resolveTokenImageSrc', () => {
  it('resolves an ipfs:// uri to the Pinata gateway', () => {
    expect(resolveTokenImageSrc('ipfs://bafybeicb34tk4xdiqk2qatukpcguo4ojimxxxh5tge2rtolpkme5hemlem')).toBe(
      'https://gateway.pinata.cloud/ipfs/bafybeicb34tk4xdiqk2qatukpcguo4ojimxxxh5tge2rtolpkme5hemlem',
    )
  })

  it('strips a redundant ipfs/ path segment', () => {
    expect(resolveTokenImageSrc('ipfs://ipfs/bafkreitest')).toBe('https://gateway.pinata.cloud/ipfs/bafkreitest')
  })

  it.each([undefined, null, ''])('returns undefined for %p', (value) => {
    expect(resolveTokenImageSrc(value)).toBeUndefined()
  })

  it.each(['https://example.com/logo.png', 'data:image/png;base64,abc', 'blob:http://localhost:3000/0d1e'])(
    'passes through non-ipfs value %p unchanged',
    (value) => {
      expect(resolveTokenImageSrc(value)).toBe(value)
    },
  )
})
