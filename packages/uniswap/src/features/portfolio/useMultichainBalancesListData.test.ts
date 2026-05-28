import { renderHook } from '@testing-library/react'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import { createPortfolioMultichainBalance } from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMultichainBalancesListData } from './useMultichainBalancesListData'

const platformState = vi.hoisted(() => ({ isExtensionApp: false }))
const buildExtensionMultichainBalancesListDataMock = vi.hoisted(() => vi.fn())

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isExtensionApp() {
      return platformState.isExtensionApp
    },
  }
})

vi.mock('uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData', () => ({
  buildExtensionMultichainBalancesListData: buildExtensionMultichainBalancesListDataMock,
}))

function makeSortedData(overrides: Partial<SortedPortfolioBalancesMultichain> = {}): SortedPortfolioBalancesMultichain {
  return {
    balances: [],
    hiddenBalances: [],
    ...overrides,
  }
}

const defaultArgs = {
  isTestnetModeEnabled: false,
  currencyIdToTokenVisibility: {} as const,
}

describe(useMultichainBalancesListData, () => {
  beforeEach(() => {
    platformState.isExtensionApp = false
    buildExtensionMultichainBalancesListDataMock.mockReset()
  })

  it('passes through inputs when not extension', () => {
    const sortedData = makeSortedData({
      hiddenBalances: [createPortfolioMultichainBalance({ id: 'h1' }), createPortfolioMultichainBalance({ id: 'h2' })],
    })
    const b = createPortfolioMultichainBalance({ id: 'a' })
    const balancesById = { [b.id]: b }

    const { result } = renderHook(() =>
      useMultichainBalancesListData({
        sortedData,
        balancesById,
        ...defaultArgs,
      }),
    )

    expect(result.current.sortedDataForList).toBe(sortedData)
    expect(result.current.balancesByIdForList).toBe(balancesById)
    expect(result.current.hiddenTokensCount).toBe(2)
    expect(buildExtensionMultichainBalancesListDataMock).not.toHaveBeenCalled()
  })

  it('returns hiddenTokensCount 0 when sortedData is undefined', () => {
    const { result } = renderHook(() =>
      useMultichainBalancesListData({
        sortedData: undefined,
        balancesById: undefined,
        ...defaultArgs,
      }),
    )

    expect(result.current.sortedDataForList).toBeUndefined()
    expect(result.current.balancesByIdForList).toBeUndefined()
    expect(result.current.hiddenTokensCount).toBe(0)
    expect(buildExtensionMultichainBalancesListDataMock).not.toHaveBeenCalled()
  })

  describe('when extension', () => {
    beforeEach(() => {
      platformState.isExtensionApp = true
    })

    it('passes through when sortedData is missing', () => {
      const balancesById = { x: createPortfolioMultichainBalance({ id: 'x' }) }

      const { result } = renderHook(() =>
        useMultichainBalancesListData({
          sortedData: undefined,
          balancesById,
          ...defaultArgs,
        }),
      )

      expect(result.current.sortedDataForList).toBeUndefined()
      expect(result.current.balancesByIdForList).toBe(balancesById)
      expect(result.current.hiddenTokensCount).toBe(0)
      expect(buildExtensionMultichainBalancesListDataMock).not.toHaveBeenCalled()
    })

    it('passes through when balancesById is missing', () => {
      const sortedData = makeSortedData({ hiddenBalances: [createPortfolioMultichainBalance()] })

      const { result } = renderHook(() =>
        useMultichainBalancesListData({
          sortedData,
          balancesById: undefined,
          ...defaultArgs,
        }),
      )

      expect(result.current.sortedDataForList).toBe(sortedData)
      expect(result.current.balancesByIdForList).toBeUndefined()
      expect(result.current.hiddenTokensCount).toBe(1)
      expect(buildExtensionMultichainBalancesListDataMock).not.toHaveBeenCalled()
    })

    it('calls builder and maps its return shape when both inputs are defined', () => {
      const sortedData = makeSortedData({ balances: [createPortfolioMultichainBalance({ id: 'p' })] })
      const balancesById = { p: sortedData.balances[0]! }
      const built = {
        sortedDataForUi: makeSortedData({ balances: [] }),
        listBalancesById: { q: createPortfolioMultichainBalance({ id: 'q' }) },
        hiddenTokensCount: 7,
      }
      buildExtensionMultichainBalancesListDataMock.mockReturnValue(built)

      const currencyIdToTokenVisibility = { ['1-0xabc' as CurrencyId]: { isVisible: true } }

      const { result } = renderHook(() =>
        useMultichainBalancesListData({
          sortedData,
          balancesById,
          isTestnetModeEnabled: true,
          currencyIdToTokenVisibility,
        }),
      )

      expect(buildExtensionMultichainBalancesListDataMock).toHaveBeenCalledTimes(1)
      expect(buildExtensionMultichainBalancesListDataMock).toHaveBeenCalledWith({
        sortedBalances: sortedData,
        balancesById,
        isTestnetModeEnabled: true,
        currencyIdToTokenVisibility,
      })
      expect(result.current.sortedDataForList).toBe(built.sortedDataForUi)
      expect(result.current.balancesByIdForList).toBe(built.listBalancesById)
      expect(result.current.hiddenTokensCount).toBe(7)
    })
  })
})
