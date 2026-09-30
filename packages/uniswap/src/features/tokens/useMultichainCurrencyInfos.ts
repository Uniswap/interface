import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import type { GetTokensMultiChainResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useCallback, useMemo } from 'react'
import { getGetTokensMultiChainQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { dataApiMultichainTokenToCurrencyInfos } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { areCurrencyIdsEqual } from 'uniswap/src/utils/currencyId'

/** One group per multichain token in the response: that asset's CurrencyInfo on every chain it's deployed on. */
export type MultichainCurrencyInfoGroups = CurrencyInfo[][]

export type SelectMultichainCurrencyInfos<TData> = (
  groups: MultichainCurrencyInfoGroups,
  requestedCurrencyIds: CurrencyId[],
) => TData

export interface UseMultichainCurrencyInfosOptions {
  skip?: boolean
}

export function useMultichainCurrencyInfosQuery<TData>(
  currencyIds: CurrencyId[],
  { skip, select: selectGroups }: UseMultichainCurrencyInfosOptions & { select: SelectMultichainCurrencyInfos<TData> },
): UseQueryResult<TData> {
  const params = useMemo(
    () => ({
      identifier: {
        case: 'tokens' as const,
        value: { tokens: currencyIds.map((id) => currencyIdToRestContractInput(id)) },
      },
    }),
    [currencyIds],
  )
  const select = useCallback(
    (data: PlainMessage<GetTokensMultiChainResponse> | undefined) =>
      selectGroups((data?.tokens ?? []).map(dataApiMultichainTokenToCurrencyInfos), currencyIds),
    [currencyIds, selectGroups],
  )

  return useQuery(
    getGetTokensMultiChainQueryOptions({
      params,
      enabled: !skip && currencyIds.length > 0,
      select,
      keepPreviousData: false,
    }),
  )
}

function flattenGroups(groups: MultichainCurrencyInfoGroups): CurrencyInfo[] {
  return groups.flat()
}

// Native assets (ETH, SOL, BNB, ...) also have bridged/wrapped copies on other networks (e.g.
// Wormhole SOL on EVM chains); those are dropped so the asset only appears where it is native.
function keepOnlyNativesForNativeAssets(groups: MultichainCurrencyInfoGroups): CurrencyInfo[] {
  return groups.flatMap((currencyInfos) => {
    const natives = currencyInfos.filter((currencyInfo) => currencyInfo.currency.isNative)
    return natives.length > 0 ? natives : currencyInfos
  })
}

function groupByRequestedCurrencyId(
  groups: MultichainCurrencyInfoGroups,
  requestedCurrencyIds: CurrencyId[],
): ReadonlyMap<CurrencyId, CurrencyInfo[]> {
  const byCurrencyId = new Map<CurrencyId, CurrencyInfo[]>()

  for (const currencyInfos of groups) {
    for (const requestedCurrencyId of requestedCurrencyIds) {
      if (byCurrencyId.has(requestedCurrencyId)) {
        continue
      }
      const belongsToGroup = currencyInfos.some((currencyInfo) =>
        areCurrencyIdsEqual(currencyInfo.currencyId, requestedCurrencyId),
      )
      if (belongsToGroup) {
        byCurrencyId.set(requestedCurrencyId, currencyInfos)
      }
    }
  }

  return byCurrencyId
}

/** Every chain deployment of each requested asset, flattened. */
export function useMultichainCurrencyInfos(
  currencyIds: CurrencyId[],
  options?: UseMultichainCurrencyInfosOptions,
): UseQueryResult<CurrencyInfo[]> {
  return useMultichainCurrencyInfosQuery(currencyIds, { skip: options?.skip, select: flattenGroups })
}

/** Same as useMultichainCurrencyInfos, but native assets only contribute their native deployments. */
export function useMultichainCurrencyInfosWithoutBridgedNatives(
  currencyIds: CurrencyId[],
  options?: UseMultichainCurrencyInfosOptions,
): UseQueryResult<CurrencyInfo[]> {
  return useMultichainCurrencyInfosQuery(currencyIds, { skip: options?.skip, select: keepOnlyNativesForNativeAssets })
}

/** Each requested currencyId mapped to every chain deployment of its asset (itself included). */
export function useMultichainCurrencyInfosByCurrencyId(
  currencyIds: CurrencyId[],
  options?: UseMultichainCurrencyInfosOptions,
): UseQueryResult<ReadonlyMap<CurrencyId, CurrencyInfo[]>> {
  return useMultichainCurrencyInfosQuery(currencyIds, { skip: options?.skip, select: groupByRequestedCurrencyId })
}
