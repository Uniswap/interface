import type { PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import {
  buildVisibleSubsetMultichainBalance,
  flattenPortfolioMultichainBalanceToSingleChainRows,
  buildExtensionMultichainBalancesListData,
  partitionMultichainBalancesByPerChainVisibility,
} from 'uniswap/src/features/portfolio/balances/buildExtensionMultichainBalancesListData'
import {
  createPortfolioChainBalance,
  createPortfolioMultichainBalance,
} from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it } from 'vitest'

function chainBalance(
  chainId: number,
  currencyIdStr: string,
  valueUsd: number,
  isHidden: boolean,
): PortfolioChainBalance {
  return createPortfolioChainBalance({
    chainId,
    isHidden,
    valueUsd,
    quantity: 1,
    currencyInfo: {
      currencyId: currencyIdStr as PortfolioChainBalance['currencyInfo']['currencyId'],
      currency: {
        chainId,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        isToken: true,
        symbol: 'USDC',
        name: 'USD Coin',
        isNative: false,
      } as PortfolioChainBalance['currencyInfo']['currency'],
      logoUrl: undefined,
    },
  })
}

describe(partitionMultichainBalancesByPerChainVisibility, () => {
  it('matches per-chain partition totals for multichain row', () => {
    const t1 = chainBalance(1, '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 60, false)
    const t2 = chainBalance(42161, '42161-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 40, true)
    const balance = createPortfolioMultichainBalance({
      id: 'project-usdc',
      tokens: [t1, t2],
      totalValueUsd: 100,
      totalAmount: 2,
    })
    const { partitions, totalUsdVisible } = partitionMultichainBalancesByPerChainVisibility({
      balances: [balance],
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(partitions).toHaveLength(1)
    expect(partitions[0]!.visibleChainTokens).toHaveLength(1)
    expect(partitions[0]!.hiddenChainTokens).toHaveLength(1)
    expect(totalUsdVisible).toBe(60)
  })
})

describe(buildVisibleSubsetMultichainBalance, () => {
  it('recomputes totalValueUsd and totalAmount from visible chains only', () => {
    const t1 = chainBalance(1, '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 30, false)
    const t2 = chainBalance(42161, '42161-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 70, false)
    const balance = createPortfolioMultichainBalance({
      id: 'mc',
      tokens: [t1, t2],
      totalValueUsd: 100,
      totalAmount: 2,
      priceUsd: 50,
    })
    const visibleOnly = buildVisibleSubsetMultichainBalance(balance, [t1])
    expect(visibleOnly.totalValueUsd).toBe(30)
    expect(visibleOnly.totalAmount).toBe(1)
    expect(visibleOnly.tokens).toHaveLength(1)
    expect(visibleOnly.priceUsd).toBe(30)
  })

  it('throws when no visible tokens', () => {
    const balance = createPortfolioMultichainBalance()
    expect(() => buildVisibleSubsetMultichainBalance(balance, [])).toThrow()
  })
})

describe(flattenPortfolioMultichainBalanceToSingleChainRows, () => {
  it('returns one row per chain with synthetic ids when multichain', () => {
    const t1 = chainBalance(1, '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 10, false)
    const t2 = chainBalance(42161, '42161-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 20, false)
    const balance = createPortfolioMultichainBalance({
      id: 'parent-id',
      tokens: [t1, t2],
    })
    const rows = flattenPortfolioMultichainBalanceToSingleChainRows(balance)
    expect(rows).toHaveLength(2)
    expect(rows[0]!.id).not.toBe(balance.id)
    expect(rows[0]!.tokens).toHaveLength(1)
    expect(rows[1]!.tokens).toHaveLength(1)
  })
})

describe(buildExtensionMultichainBalancesListData, () => {
  it('produces visible subset, flattened hidden rows, and hiddenTokensCount', () => {
    const tVisible = chainBalance(1, '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 50, false)
    const tHidden = chainBalance(42161, '42161-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', 25, true)
    const partial = createPortfolioMultichainBalance({
      id: 'partial-mc',
      tokens: [tVisible, tHidden],
      totalValueUsd: 75,
    })
    const tFullHidden = chainBalance(10, '10-0x2222222222222222222222222222222222222222', 99, false)
    const fullHidden = createPortfolioMultichainBalance({
      id: 'full-hidden-mc',
      tokens: [tFullHidden],
      totalValueUsd: 99,
      isHidden: true,
    })
    const balancesById: Record<string, PortfolioMultichainBalance> = {
      [partial.id]: partial,
      [fullHidden.id]: fullHidden,
    }
    const out = buildExtensionMultichainBalancesListData({
      sortedBalances: { balances: [partial], hiddenBalances: [fullHidden] },
      balancesById,
      isTestnetModeEnabled: false,
      currencyIdToTokenVisibility: {},
    })
    expect(out.sortedDataForUi.balances).toHaveLength(1)
    expect(out.sortedDataForUi.balances[0]!.totalValueUsd).toBe(50)
    expect(out.sortedDataForUi.balances[0]!.tokens).toHaveLength(1)
    // partial hidden chain (1) first, then fully hidden flattened (1)
    expect(out.hiddenTokensCount).toBe(2)
    expect(out.sortedDataForUi.hiddenBalances).toHaveLength(2)
    expect(out.sortedDataForUi.hiddenBalances[0]!.id.startsWith('partial-mc-')).toBe(true)
    expect(out.sortedDataForUi.hiddenBalances[1]!.id).toBe('full-hidden-mc')
    expect(out.listBalancesById['partial-mc']!.totalValueUsd).toBe(50)
    expect(out.listBalancesById['full-hidden-mc']).toBeDefined()
  })
})
