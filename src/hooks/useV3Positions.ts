import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import LIMIT_ABI from 'abis/limit-order-manager.json'
import { KROM } from 'constants/tokens'
import { useEffect, useMemo, useState } from 'react'
import { useLogs } from 'state/logs/hooks'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
import { useNetworkGasPrice } from 'state/user/hooks'
import { PositionDetails } from 'types/position'

import { useLimitOrderManager } from './useContract'
import { useActiveWeb3React } from './web3'

interface UseV3PositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
  fundingBalance: CurrencyAmount<Token> | undefined
  minBalance: CurrencyAmount<Token> | undefined
  gasPrice: CurrencyAmount<Currency> | undefined
}

const LimitOrderManagerInterface = new Interface(LIMIT_ABI)

function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  const limitOrderManager = useLimitOrderManager()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(limitOrderManager, 'orders', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as Result
        return {
          owner: result.owner,
          tokenId,
          token0: result.token0,
          token1: result.token1,
          fee: result.fee,
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          liquidity: result.liquidity,
          opened: result.opened,
          processed: result.processed,
          tokensOwed0: result.tokensOwed0,
          tokensOwed1: result.tokensOwed1,
        }
      })
    }
    return undefined
  }, [loading, error, tokenIds, results])

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
    fundingBalance: undefined,
    minBalance: undefined,
    gasPrice: undefined,
  }
}

interface UseV3PositionResults {
  loading: boolean
  position: PositionDetails | undefined
  createdLogs: LimitOrderLogs | undefined
  processedLogs: LimitOrderLogs | undefined
  cancelledLogs: LimitOrderLogs | undefined
  collectedLogs: LimitOrderLogs | undefined
}

interface LimitOrderLogs {
  transactionHash: string
  blockHash: string
  event: Result
}

/**
 * Position created events to get data emitted from
 * new limit order created.
 */
function usePositionCreatedLogs(
  contract: Contract | null,
  tokenId: BigNumber | undefined,
  account: string | null | undefined
): LimitOrderLogs[] | undefined {
  // create filters for
  const filter = useMemo(() => contract?.filters?.LimitOrderCreated(account, tokenId), [account])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log) => {
        const parsed = LimitOrderManagerInterface.parseLog(log).args
        return {
          transactionHash: log.transactionHash,
          blockHash: log.blockHash,
          parsed,
        }
      })
      ?.map((parsed) => {
        let transactionHash!: string
        let blockHash!: string
        let event!: Result
        try {
          transactionHash = parsed.transactionHash
          blockHash = parsed.blockHash
          event = parsed.parsed
        } catch (error) {
          // replace invalid UTF-8 in the description with replacement characters
        }
        return {
          transactionHash,
          blockHash,
          event,
        }
      })
  }, [useLogsResult])
}

/**
 * Position created events to get data emitted from
 * order processed.
 */
function usePositionProcessedLogs(
  contract: Contract | null,
  tokenId: BigNumber | undefined,
  account: string | null | undefined
): LimitOrderLogs[] | undefined {
  // create filters for
  const filter = useMemo(() => contract?.filters?.LimitOrderProcessed(account, tokenId), [account])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log) => {
        const parsed = LimitOrderManagerInterface.parseLog(log).args
        return {
          transactionHash: log.transactionHash,
          blockHash: log.blockHash,
          parsed,
        }
      })
      ?.map((parsed) => {
        let transactionHash!: string
        let event!: Result
        let blockHash!: string
        try {
          transactionHash = parsed.transactionHash
          event = parsed.parsed
          blockHash = parsed.blockHash
        } catch (error) {
          // replace invalid UTF-8 in the description with replacement characters
        }
        return {
          transactionHash,
          blockHash,
          event,
        }
      })
  }, [useLogsResult])
}

function usePositionCancelledLogs(
  contract: Contract | null,
  tokenId: BigNumber | undefined,
  account: string | null | undefined
): LimitOrderLogs[] | undefined {
  // create filters for
  const filter = useMemo(() => contract?.filters?.LimitOrderCancelled(account, tokenId), [account])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log) => {
        const parsed = LimitOrderManagerInterface.parseLog(log).args
        return {
          transactionHash: log.transactionHash,
          blockHash: log.blockHash,
          parsed,
        }
      })
      ?.map((parsed) => {
        let transactionHash!: string
        let event!: Result
        let blockHash!: string
        try {
          transactionHash = parsed.transactionHash
          event = parsed.parsed
          blockHash = parsed.blockHash
        } catch (error) {
          // replace invalid UTF-8 in the description with replacement characters
        }
        return {
          transactionHash,
          blockHash,
          event,
        }
      })
  }, [useLogsResult])
}

