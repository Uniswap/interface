import { nativeOnChain, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'

describe(getRWACandidatesFromCurrency, () => {
  it('returns an empty list for native currencies', () => {
    expect(getRWACandidatesFromCurrency(nativeOnChain(UniverseChainId.Mainnet))).toEqual([])
  })

  it('returns chain and address for ERC-20 currencies', () => {
    expect(getRWACandidatesFromCurrency(USDC_MAINNET)).toEqual([
      { chainId: USDC_MAINNET.chainId, address: USDC_MAINNET.address },
    ])
  })
})
