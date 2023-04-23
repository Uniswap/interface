import { BigNumber } from '@ethersproject/bignumber'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'

import { useLeverageManagerContract, usePoolContract, useV3NFTPositionManagerContract } from './useContract'
import { LeveragePositionDetails } from 'types/leveragePosition'
import { BigNumber as BN } from "bignumber.js"
import { Currency, Field } from '@uniswap/widgets'
import { useCurrency, useToken } from './Tokens'
import { FeeAmount } from '@uniswap/v3-sdk'
import { usePool } from './usePools'


interface UseV3PositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

// hacked
export function useLeveragePositions(leverageManagerAddress: string | undefined, account: string | undefined, currencies: { [field in Field]?: Currency | null }): LeveragePositionDetails[] {
  const leverageManager = useLeverageManagerContract(leverageManagerAddress)
  const { result: positions, loading, error } = useSingleCallResult(leverageManager, 'getAllPositions', [account])
  const { result: r0, loading: l0, error: e0 } = useSingleCallResult(leverageManager, 'token0', [])
  const { result: r1, loading: l1, error: e1 } = useSingleCallResult(leverageManager, 'token1', [])
  const { result: r2, loading: l2, error: e2 } = useSingleCallResult(leverageManager, 'pool', [])
  const poolContract = usePoolContract(r2 ? r2[0] : undefined)
  const { result: r3, loading: l3, error: e3 } = useSingleCallResult(poolContract, 'fee', [])
  const token0 = useToken(r0?.[0])
  const token1 = useToken(r1?.[0])

  

  const inputCurrency = currencies[Field.INPUT]
  const outputCurrency = currencies[Field.OUTPUT]

  const [poolState, pool] = usePool(inputCurrency ?? undefined, outputCurrency ?? undefined, 
    (!l3 && !e3) ? r3?.[0] : undefined
    )

  let args: any = []


  if (positions) {
    positions[0].forEach(
      (pos: any, i: number) => {
        console.log()
        args.push([account, i])
      }
    )
  }
  // console.log("contractPositiosn: ", positions)

  const multiResult= useSingleContractMultipleData(leverageManager, 'userpositions', args)

  // console.log("multiResult1", args, leverageManager, multiResult, loading, error, positions)
  let multiResultLoading = false
  multiResult.forEach((data) => {
    if (data.loading || data.error) {
      multiResultLoading = true
    }
  })

  if (
    multiResultLoading || args.length === 0 || !leverageManager || loading || 
    error || !positions || !inputCurrency?.wrapped || !outputCurrency?.wrapped || 
    !multiResult && ((multiResult as any).length > 0) ||
    l2 || e2 || !r2 || l3 || e3 || !r3
    ) {
    return []
  }

  // console.log("multiResult2", args, leverageManager, multiResult, loading, error, positions)



  const inputCurrencyIsToken0 = inputCurrency?.wrapped.sortsBefore(outputCurrency?.wrapped);


  const formattedPositions = multiResult.map((data: any, i) => {
    let position = positions[0][i]
    // console.log("position:", position)
    // output of trade position
    let outputDecimals = position.isToken0 && inputCurrencyIsToken0 ? inputCurrency?.wrapped.decimals : outputCurrency?.wrapped.decimals
    // input of trade position
    let inputDecimals = position.isToken0 && inputCurrencyIsToken0 ? outputCurrency?.wrapped.decimals : inputCurrency?.wrapped.decimals
    return {
      leverageManagerAddress: leverageManagerAddress ?? undefined,
      pool: pool ?? undefined,
      token0: token0 ?? undefined,
      token1: token1 ?? undefined,
      tokenId: data.result.toString(),
      totalLiquidity: new BN(position.totalPosition.toString()).shiftedBy(-outputDecimals).toFixed(6),
      totalDebt: new BN(position.totalDebt.toString()).shiftedBy(-outputDecimals).toFixed(6),
      totalDebtInput: new BN(position.totalDebtInput.toString()).shiftedBy(-inputDecimals).toFixed(6),
      borrowedLiquidity: new BN(position.borrowedLiq.toString()).shiftedBy(-inputDecimals).toFixed(6),
      creationTick: new BN(position.creationTick).toFixed(0),
      recentPremium: new BN(position.recentPremium.toString()).shiftedBy(-inputDecimals).toFixed(6),
      initialCollateral: new BN(position.initCollateral.toString()).shiftedBy(-inputDecimals).toFixed(6),
      isToken0: position.isToken0,
      openTime: new BN(position.openTime).toFixed(0),
      repayTime: new BN(position.repayTime).toFixed(0),
      tickStart: new BN(position.borrowStartTick).toFixed(0),
      tickFinish: new BN(position.borrowFinishTick).toFixed(0),
    }
  })

  return formattedPositions.filter(position=> Number(position.totalLiquidity.toString())>0)
  // return formattedPositions
}