/**
 * Position created events to get data emitted from
 * order processed.
 */
function usePositionCollectedLogs(
  contract: Contract | null,
  tokenId: BigNumber | undefined,
  account: string | null | undefined
): LimitOrderLogs[] | undefined {
  // create filters for
  const filter = useMemo(() => contract?.filters?.LimitOrderCollected(account, tokenId), [account])

  const useLogsResult = useLogs(filter)

  return useMemo(() => {
    return useLogsResult?.logs
      ?.map((log) => {
        const parsed = LimitOrderManagerInterface.parseLog(log).args
        return {
          transactionHash: log.transactionHash,
          blockHash: log.blockHash,
          parsed,
        }
      })
      ?.map((parsed) => {
        let transactionHash!: string
        let event!: Result
        let blockHash!: string
        try {
          transactionHash = parsed.transactionHash
          event = parsed.parsed
          blockHash = parsed.blockHash
        } catch (error) {
          // replace invalid UTF-8 in the description with replacement characters
        }
        return {
          transactionHash,
          blockHash,
          event,
        }
      })
  }, [useLogsResult])
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const { account } = useActiveWeb3React()

  const position = useV3PositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  const limitOrderManager = useLimitOrderManager()

  const accountPosition = useMemo(() => {
    if (!position || !position.positions?.[0]) return account

    return position.positions?.[0].owner
  }, [position, account])

  const positionCreatedLogs = usePositionCreatedLogs(limitOrderManager, tokenId, accountPosition)
  const positionProcessedLogs = usePositionProcessedLogs(limitOrderManager, tokenId, accountPosition)
  const positionCancelledLogs = usePositionCancelledLogs(limitOrderManager, tokenId, accountPosition)
  const positionCollectedLogs = usePositionCollectedLogs(limitOrderManager, tokenId, accountPosition)

  return useMemo(() => {
    return {
      loading: position.loading,
      position: position.positions?.[0],
      createdLogs: positionCreatedLogs?.[0],
      processedLogs: positionProcessedLogs?.[0],
      cancelledLogs: positionCancelledLogs?.[0],
      collectedLogs: positionCollectedLogs?.[0],
    }
  }, [
    position.loading,
    position.positions,
    positionCreatedLogs,
    positionProcessedLogs,
    positionCancelledLogs,
    positionCollectedLogs,
  ])
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const limitOrderManager = useLimitOrderManager()
  const { chainId } = useActiveWeb3React()

  const gasPrice = useNetworkGasPrice()

  const { loading: balanceLoading, result: tokenIdResults } = useSingleCallResult(limitOrderManager, 'tokensOfOwner', [
    account ?? undefined,
  ])

  const tokenIds = useMemo(() => {
    if (tokenIdResults && account) {
      const tokenRequests = []
      const tokens = tokenIdResults?.ownerTokens
      for (let i = 0; i < tokens.length; i++) {
        tokenRequests.push(tokens[i]?.toNumber())
      }
      return tokenRequests
    }
    return []
  }, [account, tokenIdResults])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds)

  const { loading: fundingLoading, result: fundingResult } = useSingleCallResult(limitOrderManager, 'funding', [
    account ?? undefined,
  ])

  const fundingBalance = useMemo(() => {
    if (!chainId || !fundingResult) return undefined

    return CurrencyAmount.fromRawAmount(KROM[chainId], fundingResult?.[0])
  }, [chainId, fundingResult])

  const { loading: minBalanceLoading, result: minBalanceResult } = useSingleCallResult(
    limitOrderManager,
    'serviceFee',
    [account ?? undefined, gasPrice?.quotient.toString() ?? undefined]
  )

  const minBalance = useMemo(() => {
    if (!chainId || !minBalanceResult) return undefined

    return CurrencyAmount.fromRawAmount(KROM[chainId], minBalanceResult?.[0])
  }, [chainId, minBalanceResult])

  return {
    loading: balanceLoading || positionsLoading || fundingLoading || minBalanceLoading,
    positions,
    fundingBalance,
    minBalance,
    gasPrice,
  }
}
