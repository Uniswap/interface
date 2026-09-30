import { Code, ConnectError } from '@connectrpc/connect'
import type { Currency } from '@uniswap/sdk-core'
import { SharedQueryClient } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { getCommonBase } from 'uniswap/src/constants/routing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { restV2TokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils/restV2TokenToCurrencyInfo'
import type { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'
import { ONE_DAY_MS, ONE_HOUR_MS } from 'utilities/src/time/time'

const FILE_NAME = 'fetchCurrencyInfo.ts'

/** Imperative GetToken lookup for code that can't use `useCurrencyInfo` (sagas, parsers, updaters). */
export async function fetchTokenCurrencyInfo(chainId: UniverseChainId, address: string): Promise<CurrencyInfo | null> {
  const log = createLogger(FILE_NAME, 'fetchTokenCurrencyInfo', '[ITBU]')

  try {
    // Native addresses are passed through untranslated on purpose: portfolio callers only accept
    // `isToken` results, so natives resolve to null here; `fetchCurrency` short-circuits them first.
    const result = await SharedQueryClient.fetchQuery({
      ...getGetTokenQueryOptions({ params: { chainId, address } }),
      // Token metadata rarely changes — hold it far longer than the TDP-oriented staleTime on the
      // shared GetToken options. It gets refreshed when fetching portfolio balances anyway.
      staleTime: ONE_HOUR_MS,
      gcTime: ONE_DAY_MS,
    })

    if (!result?.token) {
      log.debug('Token not found via GetToken', { chainId, address })
      return null
    }

    return restV2TokenToCurrencyInfo(result.token) ?? null
  } catch (error) {
    // Unknown tokens can surface as NotFound rather than an empty response — expected, not an error.
    if (error instanceof ConnectError && error.code === Code.NotFound) {
      log.debug('Token not found via GetToken', { chainId, address })
      return null
    }
    log.error(error, { chainId, address })
    return null
  }
}

/** Resolves a currencyId to a Currency: natives and common bases synchronously, anything else via GetToken. */
export async function fetchCurrency(currencyId: CurrencyId): Promise<Currency | undefined> {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return undefined
  }
  const address = currencyIdToAddress(currencyId)

  if (isNativeCurrencyAddress(chainId, address)) {
    return nativeOnChain(chainId)
  }

  const commonBase = getCommonBase(chainId, address)
  if (commonBase) {
    return commonBase.currency
  }

  return (await fetchTokenCurrencyInfo(chainId, address))?.currency
}
