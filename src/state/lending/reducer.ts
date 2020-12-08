import { createReducer } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk'
import { CToken, CTokenState } from 'data/CToken'
import { updateLendingToken } from './actions'

export type LendingState = {
  [chainId in ChainId]: [CTokenState, CToken | null][]
}

export const initialState: LendingState = {
  '1': [],
  '3': [],
  '4': [],
  '5': [],
  '42': []
}

export default createReducer(initialState, builder =>
  builder.addCase(updateLendingToken, (lending, { payload: { chainId, markets } }) => {
    lending[chainId] = markets
  })
)
