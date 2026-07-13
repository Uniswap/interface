import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { CHAIN_TO_ADDRESSES_MAP, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { useReadContract } from 'wagmi'
import { erc721Abi } from '~/chains'
import { assume0xAddress } from '~/utils/wagmi'

type TokenId = number | JSBI | bigint

const STARTS_WITH = 'data:application/json;base64,'

type UsePositionTokenURIResult =
  | {
      valid: true
      loading: false
      result: {
        name: string
        description: string
        image: string
      }
    }
  | {
      valid: false
      loading: false
    }
  | {
      valid: true
      loading: true
    }

/**
 * Both v3 and v4 position manager contracts.
 * Only the address differs by protocol version.
 */
function getPositionManagerAddress(version: ProtocolVersion, chainId?: EVMUniverseChainId): string | undefined {
  if (!chainId) {
    return undefined
  }
  return version === ProtocolVersion.V3
    ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId]
    : CHAIN_TO_ADDRESSES_MAP[chainId]?.v4PositionManagerAddress
}

export function usePositionTokenURI({
  tokenId,
  chainId,
  version,
}: {
  tokenId?: TokenId
  chainId?: EVMUniverseChainId
  version?: ProtocolVersion
}): UsePositionTokenURIResult {
  const managerAddress = getPositionManagerAddress(version ?? ProtocolVersion.V3, chainId)
  const tokenIdArg = tokenId === undefined ? undefined : BigInt(tokenId.toString())

  const { data, isLoading, error } = useReadContract({
    address: assume0xAddress(managerAddress),
    chainId,
    abi: erc721Abi,
    functionName: 'tokenURI',
    args: tokenIdArg === undefined ? undefined : [tokenIdArg],
    query: {
      enabled: tokenId !== undefined && Boolean(chainId) && Boolean(managerAddress),
      // tokenURI is immutable per tokenId;
      // we persist it across sessions.
      meta: { persist: true },
    },
  })

  return useMemo(() => {
    if (error || !tokenId) {
      return {
        valid: false,
        loading: false,
      }
    }
    if (isLoading) {
      return {
        valid: true,
        loading: true,
      }
    }
    if (!data) {
      return {
        valid: false,
        loading: false,
      }
    }

    if (!data.startsWith(STARTS_WITH)) {
      return {
        valid: false,
        loading: false,
      }
    }

    try {
      const json = JSON.parse(atob(data.slice(STARTS_WITH.length)))

      return {
        valid: true,
        loading: false,
        result: json,
      }
    } catch {
      return { valid: false, loading: false }
    }
  }, [error, isLoading, data, tokenId])
}
