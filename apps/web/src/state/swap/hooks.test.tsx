import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { parse } from 'qs'
import {
  queryParametersToCurrencyState,
  serializeSwapAddressesToURLParameters,
  serializeSwapStateToURLParameters,
  useInitialCurrencyState,
} from 'state/swap/hooks'
import { ETH_MAINNET, ETH_SEPOLIA } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { renderHook, waitFor } from 'test-utils/render'
import { UNI, USDC_OPTIMISM, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { GQL_MAINNET_CHAINS, GQL_TESTNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

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
      chains: [UniverseChainId.Mainnet, UniverseChainId.Optimism],
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

  describe('URL parameter serialization', () => {
    test('serializeSwapStateToURLParameters handles cross-chain swaps', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: nativeOnChain(UniverseChainId.Mainnet),
        outputCurrency: nativeOnChain(UniverseChainId.Optimism),
        typedValue: '1.0',
        independentField: CurrencyField.INPUT,
      })

      expect(result).toBe(
        `?chain=mainnet&outputChain=optimism&inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${NATIVE_CHAIN_ID}&value=1.0&field=${CurrencyField.INPUT}`,
      )
    })

    test('serializeSwapStateToURLParameters handles token to token swaps on same chain', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
        outputCurrency: ETH_MAINNET,
        typedValue: '100',
        independentField: CurrencyField.OUTPUT,
      })

      expect(result).toBe(
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${ETH_MAINNET.isNative ? NATIVE_CHAIN_ID : ETH_MAINNET.address}&value=100&field=${CurrencyField.OUTPUT}`,
      )
    })

    test('serializeSwapStateToURLParameters omits value and field when no valid input', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
        typedValue: '',
        independentField: CurrencyField.INPUT,
      })

      expect(result).toBe(`?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapAddressesToURLParameters handles cross-chain swaps', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
        inputTokenAddress: NATIVE_CHAIN_ID,
        outputTokenAddress: NATIVE_CHAIN_ID,
      })

      expect(result).toBe(
        `?chain=mainnet&outputChain=optimism&inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${NATIVE_CHAIN_ID}`,
      )
    })

    test('serializeSwapAddressesToURLParameters handles token to token on same chain', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
        outputTokenAddress: ETH_MAINNET.isNative ? NATIVE_CHAIN_ID : ETH_MAINNET.address,
      })

      expect(result).toBe(
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${ETH_MAINNET.isNative ? NATIVE_CHAIN_ID : ETH_MAINNET.address}`,
      )
    })

    test('serializeSwapAddressesToURLParameters defaults to mainnet when no chainId provided', () => {
      const result = serializeSwapAddressesToURLParameters({
        inputTokenAddress: NATIVE_CHAIN_ID,
        outputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?inputCurrency=${NATIVE_CHAIN_ID}&outputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapAddressesToURLParameters handles undefined input token', () => {
      const result = serializeSwapAddressesToURLParameters({
        chainId: UniverseChainId.Mainnet,
        outputTokenAddress: UNI_ADDRESSES[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?chain=mainnet&outputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })

    test('serializeSwapStateToURLParameters handles partial state', () => {
      const result = serializeSwapStateToURLParameters({
        chainId: UniverseChainId.Mainnet,
        inputCurrency: UNI[UniverseChainId.Mainnet],
      })

      expect(result).toBe(`?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}`)
    })
  })

  describe('#useInitialCurrencyState', () => {
    beforeEach(() => {
      return mocked(useUniswapContext).mockReturnValue({
        swapInputChainId: undefined,
        navigateToSwapFlow: () => {},
        navigateToFiatOnRamp: () => {},
        navigateToTokenDetails: () => {},
        navigateToExternalProfile: () => {},
        navigateToNftCollection: () => {},
        navigateToSendFlow: () => {},
        navigateToReceive: () => {},
        handleShareToken: () => {},
        onSwapChainsChanged: () => {},
        signer: undefined,
        useProviderHook: (_chainId: number) => undefined,
        isSwapTokenSelectorOpen: false,
        setIsSwapTokenSelectorOpen: () => {},
        setSwapOutputChainId: () => {},
      })
    })

    describe('Disconnected wallet', () => {
      test('optimism output UNI', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency).toEqual(undefined)
          expect(initialOutputCurrency?.symbol).toEqual('USDC')
          expect(initialChainId).toEqual(10)
        })
      })

      test('optimism input ETH, output USDC', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency?.symbol).toEqual('USDC')
          expect(initialChainId).toEqual(10)
        })
      })

      test('optimism input ETH, output USDC, input value, field output', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
            value: '200',
            field: 'OUTPUT',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialTypedValue, initialField, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency?.isNative).toEqual(true)
        expect(initialOutputCurrency?.symbol).toEqual('USDC')
        expect(initialTypedValue).toEqual('200')
        expect(initialField).toEqual('output')
        expect(initialChainId).toEqual(10)
      })

      test('empty query should default to ETH mainnet', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            chain: 'mainnet',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        waitFor(() => {
          expect(initialInputCurrency?.isNative).toEqual(true)
          expect(initialOutputCurrency).not.toBeDefined()
          expect(initialChainId).toEqual(1)
        })
      })
    })

    describe('Connected wallet with balance', () => {
      jest.mock('graphql/data/apollo/TokenBalancesProvider', () => ({
        useTokenBalancesQuery: () => ({
          data: {
            portfolios: [
              {
                tokenBalances: [
                  {
                    token: nativeOnChain(UniverseChainId.Polygon),
                    denominatedValue: {
                      value: 1000,
                    },
                  },
                  {
                    token: ETH_MAINNET,
                    denominatedValue: {
                      value: 800,
                    },
                  },
                  {
                    token: UNI[UniverseChainId.Optimism],
                    denominatedValue: {
                      value: 500,
                    },
                  },
                ],
              },
            ],
          },
        }),
      }))

      test('input mainnet ETH, testnet mode disabled', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            chain: 'mainnet',
          }),
          usePathname: jest.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: false,
          defaultChainId: UniverseChainId.Mainnet,
          chains: [UniverseChainId.Mainnet],
          gqlChains: GQL_MAINNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency).toEqual(ETH_MAINNET)
        expect(initialChainId).toEqual(UniverseChainId.Mainnet)
      })

      test('input mainnet ETH, testnet mode enabled', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            chain: 'sepolia',
          }),
          usePathname: jest.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: true,
          defaultChainId: UniverseChainId.Sepolia,
          chains: [UniverseChainId.Sepolia],
          gqlChains: GQL_TESTNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency).toEqual(ETH_SEPOLIA)
        expect(initialOutputCurrency).not.toBeDefined()
        expect(initialChainId).toEqual(UniverseChainId.Sepolia)
      })

      test('input sepolia ETH, testnet mode enabled', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            chain: 'sepolia',
          }),
          usePathname: jest.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: true,
          defaultChainId: UniverseChainId.Sepolia,
          chains: [UniverseChainId.Sepolia],
          gqlChains: GQL_TESTNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency).toEqual(ETH_SEPOLIA)
        expect(initialChainId).toEqual(UniverseChainId.Sepolia)
      })

      test('optimism output USDC', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency).toEqual(undefined)
        expect(initialOutputCurrency?.symbol).toEqual('USDC')
        expect(initialChainId).toEqual(10)
      })

      test('mainnet', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            chain: 'mainnet',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency?.isNative).toEqual(true)
        expect(initialOutputCurrency).not.toBeDefined()
        expect(initialChainId).toEqual(1)
      })

      test('optimism input ETH, output USDC', () => {
        // Mock the useParsedQueryString to return the query parameters we want
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            inputCurrency: 'ETH',
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
          }),
          usePathname: jest.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency?.isNative).toEqual(true)
        expect(initialOutputCurrency?.symbol).toEqual('USDC')
        expect(initialChainId).toEqual(10)
      })
    })
  })
})
