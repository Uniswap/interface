import type { PlainMessage } from '@bufbuild/protobuf'
import { type QueryKey, useQueries, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query'
import type { GetTokenResponse, GetTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import type { Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getCommonBase } from 'uniswap/src/constants/routing'
import {
  getGetTokenQueryOptions,
  getGetTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { CurrencyInfo, RestContract } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { formatColorOverrides } from 'uniswap/src/features/dataApi/utils/formatColorOverrides'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import {
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'
import { chunkArray } from 'utilities/src/primitives/array'

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
      const colorOverrides = formatColorOverrides(restToken?.project?.colors)
      if (colorOverrides) {
        copyCommonBase.colorOverrides = colorOverrides
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

// GetTokens rejects requests for more than this many tokens.
const GET_TOKENS_MAX_BATCH_SIZE = 100

export type RestTokensQueryResult<TData> = Pick<
  UseQueryResult<TData>,
  'data' | 'isLoading' | 'isPlaceholderData' | 'error'
> & {
  refetch: () => Promise<void>
}

// `tokens` is positional to the whole request, so it is set only once every batch answered. Placeholder
// data is not "loading", so callers that must not act on it also gate on `isPlaceholderData`.
function combineRestTokenBatches(results: UseQueryResult<RestTokens>[]): {
  tokens: RestTokens | undefined
  isLoading: boolean
  isPlaceholderData: boolean
  error: Error | null
  refetch: () => Promise<void>
} {
  const batches = results.map((result) => result.data)

  return {
    tokens: batches.length > 0 && batches.every((batch) => batch !== undefined) ? batches.flat() : undefined,
    isLoading: results.some((result) => result.isLoading),
    isPlaceholderData: results.some((result) => result.isPlaceholderData),
    error: results.find((result) => result.error)?.error ?? null,
    refetch: () => Promise.all(results.map((result) => result.refetch())).then(() => undefined),
  }
}

/** `selectBatch` must be referentially stable so each batch's selection stays memoized. */
function useRestTokenBatchQueries<TBatch>(
  currencyIds: string[],
  { skip, selectBatch }: { skip?: boolean; selectBatch: (tokens: RestTokens) => TBatch },
): { restContractBatches: RestContract[][]; queries: ReturnType<typeof getGetTokensQueryOptions<TBatch>>[] } {
  // Resolved once for both the request and response-matching, so a native currency's REST-wire address
  // (e.g. 0x0, unlike the currencyId's own address) can't drift between the two.
  const restContractBatches = useMemo(
    () =>
      chunkArray(
        currencyIds.map((id) => currencyIdToRestContractInput(id)),
        GET_TOKENS_MAX_BATCH_SIZE,
      ),
    [currencyIds],
  )
  // useQueries matches observers by query hash, so keepPreviousData can't carry rows across an id-set
  // change. The previous set's cached responses serve as placeholder data instead, re-matched by contract.
  const queryClient = useQueryClient()
  const previousQueryKeysRef = useRef<QueryKey[]>([])
  const queries = useMemo(() => {
    const previousQueryKeys = previousQueryKeysRef.current
    const previousResponse = (): PlainMessage<GetTokensResponse> | undefined => {
      const responses = previousQueryKeys.map((key) => queryClient.getQueryData<PlainMessage<GetTokensResponse>>(key))
      return responses.some(Boolean) ? { tokens: responses.flatMap((response) => response?.tokens ?? []) } : undefined
    }

    return restContractBatches.map((restContracts) => ({
      ...getGetTokensQueryOptions({
        params: { tokens: restContracts },
        enabled: !skip,
        keepPreviousData: false,
        select: (data) => selectBatch(matchRestTokensToContracts(restContracts, data)),
      }),
      placeholderData: previousResponse,
    }))
  }, [restContractBatches, skip, selectBatch, queryClient])
  // Advance only once this id set has answered, so a set that changes again mid-flight still falls
  // back to the last set with data (as keepPreviousData would) instead of an in-flight set's empty cache.
  const hasData = queries.some((query) => queryClient.getQueryData(query.queryKey) !== undefined)
  useEffect(() => {
    if (hasData) {
      previousQueryKeysRef.current = queries.map((query) => query.queryKey)
    }
  }, [queries, hasData])

  return { restContractBatches, queries }
}

function selectRestTokens(tokens: RestTokens): RestTokens {
  return tokens
}

function restTokensToCurrencyInfos(tokens: RestTokens): Maybe<CurrencyInfo>[] {
  return tokens.map((token) => token && restV2TokenToCurrencyInfo(token))
}

/**
 * Raw GetTokens v2 tokens for `currencyIds`, for fields CurrencyInfo doesn't carry (e.g. price). `select`
 * must be referentially stable so the derived data is memoized.
 */
export function useRestTokensQuery<TData>(
  currencyIds: string[],
  { skip, select: selectTokens }: { skip?: boolean; select: (tokens: RestTokens) => TData },
): RestTokensQueryResult<TData> {
  const { queries } = useRestTokenBatchQueries(currencyIds, { skip, selectBatch: selectRestTokens })
  const { tokens, isLoading, isPlaceholderData, error, refetch } = useQueries({
    queries,
    combine: combineRestTokenBatches,
  })
  const data = useMemo(() => (tokens ? selectTokens(tokens) : undefined), [tokens, selectTokens])

  return { data, isLoading, isPlaceholderData, error, refetch }
}

function useRestCurrencyInfosQuery<TData>(
  currencyIds: string[],
  {
    skip,
    selectCurrencyInfos,
  }: { skip?: boolean; selectCurrencyInfos: (currencyInfos: Maybe<CurrencyInfo>[]) => TData },
): RestTokensQueryResult<TData> {
  const select = useCallback(
    (tokens: RestTokens) => selectCurrencyInfos(restTokensToCurrencyInfos(tokens)),
    [selectCurrencyInfos],
  )

  return useRestTokensQuery(currencyIds, { skip, select })
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
  const { restContractBatches, queries } = useRestTokenBatchQueries(_currencyIds, {
    skip: options?.skip,
    selectBatch: restTokensToCurrencyInfos,
  })
  const combine = useCallback(
    (results: UseQueryResult<Maybe<CurrencyInfo>[]>[]) =>
      results.flatMap(
        ({ data }, i) => data ?? Array.from({ length: restContractBatches[i]?.length ?? 0 }, () => undefined),
      ),
    [restContractBatches],
  )

  return useQueries({ queries, combine })
}

export function useCurrencyInfosWithLoading(
  _currencyIds: string[],
  options?: { skip?: boolean },
): RestTokensQueryResult<CurrencyInfo[]> {
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
