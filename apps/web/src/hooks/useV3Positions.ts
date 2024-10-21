import { BigNumber } from '@ethersproject/bignumber'
import {
  IchiVault,
  SupportedDex,
  UserAmountsInVault,
  getAllUserAmounts,
  getIchiVaultInfo,
} from '@ichidao/ichi-vaults-sdk'
import { useWeb3React } from '@web3-react/core'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { usePendingTransactions } from 'state/transactions/hooks'
import { PositionDetails } from 'types/position'

import { useV3NFTPositionManagerContract } from './useContract'

interface UseV3PositionsResults {
  loading: boolean
  positions?: PositionDetails[]
}

export function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as CallStateResult
        return {
          tokenId,
          fee: result.fee,
          feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
          liquidity: result.liquidity,
          nonce: result.nonce,
          operator: result.operator,
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          token0: result.token0,
          token1: result.token1,
          tokensOwed0: result.tokensOwed0,
          tokensOwed1: result.tokensOwed1,
        }
      })
    }
    return undefined
  }, [loading, error, results, tokenIds])

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
  }
}

interface UseV3PositionResults {
  loading: boolean
  position?: PositionDetails
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()

  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(positionManager, 'balanceOf', [
    account ?? undefined,
  ])

  // we don't expect any account balance to ever exceed the bounds of max safe int
  const accountBalance: number | undefined = balanceResult?.[0]?.toNumber()

  const tokenIdsArgs = useMemo(() => {
    if (accountBalance && account) {
      const tokenRequests = []
      for (let i = 0; i < accountBalance; i++) {
        tokenRequests.push([account, i])
      }
      return tokenRequests
    }
    return []
  }, [account, accountBalance])

  const tokenIdResults = useSingleContractMultipleData(positionManager, 'tokenOfOwnerByIndex', tokenIdsArgs)
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])

  const tokenIds = useMemo(() => {
    if (account) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is CallStateResult => !!result)
        .map((result) => BigNumber.from(result[0]))
    }
    return []
  }, [account, tokenIdResults])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds)

  return {
    loading: someTokenIdsLoading || balanceLoading || positionsLoading,
    positions,
  }
}

export function useV3StakedPositions(
  account: string | null | undefined,
  incentiveIds: string[]
): UseV3PositionsResults {
  const [tokenIds, setTokenIds] = useState<BigNumber[]>([])
  const [tokenIdsLoading, setTokenIdsLoading] = useState(true)
  const incentiveIdsJson = JSON.stringify(incentiveIds)
  const pendingTxs = JSON.stringify(usePendingTransactions())

  useEffect(() => {
    let active = true
    const _incentiveIds = JSON.parse(incentiveIdsJson)
    if (account && account.length > 0 && _incentiveIds.length > 0) {
      setTokenIdsLoading(true)
      ;(async () => {
        try {
          const res = await fetch('https://interface-gateway.ubeswap.org/v1/graphql', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              operationName: 'FarmV3AccountStakes',
              variables: {
                address: account,
                incentiveIds: _incentiveIds,
              },
              query: '',
            }),
          })
          const data = await res.json()
          if (active) {
            setTokenIds(
              [...new Set(data.data.stakes.map((s: { tokenId: string }) => s.tokenId))].map((t) => BigNumber.from(t))
            )
          }
        } catch (e) {
          console.error(e)
        } finally {
          if (active) {
            setTokenIdsLoading(false)
          }
        }
      })()
    } else {
      setTokenIdsLoading(false)
      setTokenIds([])
    }
    return () => {
      active = false
    }
  }, [account, incentiveIdsJson, pendingTxs])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds)

  return {
    loading: tokenIdsLoading || positionsLoading,
    positions,
  }
}

interface UseIchiVaultsResults {
  loading: boolean
  amounts?: (UserAmountsInVault & { vaultInfo: IchiVault })[]
}
export function useIchiVaults(account: string | null | undefined): UseIchiVaultsResults {
  const [data, setData] = useState<(UserAmountsInVault & { vaultInfo: IchiVault })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { provider } = useWeb3React()

  const pendingTxs = JSON.stringify(usePendingTransactions())

  useEffect(() => {
    let active = true
    if (account && account.length > 0 && provider) {
      setIsLoading(true)
      ;(async () => {
        try {
          const dex = SupportedDex.Ubeswap
          let amounts: (UserAmountsInVault & { vaultInfo?: IchiVault })[] = await getAllUserAmounts(
            account,
            provider,
            dex
          )
          amounts = amounts.filter((a) => a.userAmounts.amount0 != '0' && a.userAmounts.amount1 != '0')
          for (const amountInfo of amounts) {
            amountInfo.vaultInfo = await getIchiVaultInfo(42220, dex, amountInfo.vaultAddress)
          }

          if (active) {
            setData(amounts as unknown as (UserAmountsInVault & { vaultInfo: IchiVault })[])
          }
        } catch (e) {
          console.error(e)
        } finally {
          if (active) {
            setIsLoading(false)
          }
        }
      })()
    } else {
      setIsLoading(false)
    }
    return () => {
      active = false
    }
  }, [account, pendingTxs, provider])

  return {
    loading: isLoading,
    amounts: data,
  }
}

export function useIchiVaultDetails(vaultAddress: string | undefined) {
  const [data, setData] = useState<IchiVault>()
  const [isLoading, setIsLoading] = useState(true)
  const { provider } = useWeb3React()

  const pendingTxs = JSON.stringify(usePendingTransactions())

  useEffect(() => {
    let active = true
    if (vaultAddress && provider) {
      setIsLoading(true)
      ;(async () => {
        try {
          const dex = SupportedDex.Ubeswap
          const info = await getIchiVaultInfo(42220, dex, vaultAddress)

          if (active) {
            setData(info)
          }
        } catch (e) {
          console.error(e)
        } finally {
          if (active) {
            setIsLoading(false)
          }
        }
      })()
    } else {
      setIsLoading(false)
    }
    return () => {
      active = false
    }
  }, [vaultAddress, pendingTxs, provider])

  return {
    loading: isLoading,
    info: data,
  }
}
