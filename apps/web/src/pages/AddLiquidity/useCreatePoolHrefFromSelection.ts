import type { UniverseChainId } from '@universe/chains'
import { useQueryStates } from 'nuqs'
import { useMemo } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { parseAsChainId, parseAsCurrencyAddress } from '~/features/Liquidity/parsers/urlParsers'
import { parseAsPoolsFilter } from '~/features/Liquidity/PoolsFilter/urlParam'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { buildCreatePoolHrefFromCurrencies } from '~/pages/AddLiquidity/poolLinkParams'

// The table filter uses dedicated `filter*` query keys so it stays independent of the
// `currencyA`/`currencyB`/`chain` params that the pool-selection link writes for the form/panel.
// Otherwise selecting a pool would narrow the table to that pool's exact token pair.
export const BROWSER_FILTER_PARSERS = {
  filterCurrencyA: parseAsCurrencyAddress.withDefault(''),
  filterCurrencyB: parseAsCurrencyAddress.withDefault(''),
  filterChain: parseAsChainId,
  // The chain the *selected tokens* live on. Distinct from `filterChain`, which is the table's
  // network filter and is legitimately cleared by Network = "All" while the tokens stay selected.
  // Held in the URL rather than component state so it survives a reload and is readable by the
  // page header, which renders outside `PoolBrowser`.
  filterTokenChain: parseAsChainId,
  // Advanced pools filter, serialized as one JSON param.
  poolsFilter: parseAsPoolsFilter,
}

/**
 * Resolves the pool browser's selected token pair off the URL — the one derivation shared by the
 * page's currency selectors and both "+ Create pool" CTAs, which renders drift between them
 * impossible rather than merely unlikely.
 *
 * The chain comes from `filterTokenChain`, not `filterChain`: the latter is the *table's* network
 * filter and `handlePoolsFilterApply` nulls it for Network = "All"
 * while leaving the tokens selected, so reading it yielded a token with no chain. It stays as a
 * fallback for a URL written before `filterTokenChain` existed. Unlike the mount-seeded state it
 * replaced, the param survives a reload.
 *
 * When neither param yields a chain the selection resolves to nothing at all rather than to the
 * connected chain — see the `skip` argument below, which is what makes "no chain ⇒ blank form"
 * true rather than merely intended.
 */
export function useResolvedBrowserSelection(): {
  currencyAInfo: Maybe<CurrencyInfo>
  currencyBInfo: Maybe<CurrencyInfo>
  chainId: UniverseChainId | undefined
} {
  const [{ filterCurrencyA, filterCurrencyB, filterTokenChain, filterChain }] = useQueryStates(BROWSER_FILTER_PARSERS)

  const chainId = filterTokenChain ?? filterChain ?? undefined
  // An absent chain hint does NOT fail to resolve: `useCurrencyPreprocessing` substitutes the
  // connected wallet's chain (else Mainnet), so the `NATIVE` sentinel comes back as *that* chain's
  // native currency and would seed a pool on a chain the user never picked. `skip` is the only way
  // to turn "no chain" back into "no currency" and land on the blank form instead. Reachable on a
  // URL carrying `filterCurrency*` with neither chain param — one written before `filterTokenChain`
  // existed, or one whose `filterChain` was nulled by Network = "All".
  const skipWithoutChain = chainId === undefined
  // The parsers default to '' rather than null, and an empty address must not be looked up.
  const currencyAInfo = useCurrencyInfo(filterCurrencyA || undefined, chainId, skipWithoutChain)
  const currencyBInfo = useCurrencyInfo(filterCurrencyB || undefined, chainId, skipWithoutChain)

  return { currencyAInfo, currencyBInfo, chainId }
}

/**
 * Builds the "+ Create pool" href from the tokens currently selected in the pool browser, so the
 * CTA carries the pair the user already picked instead of opening a blank create form.
 *
 * Shared with the page header, whose CTA renders outside `PoolBrowser` but above the same URL
 * state, so both CTAs resolve the selection identically and neither can drift from the other.
 * Passing resolved currencies to the builder is what keeps a token's address and its chain
 * together; see `buildCreatePoolHrefFromCurrencies`.
 */
export function useCreatePoolHrefFromSelection(): string {
  const { currencyAInfo, currencyBInfo } = useResolvedBrowserSelection()

  const currencyA = currencyAInfo?.currency
  const currencyB = currencyBInfo?.currency

  return useMemo(() => buildCreatePoolHrefFromCurrencies({ currencyA, currencyB }), [currencyA, currencyB])
}
