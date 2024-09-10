import { Token } from '@uniswap/sdk-core'
import { DAI, NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrencyInfo } from 'hooks/Tokens'
import { renderHook } from 'test-utils/render'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { useCurrencyInfo as useUniswapCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { UniverseChainId } from 'uniswap/src/types/chains'

jest.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: jest.fn(),
}))

describe('useCurrencyInfo', () => {
  it('returns undefined if no address is provided', () => {
    const { result } = renderHook(() => useCurrencyInfo(undefined, UniverseChainId.Mainnet))

    expect(result.current).toBeUndefined()
  })

  it('returns undefined if skip is true', () => {
    const { result } = renderHook(() => useCurrencyInfo(DAI.address, UniverseChainId.Mainnet, true))

    expect(result.current).toBeUndefined()
  })

  describe('ERC20', () => {
    it('calls useUniswapCurrencyInfo with the correct arguments', () => {
      renderHook(() => useCurrencyInfo(DAI.address, UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(`${UniverseChainId.Mainnet}-${DAI.address}`)
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when Currency is provided', () => {
      const currency = new Token(UniverseChainId.Mainnet, DAI.address, 18, DAI.symbol, DAI.name)
      renderHook(() => useCurrencyInfo(currency))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(`${UniverseChainId.Mainnet}-${DAI.address}`)
    })
  })

  describe(`${NATIVE_CHAIN_ID}`, () => {
    it('calls useUniswapCurrencyInfo with the correct arguments', () => {
      renderHook(() => useCurrencyInfo('ETH', UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet].nativeCurrency.address}`,
      )
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when no address is provided', () => {
      renderHook(() => useCurrencyInfo(undefined, UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet].nativeCurrency.address}`,
      )
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when Currency is provided', () => {
      const currency = NativeCurrency.onChain(UniverseChainId.Mainnet)
      renderHook(() => useCurrencyInfo(currency))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet].nativeCurrency.address}`,
      )
    })
  })
})
