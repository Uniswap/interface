import { createPortfolioChainBalance } from 'uniswap/src/test/fixtures/dataApi/portfolioMultichainBalances'
import { describe, expect, it, vi } from 'vitest'
import { flattenMultichainChainToken, multichainChainTokenRowSuffix } from './flattenMultichainToSingleChainRows'

describe(multichainChainTokenRowSuffix, () => {
  it('uses currencyId when present', () => {
    const t = createPortfolioChainBalance()
    expect(multichainChainTokenRowSuffix(t)).toBe(t.currencyInfo.currencyId)
  })
})

describe(flattenMultichainChainToken, () => {
  it('invokes onEmpty when no tokens', () => {
    const onEmpty = vi.fn()
    const onSingle = vi.fn()
    const onMulti = vi.fn()
    flattenMultichainChainToken({
      parentId: 'p',
      chainTokens: [],
      onEmpty,
      onSingleChain: onSingle,
      onMultiChainEach: onMulti,
    })
    expect(onEmpty).toHaveBeenCalledTimes(1)
    expect(onSingle).not.toHaveBeenCalled()
    expect(onMulti).not.toHaveBeenCalled()
  })

  it('invokes onSingleChain once for single-token parent', () => {
    const t = createPortfolioChainBalance()
    const onSingle = vi.fn()
    flattenMultichainChainToken({
      parentId: 'parent',
      chainTokens: [t],
      onSingleChain: onSingle,
      onMultiChainEach: vi.fn(),
    })
    expect(onSingle).toHaveBeenCalledWith(t)
  })

  it('invokes onMultiChainEach with distinct flattened ids for multichain parent', () => {
    const t1 = createPortfolioChainBalance({ chainId: 1 })
    const t2 = createPortfolioChainBalance({
      chainId: 42161,
      address: '0x2222222222222222222222222222222222222222',
      currencyInfo: {
        currencyId: '42161-0x2222222222222222222222222222222222222222',
        currency: {
          chainId: 42161,
          address: '0x2222222222222222222222222222222222222222',
          isToken: true,
          symbol: 'B',
          name: 'B',
          isNative: false,
        } as ReturnType<typeof createPortfolioChainBalance>['currencyInfo']['currency'],
        logoUrl: undefined,
      },
    })
    const onMulti = vi.fn()
    flattenMultichainChainToken({
      parentId: 'mc',
      chainTokens: [t1, t2],
      onSingleChain: vi.fn(),
      onMultiChainEach: onMulti,
    })
    expect(onMulti).toHaveBeenCalledTimes(2)
    const id0 = onMulti.mock.calls[0]![0].flattenedRowId
    const id1 = onMulti.mock.calls[1]![0].flattenedRowId
    expect(id0).toMatch(/^mc-/)
    expect(id1).toMatch(/^mc-/)
    expect(id0).not.toBe(id1)
  })
})
