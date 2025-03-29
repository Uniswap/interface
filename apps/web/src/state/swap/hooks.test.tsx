import { parse } from 'qs'
import { queryParametersToCurrencyState } from 'state/swap/hooks'
import { mocked } from 'test-utils/mocked'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { GQL_MAINNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

jest.mock('uniswap/src/features/gating/hooks', () => {
  return {
    useFeatureFlag: jest.fn(),
  }
})

jest.mock('uniswap/src/contexts/UniswapContext')

jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  ...jest.requireActual('uniswap/src/features/chains/hooks/useEnabledChains'),
  useEnabledChains: jest.fn(),
}))

jest.mock('uniswap/src/contexts/UrlContext', () => ({
  ...jest.requireActual('uniswap/src/contexts/UrlContext'),
  useUrlContext: jest.fn(),
}))

describe('hooks', () => {
  beforeEach(() => {
    mocked(useEnabledChains).mockReturnValue({
      isTestnetModeEnabled: false,
      defaultChainId: UniverseChainId.Mainnet,
      chains: [UniverseChainId.Mainnet],
      gqlChains: GQL_MAINNET_CHAINS,
    })

    mocked(useUrlContext).mockReturnValue({
      useParsedQueryString: jest.fn(),
      usePathname: jest.fn(),
    })
  })

  describe('#queryParametersToCurrencyState', () => {
    test('ETH to DAI on mainnet', () => {
      expect(
        queryParametersToCurrencyState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6b175474e89094c44da98b954eedeac495271d0f&exactAmount=20.5&exactField=output',
            { parseArrays: false, ignoreQueryPrefix: true },
          ),
        ),
      ).toEqual({
        outputCurrencyId: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        inputCurrencyId: 'ETH',
      })
    })

    test('ETH to UNI on optimism', () => {
      expect(
        queryParametersToCurrencyState(
          parse(
            '?inputCurrency=ETH&outputCurrency=0x6fd9d7ad17242c41f7131d257212c54a0e816691&exactAmount=20.5&exactField=output&chain=optimism',
            { parseArrays: false, ignoreQueryPrefix: true },
          ),
        ),
      ).toEqual({
        outputCurrencyId: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
        inputCurrencyId: 'ETH',
        chainId: 10,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyId: undefined,
        outputCurrencyId: undefined,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=eth&value=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: undefined,
        value: '20.5',
        field: undefined,
        chainId: undefined,
      })
    })

    test('output ETH only, lowercase', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputcurrency=eth&value=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyId: 'ETH',
        inputCurrencyId: undefined,
        value: '20.5',
        field: undefined,
        chainId: undefined,
      })
    })
  })

  describe('#useInitialCurrencyState', () => {
    beforeEach(() => {
      return mocked(useUniswapContext).mockReturnValue({
        swapInputChainId: undefined,
        navigateToSwapFlow: () => {},
        navigateToFiatOnRamp: () => {},
        onSwapChainsChanged: () => {},
        signer: undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        useProviderHook: (_chainId: number) => undefined,
        isSwapTokenSelectorOpen: false,
        setIsSwapTokenSelectorOpen: () => {},
        setSwapOutputChainId: () => {},
      })
    })
  })
})
