import { BigNumber } from '@ethersproject/bignumber'
import { Currency, CurrencyAmount, Ether, Token, WETH9 } from '@uniswap/sdk-core'
import { KROM } from 'constants/tokens'
import { useMemo } from 'react'
import { Result, useSingleCallResult, useSingleContractMultipleData } from 'state/multicall/hooks'
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
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useV3Positions(account: string | null | undefined): UseV3PositionsResults {
  const limitOrderManager = useLimitOrderManager()

  const { chainId } = useActiveWeb3React()

  const { loading: balanceLoading, result: balanceResult } = useSingleCallResult(limitOrderManager, 'balanceOf', [
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

  const tokenIdResults = useSingleContractMultipleData(limitOrderManager, 'tokenOfOwnerByIndex', tokenIdsArgs)
  const someTokenIdsLoading = useMemo(() => tokenIdResults.some(({ loading }) => loading), [tokenIdResults])

  const tokenIds = useMemo(() => {
    if (account) {
      return tokenIdResults
        .map(({ result }) => result)
        .filter((result): result is Result => !!result)
        .map((result) => BigNumber.from(result[0]))
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
    [account ?? undefined]
  )

  const minBalance = useMemo(() => {
    if (!chainId || !minBalanceResult) return undefined

    return CurrencyAmount.fromRawAmount(KROM[chainId], minBalanceResult?.[0])
  }, [chainId, minBalanceResult])

  const { loading: gasPriceLoading, result: gasPriceResult } = useSingleCallResult(
    limitOrderManager,
    'targetGasPrice',
    [account ?? undefined]
  )

  const gasPrice = useMemo(() => {
    if (!chainId || !gasPriceResult) return undefined

    return CurrencyAmount.fromRawAmount(Ether.onChain(chainId), gasPriceResult?.[0])
  }, [chainId, gasPriceResult])

  return {
    loading:
      someTokenIdsLoading ||
      balanceLoading ||
      positionsLoading ||
      fundingLoading ||
      minBalanceLoading ||
      gasPriceLoading,
    positions,
    fundingBalance,
    minBalance,
    gasPrice,
  }
}
