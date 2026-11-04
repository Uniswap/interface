import { UniverseChainId } from '@universe/chains'
import { UNI, USDC_OPTIMISM } from 'uniswap/src/constants/tokens'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useInitialCurrencyState } from '~/pages/Swap/Swap/state/hooks'
import { ETH_MAINNET, ETH_SEPOLIA } from '~/test-utils/constants'
import { mocked } from '~/test-utils/mocked'
import { renderHook, waitFor } from '~/test-utils/render'

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
    })

    mocked(useUrlContext).mockReturnValue({
      useParsedQueryString: vi.fn(),
      usePathname: vi.fn(),
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
        navigateToSendFlow: () => {},
        navigateToReceive: () => {},
        handleShareToken: () => {},
        navigateToAdvancedSettings: () => {},
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
