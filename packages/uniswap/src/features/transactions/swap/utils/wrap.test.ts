import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getWrapType } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { wrappedNativeCurrency } from 'uniswap/src/utils/currency'

describe(getWrapType, () => {
  const eth = nativeOnChain(UniverseChainId.Mainnet)
  const weth = wrappedNativeCurrency(UniverseChainId.Mainnet)

  const arbEth = nativeOnChain(UniverseChainId.ArbitrumOne)
  const arbWeth = wrappedNativeCurrency(UniverseChainId.ArbitrumOne)

  it('handles undefined args', () => {
    expect(getWrapType(undefined, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(weth, undefined)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(undefined, undefined)).toEqual(WrapType.NotApplicable)
  })

  it('handles wrap', () => {
    expect(getWrapType(eth, weth)).toEqual(WrapType.Wrap)

    // different chains
    expect(getWrapType(arbEth, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(eth, arbWeth)).toEqual(WrapType.NotApplicable)
  })

  it('handles unwrap', () => {
    expect(getWrapType(weth, eth)).toEqual(WrapType.Unwrap)

    // different chains
    expect(getWrapType(weth, arbEth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(arbWeth, eth)).toEqual(WrapType.NotApplicable)
  })
})
