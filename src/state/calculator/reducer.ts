import { createReducer } from '@reduxjs/toolkit'
import { Field, resetYieldState, typeInput, fetchCalculatorGraphData } from './actions'

export interface CalculatorGraphData {
  readonly liquidityProvidedUsd: string
  readonly existingStakeList: {
    readonly stakeCroAmount: string
    readonly existingStakeYear: number
  }[]
  readonly totalCropWeight: string
  readonly allPoolStakedCroAmount: string
  readonly croToUsdRate: string
  readonly totalPoolLiquidityUsd: string
  readonly averageMultiplier: string
}

export interface CalculatorResult {
  originalApyPercent: string
  newApyPercent: string
  annualizedCroRewards: string
}

export interface CalculatorState {
  readonly graphData: CalculatorGraphData
  readonly constants: {
    ratioCroStakedToDailyRewardPoolPercent: number
    minimumDailyRewardPool: number
  }
  readonly [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: string
  readonly [Field.TOTAL_STAKED_AMOUNT_CRO]: string
  readonly [Field.STAKE_YEAR]: string
}

export const initialState: CalculatorState = {
  constants: {
    ratioCroStakedToDailyRewardPoolPercent: 0.1,
    minimumDailyRewardPool: 1000000
  },
  graphData: {
    liquidityProvidedUsd: '0',
    existingStakeList: [],
    totalCropWeight: '0',
    allPoolStakedCroAmount: '54000000',
    croToUsdRate: '0.18',
    totalPoolLiquidityUsd: '75000000',
    averageMultiplier: '1'
  },
  [Field.TOTAL_LIQUIDITY_PROVIDED_USD]: '',
  [Field.TOTAL_STAKED_AMOUNT_CRO]: '',
  [Field.STAKE_YEAR]: '2'
}

export default createReducer<CalculatorState>(initialState, builder =>
  builder
    .addCase(resetYieldState, state => {
      return {
        ...initialState,
        graphData: state.graphData
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      state[field] = typedValue
    })
    .addCase(fetchCalculatorGraphData.pending, (state, { payload: { requestId, url } }) => {
      state
    })
    .addCase(fetchCalculatorGraphData.fulfilled, (state, { payload: { requestId, graphData, url } }) => {
      state.graphData = graphData
    })
    .addCase(fetchCalculatorGraphData.rejected, (state, { payload: { url, requestId, errorMessage } }) => {
      state
    })
)
