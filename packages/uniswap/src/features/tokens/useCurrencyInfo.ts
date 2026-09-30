import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { GetTokenResponse, GetTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { useCallback, useMemo } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import {
  getGetTokenQueryOptions,
  getGetTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { CurrencyInfo, RestContract } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'

function selectCurrencyInfo(
  _currencyId: string,
  data: PlainMessage<GetTokenResponse> | undefined,
): CurrencyInfo | undefined {
  const chainId = currencyIdToChain(_currencyId)
  let address: Address | undefined
  try {
    address = currencyIdToAddress(_currencyId)
  } catch (_error) {
    return undefined
  }

  const restToken = data?.token
  const logoUrlOverride = restToken?.project?.logoUrl

  if (chainId && address) {
    const commonBase = getCommonBase(chainId, address)
    if (commonBase) {
      // Creating new object to avoid error "Cannot assign to read only property"
      const copyCommonBase = { ...commonBase }
      // Related to TODO(WEB-5111)
      // Some common base images are broken so this'll ensure we read from uniswap images.
      // Native currencies are excluded: their commonBase logo is our own maintained static
      // asset, never the "broken image" case this override exists for — and backend project
      // metadata for the native placeholder address (0xeee/0x0) isn't reliable enough to trust.
      if (logoUrlOverride && !commonBase.currency.isNative) {
        copyCommonBase.logoUrl = logoUrlOverride
      }
      copyCommonBase.currencyId = _currencyId

      return copyCommonBase
    }
  }

  return restToken && restV2TokenToCurrencyInfo(restToken)
}

function useCurrencyInfoQuery(
  _currencyId?: string,
  options?: { skip?: boolean },
): UseQueryResult<CurrencyInfo | undefined> {
  const restParams = useMemo(
    () => (_currencyId ? currencyIdToRestContractInput(_currencyId) : undefined),
    [_currencyId],
  )
  const select = useCallback(
    (data: PlainMessage<GetTokenResponse> | undefined) =>
      _currencyId ? selectCurrencyInfo(_currencyId, data) : undefined,
    [_currencyId],
  )

  return useQuery(
    getGetTokenQueryOptions({
      params: restParams,
      enabled: !!restParams && !options?.skip,
      select,
      keepPreviousData: false,
    }),
  )
}

// GetTokensResponse is best-effort: the response may omit unfound tokens or return them out
// of order, so results must be matched back to the request by chainId+address.
function restTokenKey(chainId: number, address: string): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

/** GetTokens results in request order; `undefined` where the backend omitted a token. */
export type RestTokens = (PlainMessage<Token> | undefined)[]

function matchRestTokensToContracts(
  restContracts: RestContract[],
  data: PlainMessage<GetTokensResponse> | undefined,
): RestTokens {
  const tokenByKey = new Map((data?.tokens ?? []).map((token) => [restTokenKey(token.chainId, token.address), token]))

  return restContracts.map(({ chainId, address }) => tokenByKey.get(restTokenKey(chainId, address)))
}

/**
 * Fetches the raw v2 tokens for `currencyIds` via GetTokens, positional to the request, and derives
 * `TData` from them with `select`. Use this when a surface needs fields CurrencyInfo doesn't carry
 * (e.g. price). `select` must be referentially stable so React Query can memoize the derived data.
 */
export function useRestTokensQuery<TData>(
  currencyIds: string[],
  { skip, select: selectTokens }: { skip?: boolean; select: (tokens: RestTokens) => TData },
): UseQueryResult<TData> {
  // Resolved once and reused for both the request and response-matching below, so the native
  // currency's REST-wire address (e.g. 0x0, which can differ from the currencyId's own address)
  // can't drift between the two.
  const restContracts = useMemo(() => currencyIds.map((id) => currencyIdToRestContractInput(id)), [currencyIds])
  const restParams = useMemo(() => ({ tokens: restContracts }), [restContracts])
  const select = useCallback(
    (data: PlainMessage<GetTokensResponse> | undefined) =>
      selectTokens(matchRestTokensToContracts(restContracts, data)),
    [restContracts, selectTokens],
  )

  return useQuery(
    getGetTokensQueryOptions({
      params: restParams,
      enabled: !skip && !!currencyIds.length,
      select,
    }),
  )
}

function useRestCurrencyInfosQuery<TData>(
  currencyIds: string[],
  {
    skip,
    selectCurrencyInfos,
  }: { skip?: boolean; selectCurrencyInfos: (currencyInfos: Maybe<CurrencyInfo>[]) => TData },
): UseQueryResult<TData> {
  const select = useCallback(
    (tokens: RestTokens) => selectCurrencyInfos(tokens.map((token) => token && restV2TokenToCurrencyInfo(token))),
    [selectCurrencyInfos],
  )

  return useRestTokensQuery(currencyIds, { skip, select })
}

function keepPositionalCurrencyInfos(currencyInfos: Maybe<CurrencyInfo>[]): Maybe<CurrencyInfo>[] {
  return currencyInfos
}

function compactCurrencyInfos(currencyInfos: Maybe<CurrencyInfo>[]): CurrencyInfo[] {
  return currencyInfos.filter((currencyInfo): currencyInfo is CurrencyInfo => !!currencyInfo)
}

export function useCurrencyInfo(_currencyId?: string, options?: { skip?: boolean }): Maybe<CurrencyInfo> {
  const { data } = useCurrencyInfoQuery(_currencyId, options)

  // `select` only runs once the query has data, but common bases are static and must resolve
  // synchronously (and while skipped) — the REST fetch only refines their logo.
  return useMemo(
    () => data ?? (_currencyId ? selectCurrencyInfo(_currencyId, undefined) : undefined),
    [_currencyId, data],
  )
}

export function useCurrencyInfoWithLoading(
  _currencyId?: string,
  options?: { skip?: boolean },
): UseQueryResult<Maybe<CurrencyInfo>> {
  return useCurrencyInfoQuery(_currencyId, options)
}

export function useCurrencyInfos(_currencyIds: string[], options?: { skip?: boolean }): Maybe<CurrencyInfo>[] {
  const { data } = useRestCurrencyInfosQuery(_currencyIds, {
    skip: options?.skip,
    selectCurrencyInfos: keepPositionalCurrencyInfos,
  })

  return useMemo(() => data ?? Array.from({ length: _currencyIds.length }, () => undefined), [data, _currencyIds])
}

export function useCurrencyInfosWithLoading(
  _currencyIds: string[],
  options?: { skip?: boolean },
): UseQueryResult<CurrencyInfo[]> {
  return useRestCurrencyInfosQuery(_currencyIds, { skip: options?.skip, selectCurrencyInfos: compactCurrencyInfos })
}

export function useNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const nativeCurrencyId = buildNativeCurrencyId(chainId)
  return useCurrencyInfo(nativeCurrencyId)
}

export function useWrappedNativeCurrencyInfo(chainId: UniverseChainId): Maybe<CurrencyInfo> {
  const wrappedCurrencyId = buildWrappedNativeCurrencyId(chainId)
  return useCurrencyInfo(wrappedCurrencyId)
}
