import { ActionCreatorWithPayload, createAction } from '@reduxjs/toolkit'
import { CalculatorGraphData } from './reducer'

export enum Field {
  STAKE_YEAR = 'STAKE_YEAR',
  TOTAL_LIQUIDITY_PROVIDED_USD = 'TOTAL_LIQUIDITY_PROVIDED_USD',
  TOTAL_STAKED_AMOUNT_CRO = 'TOTAL_STAKED_AMOUNT_CRO'
}

export const resetYieldState = createAction<void>('calculator/resetYieldState')
export const typeInput = createAction<{ field: Field; typedValue: string }>('calculator/typeInputYield')

export const fetchCalculatorGraphData: Readonly<{
  pending: ActionCreatorWithPayload<{ url: string; requestId: string }>
  fulfilled: ActionCreatorWithPayload<{ url: string; graphData: CalculatorGraphData; requestId: string }>
  rejected: ActionCreatorWithPayload<{ url: string; errorMessage: string; requestId: string }>
}> = {
  pending: createAction('calculator/fetchCalculatorGraphData/pending'),
  fulfilled: createAction('calculator/fetchCalculatorGraphData/fulfilled'),
  rejected: createAction('calculator/fetchCalculatorGraphData/rejected')
}
