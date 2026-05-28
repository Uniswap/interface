import { describe, expect, it } from 'vitest'
import { createNamehash } from './createNamehash'

const ethersNamehash = createNamehash({ getViemEnabled: () => false })
const viemNamehash = createNamehash({ getViemEnabled: () => true })

describe('namehash', () => {
  it('agree on standard text names', () => {
    const hash = '0xdf9f9b4fcb3ade7e9511f102ef22522bdd82ea57c5e03ce4acb63f1bf78befc6'
    expect(ethersNamehash('textname')).toEqual(hash)
    expect(viemNamehash('textname')).toEqual(hash)
  })

  it('agree on subdomain names', () => {
    expect(ethersNamehash('sub.example.eth')).toEqual(viemNamehash('sub.example.eth'))
  })

  it('agree on emoji names', () => {
    expect(ethersNamehash('🙂')).toEqual(viemNamehash('🙂'))
  })

  it('agree on deeply nested subdomains', () => {
    expect(ethersNamehash('a.b.c.d.eth')).toEqual(viemNamehash('a.b.c.d.eth'))
  })

  // viem uses @adraffy/ens-normalize (ENSIP-15), which accepts
  // zero-width joiners as valid input. ethers uses an older
  // normalization that throws on these characters.
  it('zero-width joiner: ethers throws, viem returns a hash', () => {
    const zeroWidthJoiner = '\u200D'
    expect(() => ethersNamehash(zeroWidthJoiner)).toThrow()
    expect(() => viemNamehash(zeroWidthJoiner)).not.toThrow()
    expect(typeof viemNamehash(zeroWidthJoiner)).toBe('string')
  })
})
