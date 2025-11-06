import { UNI_ADDRESSES } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { parse } from 'qs'
import { ReactNode } from 'react'
import {
  queryParametersToCurrencyState,
  serializeSwapAddressesToURLParameters,
  serializeSwapStateToURLParameters,
  useInitialCurrencyState,
} from 'state/swap/hooks'
import { ETH_MAINNET, ETH_SEPOLIA } from 'test-utils/constants'
import { mocked } from 'test-utils/mocked'
import { renderHook, waitFor } from 'test-utils/render'
import { DAI, nativeOnChain, UNI, USDC_OPTIMISM } from 'uniswap/src/constants/tokens'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { GQL_MAINNET_CHAINS, GQL_TESTNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyField } from 'uniswap/src/types/currency'

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useFeatureFlag: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})

vi.mock('uniswap/src/contexts/UniswapContext')

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', async () => {
  const actual = await vi.importActual('uniswap/src/features/chains/hooks/useEnabledChains')
  return {
    ...actual,
    useEnabledChains: vi.fn(),
  }
})

vi.mock('uniswap/src/contexts/UrlContext', async () => {
  const actual = await vi.importActual('uniswap/src/contexts/UrlContext')
  return {
    ...actual,
    useUrlContext: vi.fn(),
  }
})

describe('hooks', () => {
  beforeEach(() => {
    mocked(useEnabledChains).mockReturnValue({
      isTestnetModeEnabled: false,
      defaultChainId: UniverseChainId.Mainnet,
      chains: [UniverseChainId.Mainnet, UniverseChainId.Optimism],
      gqlChains: GQL_MAINNET_CHAINS,
    })

    mocked(useUrlContext).mockReturnValue({
      useParsedQueryString: vi.fn(),
      usePathname: vi.fn(),
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
        outputCurrencyAddress: DAI.address,
        inputCurrencyAddress: 'ETH',
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
        outputCurrencyAddress: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
        inputCurrencyAddress: 'ETH',
        chainId: 10,
      })
    })

    test('does not duplicate eth for invalid output token', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=invalid', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
      })
    })

    test('output ETH only', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?outputCurrency=eth&value=20.5', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        outputCurrencyAddress: 'ETH',
        inputCurrencyAddress: undefined,
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
        outputCurrencyAddress: 'ETH',
        inputCurrencyAddress: undefined,
        value: '20.5',
        field: undefined,
        chainId: undefined,
      })
    })

    test('no query parameters', () => {
      expect(queryParametersToCurrencyState(parse('', { parseArrays: false, ignoreQueryPrefix: true }))).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: undefined,
      })
    })

    test('only chain parameter, no currencies', () => {
      expect(
        queryParametersToCurrencyState(parse('?chain=optimism', { parseArrays: false, ignoreQueryPrefix: true })),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Optimism,
        outputChainId: undefined,
      })
    })

    test('only outputChain parameter, no currencies', () => {
      expect(
        queryParametersToCurrencyState(parse('?outputChain=base', { parseArrays: false, ignoreQueryPrefix: true })),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: UniverseChainId.Base,
      })
    })

    test('both chain and outputChain parameters, no currencies', () => {
      expect(
        queryParametersToCurrencyState(
          parse('?chain=mainnet&outputChain=optimism', { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: undefined,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
      })
    })

    test('outputChain parameter with output currency', () => {
      expect(
        queryParametersToCurrencyState(
          parse(`?outputChain=base&outputCurrency=${DAI.address}`, { parseArrays: false, ignoreQueryPrefix: true }),
        ),
      ).toEqual({
        inputCurrencyAddress: undefined,
        outputCurrencyAddress: DAI.address,
        value: undefined,
        field: undefined,
        chainId: undefined,
        outputChainId: UniverseChainId.Base,
      })
    })

    test('both chain and outputChain with input and output currencies', () => {
      expect(
        queryParametersToCurrencyState(
          parse(`?chain=mainnet&outputChain=optimism&inputCurrency=ETH&outputCurrency=${USDC_OPTIMISM.address}`, {
            parseArrays: false,
            ignoreQueryPrefix: true,
          }),
        ),
      ).toEqual({
        inputCurrencyAddress: 'ETH',
        outputCurrencyAddress: USDC_OPTIMISM.address,
        value: undefined,
        field: undefined,
        chainId: UniverseChainId.Mainnet,
        outputChainId: UniverseChainId.Optimism,
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
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${NATIVE_CHAIN_ID}&value=100&field=${CurrencyField.OUTPUT}`,
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
        outputTokenAddress: NATIVE_CHAIN_ID,
      })

      expect(result).toBe(
        `?chain=mainnet&inputCurrency=${UNI_ADDRESSES[UniverseChainId.Mainnet]}&outputCurrency=${NATIVE_CHAIN_ID}`,
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
        navigateToPoolDetails: () => {},
        navigateToNftDetails: () => {},
        navigateToNftCollection: () => {},
        navigateToSendFlow: () => {},
        navigateToReceive: () => {},
        handleShareToken: () => {},
        onSwapChainsChanged: () => {},
        signer: undefined,
        useProviderHook: (_chainId: number) => undefined,
        useWalletDisplayName: () => undefined,
        isSwapTokenSelectorOpen: false,
        setIsSwapTokenSelectorOpen: () => {},
        setSwapOutputChainId: () => {},
        useAccountsStoreContextHook: () => ({}) as AccountsStore,
      })
    })

    describe('Disconnected wallet', () => {
      test('optimism output UNI', () => {
        mocked(useUrlContext).mockReturnValue({
          useParsedQueryString: () => ({
            outputCurrency: USDC_OPTIMISM.address,
            chain: 'optimism',
          }),
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: {
              initialInputCurrency,
              initialOutputCurrency,
              initialTypedValue,
              initialField,
              initialInputChainId: initialChainId,
            },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
      vi.mock('appGraphql/data/apollo/TokenBalancesProvider', () => ({
        TokenBalancesProvider: ({ children }: { children: ReactNode }) => children,
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
          usePathname: vi.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: false,
          defaultChainId: UniverseChainId.Mainnet,
          chains: [UniverseChainId.Mainnet],
          gqlChains: GQL_MAINNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: true,
          defaultChainId: UniverseChainId.Sepolia,
          chains: [UniverseChainId.Sepolia],
          gqlChains: GQL_TESTNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        mocked(useEnabledChains).mockReturnValue({
          isTestnetModeEnabled: true,
          defaultChainId: UniverseChainId.Sepolia,
          chains: [UniverseChainId.Sepolia],
          gqlChains: GQL_TESTNET_CHAINS,
        })

        const {
          result: {
            current: { initialInputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
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
          usePathname: vi.fn(),
        })

        const {
          result: {
            current: { initialInputCurrency, initialOutputCurrency, initialInputChainId: initialChainId },
          },
        } = renderHook(() => useInitialCurrencyState())

        expect(initialInputCurrency?.isNative).toEqual(true)
        expect(initialOutputCurrency?.symbol).toEqual('USDC')
        expect(initialChainId).toEqual(10)
      })
    })
  })
})
