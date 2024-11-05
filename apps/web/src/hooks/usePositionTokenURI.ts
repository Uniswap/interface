import { BigNumber } from '@ethersproject/bignumber'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useEthersProvider } from 'hooks/useEthersProvider'
import JSBI from 'jsbi'
import { NEVER_RELOAD } from 'lib/hooks/multicall'
import multicall from 'lib/state/multicall'
import { useMemo } from 'react'
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

export function usePositionTokenURI(
  tokenId: TokenId | undefined,
  chainId?: UniverseChainId,
): UsePositionTokenURIResult {
  const contract = useV3NFTPositionManagerContract(false, chainId)
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