export enum PositionState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function useLeveragePosition(leverageManagerAddress: string | undefined, account: string | undefined, tokenId: string | undefined): [PositionState, LeveragePositionDetails | undefined] {
  if (!leverageManagerAddress || !account || !tokenId) {
    return [PositionState.LOADING, undefined]
  }
  const leverageManager = useLeverageManagerContract(leverageManagerAddress)
  const { result: r1, loading: l1, error: e1 } = useSingleCallResult(leverageManager, 'token0', [])
  const { result: r2, loading: l2, error: e2 } = useSingleCallResult(leverageManager, 'token1', [])
  const { result: r0, loading: l0, error: e0 } = useSingleCallResult(leverageManager, 'getPosition', [account, tokenId])
  const { result: r3, loading: l3, error: e3 } = useSingleCallResult(leverageManager, 'pool', [])

  const poolContract = usePoolContract(r3 ? r3[0] : undefined)
  const { result: r4, loading: l4, error: e4 } = useSingleCallResult(poolContract, 'fee', [])

  const token0 = useToken(r1?.[0])
  const token1 = useToken(r2?.[0])

  const inputCurrency = useCurrency(r1?.[0])
  const outputCurrency = useCurrency(r2?.[0])

  const [poolState, pool] = usePool(inputCurrency ?? undefined, outputCurrency ?? undefined,
    (!l4 && !e4) ? r4?.[0] : undefined
  )


  let info: [PositionState, LeveragePositionDetails | undefined] = useMemo(() => {
    // fix hack.
    if (l0 || l1 || l2 || l3  || e3|| e0 || e1 || e2 && !r0 && !r1 && !r2 && !r3) {
      return [PositionState.LOADING, undefined]
    }
    const position = (r0 as any)[0]
    const formattedPosition: LeveragePositionDetails =  {
      leverageManagerAddress,
      pool: pool ?? undefined,
      token0: token0 ?? undefined,
      token1: token1 ?? undefined,
      tokenId: tokenId,
      totalLiquidity: new BN(position.totalPosition.toString()).shiftedBy(-18).toFixed(6),
      totalDebt: new BN(position.totalDebt.toString()).shiftedBy(-18).toFixed(6),
      totalDebtInput: new BN(position.totalDebtInput.toString()).shiftedBy(-18).toFixed(6),
      borrowedLiquidity: new BN(position.borrowedLiq.toString()).shiftedBy(-18).toFixed(6),
      creationTick: new BN(position.creationTick).toFixed(0),
      isToken0: position.isToken0,
      openTime: new BN(position.openTime).toFixed(0),
      repayTime: new BN(position.repayTime).toFixed(0),
      tickStart: new BN(position.borrowStartTick).toFixed(0),
      tickFinish: new BN(position.borrowFinishTick).toFixed(0),
      recentPremium: new BN(position.recentPremium.toString()).shiftedBy(-18).toFixed(6),
      initialCollateral: new BN(position.initCollateral.toString()).shiftedBy(-18).toFixed(6),
    }
    return [PositionState.LOADING, formattedPosition]
  }, [leverageManagerAddress, account, tokenId, l1, l0, l2])

  return info
  // export interface LeveragePositionDetails {
  //   tokenId: string
  //   totalLiquidity: string // totalPosition
  //   totalDebt: string // total debt in output token
  //   totalDebtInput: string // total debt in input token
  //   borrowedLiquidity: string
  //   creationTick: string
  //   isToken0: boolean
  //   openTime: string
  //   repayTime: string
  //   tickStart: string // borrowStartTick
  //   tickFinish: string // borrowFinishTick
  // }
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
