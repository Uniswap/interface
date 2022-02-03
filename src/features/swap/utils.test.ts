import { ChainId } from 'src/constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import { getWrapType, serializeQueryParams } from 'src/features/swap/utils'
import { WrapType } from 'src/features/swap/wrapSaga'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'

describe(serializeQueryParams, () => {
  it('handles the correct types', () => {
    expect(
      serializeQueryParams({ a: '0x6B175474E89094C44Da98b954EedeAC495271d0F', b: 2, c: false })
    ).toBe('a=0x6B175474E89094C44Da98b954EedeAC495271d0F&b=2&c=false')
  })

  it('escapes characters', () => {
    expect(serializeQueryParams({ space: ' ', bang: '!' })).toEqual('space=%20&bang=!')
  })
})

describe(getWrapType, () => {
  const eth = NativeCurrency.onChain(ChainId.Mainnet)
  const weth = WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet]

  const rinkEth = NativeCurrency.onChain(ChainId.Rinkeby)
  const rinkWeth = WRAPPED_NATIVE_CURRENCY[ChainId.Rinkeby]

  it('handles undefined args', () => {
    expect(getWrapType(undefined, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(weth, undefined)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(undefined, undefined)).toEqual(WrapType.NotApplicable)
  })

  it('handles wrap', () => {
    expect(getWrapType(eth, weth)).toEqual(WrapType.Wrap)

    // different chains
    expect(getWrapType(rinkEth, weth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(eth, rinkWeth)).toEqual(WrapType.NotApplicable)
  })

  it('handles unwrap', () => {
    expect(getWrapType(weth, eth)).toEqual(WrapType.Unwrap)

    // different chains
    expect(getWrapType(weth, rinkEth)).toEqual(WrapType.NotApplicable)
    expect(getWrapType(rinkWeth, eth)).toEqual(WrapType.NotApplicable)
  })
})
