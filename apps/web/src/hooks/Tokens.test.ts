import { Token } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrencyInfo } from 'hooks/Tokens'
import { TEST_TOKEN_1 } from 'test-utils/constants'
import { renderHook } from 'test-utils/render'
import { DAI, nativeOnChain } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo as useUniswapCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

describe('useCurrencyInfo', () => {
  it('returns undefined if no address is provided', () => {
    const { result } = renderHook(() => useCurrencyInfo(undefined, UniverseChainId.Mainnet))

    expect(result.current).toBeUndefined()
  })

  it('returns undefined if skip is true and no common base is found', () => {
    const { result } = renderHook(() => useCurrencyInfo(TEST_TOKEN_1.address, UniverseChainId.Mainnet, true))

    expect(result.current).toBeUndefined()
  })

  describe('ERC20', () => {
    it('calls useUniswapCurrencyInfo with the correct arguments', () => {
      renderHook(() => useCurrencyInfo(DAI.address, UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(`${UniverseChainId.Mainnet}-${DAI.address}`, {
        skip: undefined,
      })
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when Currency is provided', () => {
      const currency = new Token(UniverseChainId.Mainnet, DAI.address, 18, DAI.symbol, DAI.name)
      renderHook(() => useCurrencyInfo(currency))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(`${UniverseChainId.Mainnet}-${DAI.address}`, {
        skip: undefined,
      })
    })
  })

  describe(`${NATIVE_CHAIN_ID}`, () => {
    it('calls useUniswapCurrencyInfo with the correct arguments', () => {
      renderHook(() => useCurrencyInfo('ETH', UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${getChainInfo(UniverseChainId.Mainnet).nativeCurrency.address}`,
        { skip: undefined },
      )
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when no address is provided', () => {
      renderHook(() => useCurrencyInfo(undefined, UniverseChainId.Mainnet))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${getChainInfo(UniverseChainId.Mainnet).nativeCurrency.address}`,
        { skip: undefined },
      )
    })

    it('calls useUniswapCurrencyInfo with the correct arguments when Currency is provided', () => {
      const currency = nativeOnChain(UniverseChainId.Mainnet)
      renderHook(() => useCurrencyInfo(currency))

      expect(useUniswapCurrencyInfo).toHaveBeenCalledWith(
        `${UniverseChainId.Mainnet}-${getChainInfo(UniverseChainId.Mainnet).nativeCurrency.address}`,
        { skip: undefined },
      )
    })
  })
})
