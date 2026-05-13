import { act, renderHook } from '@testing-library/react'
import type { PortfolioChainBalance } from 'uniswap/src/features/dataApi/types'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import { HIDDEN_TOKEN_BALANCES_ROW } from 'uniswap/src/features/portfolio/types'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTokenBalanceListMultichainExpansion } from './useTokenBalanceListMultichainExpansion'

const CHAIN_ID_MAINNET = 1
const CHAIN_ID_ARBITRUM = 42161

/** Distinct dummy token addresses (hex pattern mnemonics). */
const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const ADDR_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const currencyIdOnChain = (chainId: number, address: string): string => `${chainId}-${address}`

const platformState = vi.hoisted(() => ({ isExtensionApp: false }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isExtensionApp() {
      return platformState.isExtensionApp
    },
  }
})

function makeSortedData(overrides: Partial<SortedPortfolioBalancesMultichain> = {}): SortedPortfolioBalancesMultichain {
  return {
    balances: [],
    hiddenBalances: [],
    ...overrides,
  }
}

describe(useTokenBalanceListMultichainExpansion, () => {
  beforeEach(() => {
    platformState.isExtensionApp = false
  })

  it('returns empty rows when sortedData is undefined', () => {
    const { result } = renderHook(() =>
      useTokenBalanceListMultichainExpansion({ sortedData: undefined, hiddenTokensExpanded: false }),
    )
    expect(result.current.rows).toEqual([])
    expect(result.current.expandedCurrencyIds.size).toBe(0)
    expect(result.current.multichainRowExpansionEnabled).toBe(false)
  })

  it('lists parent balance ids only for single-chain balances', () => {
    const b = createPortfolioMultichainBalance({ id: 'single-asset' })
    const sortedData = makeSortedData({ balances: [b] })
    const { result } = renderHook(() =>
      useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
    )
    expect(result.current.rows).toEqual(['single-asset'])
  })

  it('appends hidden section row when there are hidden balances', () => {
    const hidden = createPortfolioMultichainBalance({ id: 'hidden-1' })
    const sortedData = makeSortedData({
      balances: [],
      hiddenBalances: [hidden],
    })
    const { result } = renderHook(() =>
      useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
    )
    expect(result.current.rows).toEqual([HIDDEN_TOKEN_BALANCES_ROW])
  })

  it('includes hidden balance rows after the hidden section row when hiddenTokensExpanded is true', () => {
    const hidden = createPortfolioMultichainBalance({ id: 'hidden-1' })
    const sortedData = makeSortedData({
      balances: [],
      hiddenBalances: [hidden],
    })
    const { result } = renderHook(() =>
      useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: true }),
    )
    expect(result.current.rows).toEqual([HIDDEN_TOKEN_BALANCES_ROW, 'hidden-1'])
  })

  describe('when multichain row expansion is enabled (extension)', () => {
    beforeEach(() => {
      platformState.isExtensionApp = true
    })

    it('reports multichainRowExpansionEnabled true', () => {
      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({
          sortedData: makeSortedData(),
          hiddenTokensExpanded: false,
        }),
      )
      expect(result.current.multichainRowExpansionEnabled).toBe(true)
    })

    it('does not insert per-chain rows until the parent is expanded', () => {
      const tHigh = createPortfolioChainBalance({
        chainId: CHAIN_ID_MAINNET,
        valueUsd: 200,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_MAINNET, ADDR_A),
          currency: {
            chainId: CHAIN_ID_MAINNET,
            address: ADDR_A,
            isToken: true,
            symbol: 'A',
            name: 'A',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const tLow = createPortfolioChainBalance({
        chainId: CHAIN_ID_ARBITRUM,
        valueUsd: 50,
        address: ADDR_B,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_ARBITRUM, ADDR_B),
          currency: {
            chainId: CHAIN_ID_ARBITRUM,
            address: ADDR_B,
            isToken: true,
            symbol: 'B',
            name: 'B',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const mc = createPortfolioMultichainBalance({
        id: 'mc-parent',
        tokens: [tLow, tHigh],
      })
      const sortedData = makeSortedData({ balances: [mc] })

      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      expect(result.current.rows).toEqual(['mc-parent'])
    })

    it('keeps rows flat after toggleExpanded while expandedCurrencyIds updates', () => {
      const tHigh = createPortfolioChainBalance({
        chainId: CHAIN_ID_MAINNET,
        valueUsd: 200,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_MAINNET, ADDR_A),
          currency: {
            chainId: CHAIN_ID_MAINNET,
            address: ADDR_A,
            isToken: true,
            symbol: 'A',
            name: 'A',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const tLow = createPortfolioChainBalance({
        chainId: CHAIN_ID_ARBITRUM,
        valueUsd: 50,
        address: ADDR_B,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_ARBITRUM, ADDR_B),
          currency: {
            chainId: CHAIN_ID_ARBITRUM,
            address: ADDR_B,
            isToken: true,
            symbol: 'B',
            name: 'B',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const parentId = 'mc-parent' as CurrencyId
      const mc = createPortfolioMultichainBalance({
        id: parentId,
        tokens: [tLow, tHigh],
      })
      const sortedData = makeSortedData({ balances: [mc] })

      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      act(() => {
        result.current.toggleExpanded(parentId)
      })

      expect(result.current.expandedCurrencyIds.has(parentId)).toBe(true)
      expect(result.current.rows).toEqual([parentId])

      act(() => {
        result.current.toggleExpanded(parentId)
      })

      expect(result.current.expandedCurrencyIds.has(parentId)).toBe(false)
      expect(result.current.rows).toEqual([parentId])
    })

    it('expands only one multichain parent at a time (accordion)', () => {
      const ADDR_C = '0xcccccccccccccccccccccccccccccccccccccccc'
      const ADDR_D = '0xdddddddddddddddddddddddddddddddddddddddd'
      const parentA = 'mc-parent-a' as CurrencyId
      const parentB = 'mc-parent-b' as CurrencyId

      const makeTwoChainTokens = (mainAddr: string, arbAddr: string): PortfolioChainBalance[] => [
        createPortfolioChainBalance({
          chainId: CHAIN_ID_MAINNET,
          valueUsd: 100,
          currencyInfo: {
            currencyId: currencyIdOnChain(CHAIN_ID_MAINNET, mainAddr),
            currency: {
              chainId: CHAIN_ID_MAINNET,
              address: mainAddr,
              isToken: true,
              symbol: 'A',
              name: 'A',
              isNative: false,
            } as PortfolioChainBalance['currencyInfo']['currency'],
            logoUrl: undefined,
          },
        }),
        createPortfolioChainBalance({
          chainId: CHAIN_ID_ARBITRUM,
          valueUsd: 50,
          address: arbAddr,
          currencyInfo: {
            currencyId: currencyIdOnChain(CHAIN_ID_ARBITRUM, arbAddr),
            currency: {
              chainId: CHAIN_ID_ARBITRUM,
              address: arbAddr,
              isToken: true,
              symbol: 'B',
              name: 'B',
              isNative: false,
            } as PortfolioChainBalance['currencyInfo']['currency'],
            logoUrl: undefined,
          },
        }),
      ]

      const mcA = createPortfolioMultichainBalance({
        id: parentA,
        tokens: makeTwoChainTokens(ADDR_A, ADDR_B),
      })
      const mcB = createPortfolioMultichainBalance({
        id: parentB,
        tokens: makeTwoChainTokens(ADDR_C, ADDR_D),
      })
      const sortedData = makeSortedData({ balances: [mcA, mcB] })

      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      act(() => {
        result.current.toggleExpanded(parentA)
      })
      expect(result.current.expandedCurrencyIds.has(parentA)).toBe(true)
      expect(result.current.expandedCurrencyIds.has(parentB)).toBe(false)
      expect(result.current.expandedCurrencyIds.size).toBe(1)

      act(() => {
        result.current.toggleExpanded(parentB)
      })
      expect(result.current.expandedCurrencyIds.has(parentA)).toBe(false)
      expect(result.current.expandedCurrencyIds.has(parentB)).toBe(true)
      expect(result.current.expandedCurrencyIds.size).toBe(1)
    })

    it('does not add per-chain rows for multichain balances with only one token even when expanded', () => {
      const b = createPortfolioMultichainBalance({ id: 'one-chain' })
      const sortedData = makeSortedData({ balances: [b] })
      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      act(() => {
        result.current.toggleExpanded('one-chain')
      })

      expect(result.current.rows).toEqual(['one-chain'])
    })

    it('tracks expanded state for multichain parent with two tokens on the same chain', () => {
      const tBridged = createPortfolioChainBalance({
        chainId: CHAIN_ID_MAINNET,
        valueUsd: 100,
        address: ADDR_A,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_MAINNET, ADDR_A),
          currency: {
            chainId: CHAIN_ID_MAINNET,
            address: ADDR_A,
            isToken: true,
            symbol: 'A',
            name: 'A',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const tNative = createPortfolioChainBalance({
        chainId: CHAIN_ID_MAINNET,
        valueUsd: 200,
        address: ADDR_B,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_MAINNET, ADDR_B),
          currency: {
            chainId: CHAIN_ID_MAINNET,
            address: ADDR_B,
            isToken: true,
            symbol: 'B',
            name: 'B',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const parentId = 'mc-same-chain' as CurrencyId
      const mc = createPortfolioMultichainBalance({ id: parentId, tokens: [tBridged, tNative] })
      const sortedData = makeSortedData({ balances: [mc] })

      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      act(() => {
        result.current.toggleExpanded(parentId)
      })

      expect(result.current.expandedCurrencyIds.has(parentId)).toBe(true)
      expect(result.current.rows).toEqual([parentId])
    })
  })

  describe('when multichain row expansion is disabled (non-extension)', () => {
    it('toggleExpanded does not expand currency ids or add chain rows', () => {
      platformState.isExtensionApp = false
      const t1 = createPortfolioChainBalance({ chainId: CHAIN_ID_MAINNET, valueUsd: 100 })
      const t2 = createPortfolioChainBalance({
        chainId: CHAIN_ID_ARBITRUM,
        valueUsd: 10,
        address: ADDR_B,
        currencyInfo: {
          currencyId: currencyIdOnChain(CHAIN_ID_ARBITRUM, ADDR_B),
          currency: {
            chainId: CHAIN_ID_ARBITRUM,
            address: ADDR_B,
            isToken: true,
            symbol: 'B',
            name: 'B',
            isNative: false,
          } as PortfolioChainBalance['currencyInfo']['currency'],
          logoUrl: undefined,
        },
      })
      const mc = createPortfolioMultichainBalance({ id: 'mc-parent', tokens: [t1, t2] })
      const sortedData = makeSortedData({ balances: [mc] })

      const { result } = renderHook(() =>
        useTokenBalanceListMultichainExpansion({ sortedData, hiddenTokensExpanded: false }),
      )

      act(() => {
        result.current.toggleExpanded('mc-parent')
      })

      expect(result.current.expandedCurrencyIds.size).toBe(0)
      expect(result.current.rows).toEqual(['mc-parent'])
    })
  })
})
