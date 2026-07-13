import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { resolveAddLiquidityRenderGuard } from '~/pages/AddLiquidity/addLiquidityRenderGuard'

// Only truthiness matters to the guard, so minimal stand-ins are enough.
const TOKEN = {} as Currency
const POOL_DATA = {} as PoolData
const CHAIN_ID = UniverseChainId.Mainnet

const BASE = {
  poolAddress: '0xpool',
  chainIdFromUrl: CHAIN_ID,
  flowState: 'form' as const,
  poolLoading: false,
  poolData: undefined as PoolData | undefined,
  urlToken0: undefined as Currency | undefined,
  urlToken1: undefined as Currency | undefined,
  currenciesLoading: false,
}

describe('resolveAddLiquidityRenderGuard', () => {
  it('renders the pool browser immediately when there is no pool address', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, poolAddress: undefined, flowState: 'browse' })).toBe('ready')
  })

  it('redirects when a pool address is present but the chain is unresolved', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, chainIdFromUrl: undefined })).toBe('redirect')
  })

  it('redirects when pool data finished loading with nothing to render', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, poolLoading: false, poolData: undefined })).toBe('redirect')
  })

  it('shows a loader while pool data loads and the URL has no tokens', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, poolLoading: true })).toBe('loading')
  })

  // The core regression: a step link with `currencyA=NATIVE` (resolves instantly) but
  // `currencyB=undefined`/still-loading must wait for a complete pair before mounting the form,
  // rather than freezing a half-pair and syncing `currencyB=undefined` back to the URL.
  it('waits for pool data when the form has only one resolved URL currency', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, urlToken0: TOKEN, urlToken1: undefined, poolLoading: true })).toBe(
      'loading',
    )
  })

  it('waits while a token currencyB is still resolving even after pool data settles', () => {
    expect(
      resolveAddLiquidityRenderGuard({
        ...BASE,
        urlToken0: TOKEN,
        urlToken1: undefined,
        poolLoading: false,
        currenciesLoading: true,
      }),
    ).toBe('loading')
  })

  it('renders the form once pool data resolves the token pair', () => {
    expect(
      resolveAddLiquidityRenderGuard({ ...BASE, urlToken0: TOKEN, urlToken1: undefined, poolData: POOL_DATA }),
    ).toBe('ready')
  })

  it('renders the form immediately when both URL currencies are present', () => {
    expect(resolveAddLiquidityRenderGuard({ ...BASE, urlToken0: TOKEN, urlToken1: TOKEN })).toBe('ready')
  })

  it('does not block the form on an incomplete pair when nothing is loading', () => {
    // The loading gate only applies while pool data or currencies are still resolving. With one URL
    // token present and nothing loading, the form renders immediately (ready) rather than blocking.
    expect(resolveAddLiquidityRenderGuard({ ...BASE, urlToken0: TOKEN, urlToken1: undefined })).toBe('ready')
  })
})
