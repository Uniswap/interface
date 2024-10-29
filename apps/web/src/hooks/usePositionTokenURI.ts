import { BigNumber } from '@ethersproject/bignumber'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useV3NFTPositionManagerContract, useV4NFTPositionManagerContract } from 'hooks/useContract'
import { useEthersProvider } from 'hooks/useEthersProvider'
import JSBI from 'jsbi'
import { NEVER_RELOAD } from 'lib/hooks/multicall'
import multicall from 'lib/state/multicall'
import { useMemo } from 'react'
import { Erc721 } from 'uniswap/src/abis/types/Erc721'
import { NonfungiblePositionManager } from 'uniswap/src/abis/types/v3/NonfungiblePositionManager'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
  chainId?: UniverseChainId,
): NonfungiblePositionManager | Erc721 | null {
  const v3Contract = useV3NFTPositionManagerContract(false, chainId)
  const v4Contract = useV4NFTPositionManagerContract(false, chainId)
  return version === ProtocolVersion.V3 ? v3Contract : v4Contract
}

export function usePositionTokenURI(
  tokenId: TokenId | undefined,
  chainId?: UniverseChainId,
  version?: ProtocolVersion,
): UsePositionTokenURIResult {
  const contract = useNFTPositionManagerContract(version ?? ProtocolVersion.V3, chainId)
  const inputs = useMemo(
    () => [tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)],
    [tokenId],
  )
  const latestBlock = useEthersProvider({ chainId })?.blockNumber
  const { result, error, loading, valid } = multicall.hooks.useSingleCallResult(
    chainId,
    latestBlock,
    contract,
    'tokenURI',
    inputs,
    {
      ...NEVER_RELOAD,
      gasRequired: 3_000_000,
    },
  )

  return useMemo(() => {
    if (error || !valid || !tokenId) {
      return {
        valid: false,
        loading: false,
      }
    }
    if (loading) {
      return {
        valid: true,
        loading: true,
      }
    }
    if (!result) {
      return {
        valid: false,
        loading: false,
      }
    }
    const [tokenURI] = result as [string]
    if (!tokenURI || !tokenURI.startsWith(STARTS_WITH)) {
      return {
        valid: false,
        loading: false,
      }
    }

    try {
      const json = JSON.parse(atob(tokenURI.slice(STARTS_WITH.length)))

      return {
        valid: true,
        loading: false,
        result: json,
      }
    } catch (error) {
      return { valid: false, loading: false }
    }
  }, [error, loading, result, tokenId, valid])
}
