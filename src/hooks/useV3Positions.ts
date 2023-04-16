import { BigNumber } from '@ethersproject/bignumber'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'

import { useLeverageManagerContract, useV3NFTPositionManagerContract } from './useContract'
import { LeveragePositionDetails } from 'types/leveragePosition'
import { BigNumber as BN } from "bignumber.js"
import { Currency, Field } from '@uniswap/widgets'


interface UseV3PositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

export function useLeveragePositions(leverageManagerAddress: string | undefined, account: string | undefined, currencies: { [field in Field]?: Currency | null }): LeveragePositionDetails[] {
  const leverageManager = useLeverageManagerContract(leverageManagerAddress)
  const { result: positions, loading, error } = useSingleCallResult(leverageManager, 'getAllPositions', [account])

  const inputCurrency = currencies[Field.INPUT]
  const outputCurrency = currencies[Field.OUTPUT]

  let args: any = []


  if (positions) {
    positions.forEach(
      (pos, i) => {
        args.push([account, i])
      }
    )
  }


  const multiResult= useSingleContractMultipleData(leverageManager, 'userpositions', args)

  if (loading || error || !positions || !inputCurrency?.wrapped || !outputCurrency?.wrapped || multiResult[0].loading || multiResult[0].error || !multiResult[0].result) {
    return []
  }

  const inputCurrencyIsToken0 = inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped);
  // console.log("multiResult:", multiResult)
  // console.log("positions:", positions)
  const formattedPositions = multiResult.map((data: any, i) => {
    let position = positions[i][0]
    console.log("position:", position)
    // output of trade position
    let outputDecimals = position.isToken0 && inputCurrencyIsToken0 ? inputCurrency?.wrapped.decimals : outputCurrency?.wrapped.decimals
    // input of trade position
    let inputDecimals = position.isToken0 && inputCurrencyIsToken0 ? outputCurrency?.wrapped.decimals : inputCurrency?.wrapped.decimals
    return {
      tokenId: data.result.toString(),
      totalLiquidity: new BN(position.totalPosition.toString()).shiftedBy(-outputDecimals).toFixed(6),
      totalDebt: new BN(position.totalDebt.toString()).shiftedBy(-outputDecimals).toFixed(6),
      totalDebtInput: new BN(position.totalDebtInput.toString()).shiftedBy(-inputDecimals).toFixed(6),
      borrowedLiquidity: new BN(position.borrowedLiq.toString()).shiftedBy(-inputDecimals).toFixed(6),
      creationTick: new BN(position.creationTick).toFixed(0),
      isToken0: position.isToken0,
      openTime: new BN(position.openTime).toFixed(0),
      repayTime: new BN(position.repayTime).toFixed(0),
      tickStart: new BN(position.borrowStartTick).toFixed(0),
      tickFinish: new BN(position.borrowFinishTick).toFixed(0),
    }
  })

  return formattedPositions
  // console.log("formattedPositions:", formattedPositions)

}


export enum PositionState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function useLeveragePosition(leverageManagerAddress: string | undefined, account: string | undefined, tokenId: string | undefined): [PositionState, LeveragePositionDetails | undefined] {
  const leverageManager = useLeverageManagerContract(leverageManagerAddress)
  const { result: position, loading, error } = useSingleCallResult(leverageManager, 'getPosition', [account, tokenId])
  if (loading || error || !position) {
    return [PositionState.LOADING, undefined]
  }
  console.log("levposition:", position)
  return [PositionState.LOADING, undefined]
}

function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
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
