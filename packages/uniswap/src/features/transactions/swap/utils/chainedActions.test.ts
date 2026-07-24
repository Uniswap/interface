import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS } from 'uniswap/src/features/transactions/swap/utils/chainedActions'

describe('DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS', () => {
  it('includes chains that do not support chained actions', () => {
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).toContain(UniverseChainId.Solana)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).toContain(UniverseChainId.Polygon)
  })

  it('excludes chains that support chained actions', () => {
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Mainnet)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Base)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Sepolia)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Arc)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Robinhood)
    expect(DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS).not.toContain(UniverseChainId.Monad)
  })

  it('only contains known chain ids', () => {
    for (const chainId of DEFAULT_CHAINED_ACTIONS_UNSUPPORTED_CHAIN_IDS) {
      expect(ALL_CHAIN_IDS).toContain(chainId)
    }
  })
})
