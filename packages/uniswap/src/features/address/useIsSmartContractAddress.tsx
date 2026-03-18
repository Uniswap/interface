import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useProvider } from 'uniswap/src/contexts/UniswapContext'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { isDelegatedEOA } from 'uniswap/src/features/smartWallet/delegation/isDelegatedEOA'
import { ensure0xHex } from 'utilities/src/addresses/hex'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import type { QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export function useIsSmartContractAddress(
  address: string | undefined,
  chainId: UniverseChainId,
): {
  loading: boolean
  isSmartContractAddress: boolean
} {
  const provider = useProvider(chainId)
  const getQueryOptions = useMemo(() => createGetQueryOptions({ provider }), [provider])

  const { data, isLoading } = useQuery(getQueryOptions({ address, chainId }))
  return {
    isSmartContractAddress: data?.isSmartContractAddress ?? false,
    loading: isLoading,
  }
}

const createGetQueryOptions = (ctx: {
  provider: ReturnType<typeof useProvider>
}): ((input: { address: string | undefined; chainId: UniverseChainId }) => GetCodeQueryOptions) => {
  return (input: { address: string | undefined; chainId: UniverseChainId }): GetCodeQueryOptions =>
    queryOptions({
      queryKey: [ReactQueryCacheKey.IsSmartContractAddress, input.address, input.chainId],
      queryFn: async () => {
        if (!input.address) {
          return null
        }
        const result = await ctx.provider?.getCode(input.address)
        return result ?? null
      },
      enabled: !!input.address,
      select: selectIsSmartContractAddress,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
    })
}

type GetCodeQueryOptions = QueryOptionsResult<
  string | null,
  Error,
  { isSmartContractAddress: boolean; isDelegatedAddress: boolean },
  [ReactQueryCacheKey.IsSmartContractAddress, string | undefined, UniverseChainId]
>

function selectIsSmartContractAddress(bytecode: string | null): {
  isSmartContractAddress: boolean
  isDelegatedAddress: boolean
} {
  // provider.getCode(address) will return a hex string if a smart contract is deployed at that address
  // returning just 0x means there's no code and it's not a smart contract
  if (!bytecode || bytecode === '0x') {
    return {
      isSmartContractAddress: false,
      isDelegatedAddress: false,
    }
  }
  const result = isDelegatedEOA({ bytecode: ensure0xHex(bytecode) })

  return {
    isSmartContractAddress: !result.isDelegated,
    isDelegatedAddress: result.isDelegated,
  }
}
