import { CHAIN_METADATA } from '@universe/chains'
import { ALL_CHAIN_IDS, UNIVERSE_CHAIN_INFO } from 'uniswap/src/features/chains/chainInfo'

const stripTrailingSlash = (url: string): string => url.replace(/\/$/, '')

// CHAIN_METADATA (web-safe, in @universe/chains) must stay a projection of
// UNIVERSE_CHAIN_INFO — a chain rename or explorer change here fails until the
// shared table follows, so no third copy of chain facts can drift silently.
describe('CHAIN_METADATA stays pinned to UNIVERSE_CHAIN_INFO', () => {
  it.each(ALL_CHAIN_IDS)('chain %s matches the canonical info', (chainId) => {
    const meta = CHAIN_METADATA[chainId]
    const info = UNIVERSE_CHAIN_INFO[chainId]

    expect(meta.label).toBe(info.label)
    expect(meta.testnet).toBe(Boolean(info.testnet))
    expect(meta.explorer.name).toBe(info.explorer.name)
    expect(meta.explorer.url).toBe(stripTrailingSlash(info.explorer.url))
  })
})
