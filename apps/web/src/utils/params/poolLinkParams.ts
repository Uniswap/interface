import type { Currency } from '@uniswap/sdk-core'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getChainUrlParam } from '~/utils/params/chainParams'

export function buildPoolSearchParams(meta: {
  currencyA?: string
  currencyB?: string
  chain?: string
  fee?: FeeData
  hookAddress?: string
  protocolVersion?: string
  entryPoint?: string
}): URLSearchParams {
  const params = new URLSearchParams()
  if (meta.currencyA) {
    params.set('currencyA', meta.currencyA)
  }
  if (meta.currencyB) {
    params.set('currencyB', meta.currencyB)
  }
  if (meta.chain) {
    params.set('chain', meta.chain)
  }
  if (meta.fee) {
    params.set('fee', JSON.stringify(meta.fee))
  }
  if (meta.hookAddress) {
    params.set('hook', meta.hookAddress)
  }
  if (meta.protocolVersion) {
    params.set('protocolVersion', meta.protocolVersion)
  }
  if (meta.entryPoint) {
    params.set('entryPoint', meta.entryPoint)
  }
  return params
}

// The pool browser, and the root of the add-liquidity flow. Every entry point that opens the flow
// without a pool in mind lands here.
export const ADD_LIQUIDITY_PATH = '/positions/add'

// The create-pool leg. Bare `/positions/add/new` starts the form empty; `currencyA`/`currencyB`/
// `chain` are the params `useLiquidityUrlState` seeds the token inputs from, so they are how any
// entry point pre-selects a pair.
export const CREATE_POOL_PATH = '/positions/add/new'

function getCurrencyUrlParam(currency: Maybe<Currency>): string | undefined {
  if (!currency) {
    return undefined
  }
  return currency.isNative ? NATIVE_CHAIN_ID : currency.address
}

/**
 * Builds the "+ Create pool" href from the *resolved* currencies the pool browser is showing,
 * carrying them into the create form so it opens pre-seeded instead of blank.
 *
 * Takes `Currency` objects rather than address strings on purpose: an address is meaningless to the
 * create page without the chain it lives on, and taking both off the same object makes it
 * impossible to emit one without the other. Reconstructing the chain from a *filter* param instead
 * is what made an earlier revision of this emit `?currencyA=…` with no `chain` once the network
 * filter was set to "All" — the create page then resolved the pair against its own default chain,
 * seeding mainnet ETH for a token picked on Base.
 *
 * Emits the same `currencyA`/`currencyB`/`chain` params (and the same `NATIVE_CHAIN_ID` sentinel)
 * that the pool-row links already write — no new param scheme. An unresolved token is simply left
 * out, so the worst case is the blank form we had before rather than a wrong-chain address — but
 * only because the caller refuses to resolve a selection whose chain it does not know. Resolving
 * with no chain hint yields the *connected* chain's native currency, not `undefined`, which would
 * arrive here as a perfectly well-formed pair on the wrong chain; see `useResolvedBrowserSelection`.
 */
export function buildCreatePoolHrefFromCurrencies(selection: {
  currencyA?: Maybe<Currency>
  currencyB?: Maybe<Currency>
}): string {
  const { currencyA, currencyB } = selection

  // Whichever side resolved first fixes the chain for the pair.
  const anchor = currencyA ?? currencyB
  if (!anchor) {
    return CREATE_POOL_PATH
  }

  const params = buildPoolSearchParams({
    currencyA: getCurrencyUrlParam(currencyA),
    // Two resolved sides always share a chain today: `handleCurrencySelect` clears the opposite slot
    // when it repoints the chain, and both sides are then resolved with one shared hint. This check
    // is the backstop that keeps that a property of the caller rather than an assumption: carrying a
    // pair from two independently-resolved sides would seed a pool that cannot exist.
    currencyB: currencyB?.chainId === anchor.chainId ? getCurrencyUrlParam(currencyB) : undefined,
    chain: getChainUrlParam(anchor.chainId),
  })

  const search = params.toString()
  return search ? `${CREATE_POOL_PATH}?${search}` : CREATE_POOL_PATH
}
