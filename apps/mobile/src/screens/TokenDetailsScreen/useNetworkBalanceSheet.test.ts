import { act, renderHook } from '@testing-library/react'
import { useNetworkBalanceSheet } from 'src/screens/TokenDetailsScreen/useNetworkBalanceSheet'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyField } from 'uniswap/src/types/currency'

const mockNavigateToSwapFlow = jest.fn()
const mockNavigateToSend = jest.fn()

jest.mock('wallet/src/contexts/WalletNavigationContext', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useWalletNavigation: () => ({
    navigateToSwapFlow: mockNavigateToSwapFlow,
    navigateToSend: mockNavigateToSend,
  }),
}))

jest.mock('wallet/src/features/wallet/hooks', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useActiveAccountAddressWithThrow: () => '0xTestAddress',
}))

const mockCurrentChainBalance: PortfolioBalance = {
  id: 'balance-mainnet',
  cacheId: 'cache-mainnet',
  quantity: 100,
  balanceUSD: 100,
  relativeChange24: 0,
  isHidden: false,
  currencyInfo: {
    currencyId: `${UniverseChainId.Mainnet}-0xtoken`,
    currency: {
      chainId: UniverseChainId.Mainnet,
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isNative: false,
      isToken: true,
    },
    logoUrl: null,
    safetyLevel: null,
    safetyInfo: null,
    isSpam: false,
  },
} as unknown as PortfolioBalance

const mockOtherChainBalance: PortfolioBalance = {
  id: 'balance-base',
  cacheId: 'cache-base',
  quantity: 50,
  balanceUSD: 50,
  relativeChange24: 0,
  isHidden: false,
  currencyInfo: {
    currencyId: `${UniverseChainId.Base}-0xtoken`,
    currency: {
      chainId: UniverseChainId.Base,
      address: '0xBaseTokenAddress',
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      isNative: false,
      isToken: true,
    },
    logoUrl: null,
    safetyLevel: null,
    safetyInfo: null,
    isSpam: false,
  },
} as unknown as PortfolioBalance

let mockCrossChainResult = {
  currentChainBalance: null as PortfolioBalance | null,
  otherChainBalances: null as PortfolioBalance[] | null,
}

jest.mock('uniswap/src/data/balances/hooks/useCrossChainBalances', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useCrossChainBalances: () => mockCrossChainResult,
}))

jest.mock('uniswap/src/data/graphql/uniswap-data-api/fragments', () => ({
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  useTokenBasicProjectPartsFragment: () => ({
    data: { project: { tokens: [] } },
  }),
}))

const defaultArgs = {
  currencyId: `${UniverseChainId.Mainnet}-0xtoken`,
  chainId: UniverseChainId.Mainnet,
}

describe(useNetworkBalanceSheet, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCrossChainResult = {
      currentChainBalance: null,
      otherChainBalances: null,
    }
  })

  describe('allChainBalances', () => {
    it('returns empty array when no balances exist', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.allChainBalances).toEqual([])
    })

    it('returns current chain balance when only one chain has balance', () => {
      mockCrossChainResult = {
        currentChainBalance: mockCurrentChainBalance,
        otherChainBalances: null,
      }
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.allChainBalances).toEqual([mockCurrentChainBalance])
    })

    it('combines current and other chain balances', () => {
      mockCrossChainResult = {
        currentChainBalance: mockCurrentChainBalance,
        otherChainBalances: [mockOtherChainBalance],
      }
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.allChainBalances).toEqual([mockCurrentChainBalance, mockOtherChainBalance])
    })
  })

  describe('hasMultiChainBalances', () => {
    it('returns false when only one chain balance exists', () => {
      mockCrossChainResult = {
        currentChainBalance: mockCurrentChainBalance,
        otherChainBalances: null,
      }
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.hasMultiChainBalances).toBe(false)
    })

    it('returns true when multiple chain balances exist', () => {
      mockCrossChainResult = {
        currentChainBalance: mockCurrentChainBalance,
        otherChainBalances: [mockOtherChainBalance],
      }
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.hasMultiChainBalances).toBe(true)
    })
  })

  describe('sheet state', () => {
    it('starts with sheet closed', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      expect(result.current.isNetworkSheetOpen).toBe(false)
    })

    it('opens sheet when openSellSheet is called', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      act(() => result.current.openSellSheet())
      expect(result.current.isNetworkSheetOpen).toBe(true)
    })

    it('opens sheet when openSendSheet is called', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      act(() => result.current.openSendSheet())
      expect(result.current.isNetworkSheetOpen).toBe(true)
    })

    it('closes sheet when onCloseNetworkSheet is called', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))
      act(() => result.current.openSellSheet())
      expect(result.current.isNetworkSheetOpen).toBe(true)
      act(() => result.current.onCloseNetworkSheet())
      expect(result.current.isNetworkSheetOpen).toBe(false)
    })
  })

  describe('onSelectNetwork', () => {
    it('navigates to send when sheet was opened via openSendSheet', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))

      act(() => result.current.openSendSheet())
      act(() => result.current.onSelectNetwork(mockOtherChainBalance))

      expect(mockNavigateToSend).toHaveBeenCalledWith({
        currencyAddress: '0xBaseTokenAddress',
        chainId: UniverseChainId.Base,
      })
      expect(mockNavigateToSwapFlow).not.toHaveBeenCalled()
    })

    it('navigates to swap flow when sheet was opened via openSellSheet', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))

      act(() => result.current.openSellSheet())
      act(() => result.current.onSelectNetwork(mockOtherChainBalance))

      expect(mockNavigateToSwapFlow).toHaveBeenCalledWith({
        currencyField: CurrencyField.INPUT,
        currencyAddress: '0xBaseTokenAddress',
        currencyChainId: UniverseChainId.Base,
      })
      expect(mockNavigateToSend).not.toHaveBeenCalled()
    })

    it('closes the sheet after selection', () => {
      const { result } = renderHook(() => useNetworkBalanceSheet(defaultArgs))

      act(() => result.current.openSellSheet())
      expect(result.current.isNetworkSheetOpen).toBe(true)

      act(() => result.current.onSelectNetwork(mockOtherChainBalance))
      expect(result.current.isNetworkSheetOpen).toBe(false)
    })
  })
})
