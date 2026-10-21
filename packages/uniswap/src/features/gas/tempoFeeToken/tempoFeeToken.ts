import { queryOptions } from '@tanstack/react-query'
import { Token } from '@uniswap/sdk-core'
import { AddressStringFormat, UniverseChainId, areEvmAddressesEqual, normalizeAddress } from '@universe/chains'
import { parseHex } from '@universe/encoding'
import { TEMPO_CHAIN_INFO, TIP20_DECIMALS } from 'uniswap/src/features/chains/evm/info/tempo'
import { viemClients } from 'uniswap/src/features/providers/viemClients'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { Actions } from 'viem/tempo'

export async function fetchTempoFeeTokenPreference(accountAddress: Address): Promise<Address | null> {
  const feeToken = await Actions.fee.getUserToken(viemClients.getViemClient(UniverseChainId.Tempo), {
    account: parseHex(accountAddress),
  })

  return feeToken?.address ?? null
}

type TempoFeeTokenPreferenceQueryKey = [ReactQueryCacheKey.TempoFeeTokenPreference, string | undefined]

function getTempoFeeTokenPreferenceQueryKey(accountAddress?: Address): TempoFeeTokenPreferenceQueryKey {
  return [
    ReactQueryCacheKey.TempoFeeTokenPreference,
    accountAddress ? normalizeAddress(accountAddress, AddressStringFormat.Lowercase) : undefined,
  ]
}

export function getTempoFeeTokenPreferenceQueryOptions(
  accountAddress?: Address,
): QueryOptionsResult<Address | null, Error, Address | null, TempoFeeTokenPreferenceQueryKey> {
  return queryOptions({
    queryKey: getTempoFeeTokenPreferenceQueryKey(accountAddress),
    queryFn: (): Promise<Address | null> => {
      if (!accountAddress) {
        throw new Error('Missing account for Tempo fee token preference')
      }
      return fetchTempoFeeTokenPreference(accountAddress)
    },
    enabled: !!accountAddress,
    staleTime: ONE_MINUTE_MS,
  })
}

export function getTempoFeeToken(address: Address): Token {
  const knownToken = Object.values(TEMPO_CHAIN_INFO.tokens)
    .flat()
    .find((token) => areEvmAddressesEqual(token.address, address))

  return knownToken ?? new Token(UniverseChainId.Tempo, address, TIP20_DECIMALS)
}
