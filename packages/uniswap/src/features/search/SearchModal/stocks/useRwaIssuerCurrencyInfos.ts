import { useMemo } from 'react'
import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { dedupeCurrencyIds } from 'uniswap/src/features/search/SearchModal/utils/dedupeCurrencyIds'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

function issuerPrimaryCurrencyId({
  issuer,
  enabledChainIds,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
}): string | undefined {
  const chainToken = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  const chainId = chainToken && toSupportedChainId(chainToken.chainId)
  return chainToken && chainId ? buildCurrencyId(chainId, chainToken.address) : undefined
}

export function collectRwaIssuerPrimaryCurrencyIds({
  rwa,
  enabledChainIds,
}: {
  rwa: Rwa
  enabledChainIds: readonly UniverseChainId[]
}): string[] {
  const ids = rwa.issuerTokens
    .map((issuer) => issuerPrimaryCurrencyId({ issuer, enabledChainIds }))
    .filter((id): id is string => Boolean(id))
  return dedupeCurrencyIds(ids)
}

export function gatherRwaIssuerPrimaryCurrencyIds({
  options,
  enabledChainIds,
}: {
  options: SearchModalOption[]
  enabledChainIds: readonly UniverseChainId[]
}): string[] {
  const ids = options.flatMap((option) =>
    option.type === OnchainItemListOptionType.RwaCollection
      ? collectRwaIssuerPrimaryCurrencyIds({ rwa: option.rwa, enabledChainIds })
      : [],
  )
  return dedupeCurrencyIds(ids)
}

/** The Map key for an issuer's resolved primary-chain CurrencyInfo (undefined → no enabled chain → no menu). */
export function getRwaIssuerPrimaryCurrencyId({
  issuer,
  enabledChainIds,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
}): string | undefined {
  const id = issuerPrimaryCurrencyId({ issuer, enabledChainIds })
  return id ? normalizeCurrencyIdForMapLookup(id) : undefined
}

/**
 * One CurrencyInfo per issuer primary-chain token across the rendered sections, via ONE batched `useTokensQuery`
 * (cache-first). Call ONCE per list at top level. Fires for ANY `RwaCollection` in the rendered sections — both the
 * no-query Stocks shelf AND live-search multi-issuer collections — and short-circuits to `[]` (zero query, zero cost)
 * when there are no collection options. Bounded (≤ a handful of issuer ids) and off the render path; the menu is
 * simply absent until it resolves (graceful, no crash). The returned Map re-creates when `useCurrencyInfos` resolves
 * (a gql-cache write); the consumer stabilizes it once (its memoized renderIssuerRow factory), not here.
 */
export function useRwaIssuerCurrencyInfos({
  sections,
}: {
  sections?: OnchainItemSection<SearchModalOption>[]
}): Map<string, CurrencyInfo> {
  const { chains: enabledChainIds } = useEnabledChains()
  const options = useMemo(() => (sections ?? []).flatMap((s) => s.data), [sections])
  const currencyIds = useMemo(
    () => gatherRwaIssuerPrimaryCurrencyIds({ options, enabledChainIds }),
    [options, enabledChainIds],
  )
  const resolved = useCurrencyInfos(currencyIds)
  return useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (const info of resolved) {
      if (info) {
        map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }
    return map
  }, [resolved])
}

export function getRwaIssuerCurrencyInfo({
  issuer,
  enabledChainIds,
  currencyInfos,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  currencyInfos: Map<string, CurrencyInfo>
}): CurrencyInfo | undefined {
  const key = getRwaIssuerPrimaryCurrencyId({ issuer, enabledChainIds })
  return key ? currencyInfos.get(key) : undefined
}
