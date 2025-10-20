import { BigNumber } from '@ethersproject/bignumber'
import { useQuery } from '@tanstack/react-query'
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useV3NFTPositionManagerContract, useV4NFTPositionManagerContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { Erc721 } from 'uniswap/src/abis/types/Erc721'
import { NonfungiblePositionManager } from 'uniswap/src/abis/types/v3/NonfungiblePositionManager'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type TokenId = number | JSBI | BigNumber

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

function useNFTPositionManagerContract(
  version: ProtocolVersion,
  chainId?: EVMUniverseChainId,
): NonfungiblePositionManager | Erc721 | null {
  const v3Contract = useV3NFTPositionManagerContract(false, chainId)
  const v4Contract = useV4NFTPositionManagerContract(false, chainId)
  return version === ProtocolVersion.V3 ? v3Contract : v4Contract
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
  const contract = useNFTPositionManagerContract(version ?? ProtocolVersion.V3, chainId)
  const { data, isLoading, error } = useQuery({
    queryKey: [ReactQueryCacheKey.PositionTokenURI, tokenId, chainId, version],
    queryFn: async () => {
      const input = tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)
      if (!input) {
        return null
      }
      return await contract?.tokenURI(input)
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

    if (!data || !data.startsWith(STARTS_WITH)) {
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
    } catch (_error) {
      return { valid: false, loading: false }
    }
  }, [error, isLoading, data, tokenId])
}
