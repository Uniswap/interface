import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { NEVER_RELOAD, useSingleCallResult } from '../state/multicall/hooks'
import { useV3NFTPositionManagerContract } from './useContract'

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

export function usePositionTokenURI(tokenId: TokenId | undefined): UsePositionTokenURIResult {
  const contract = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => [tokenId instanceof BigNumber ? tokenId.toHexString() : tokenId?.toString(16)], [
    tokenId,
  ])
  const { result, error, loading, valid } = useSingleCallResult(contract, 'tokenURI', inputs, NEVER_RELOAD, 1_600_000)

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
    if (!tokenURI || !tokenURI.startsWith(STARTS_WITH))
      return {
        valid: false,
        loading: false,
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
