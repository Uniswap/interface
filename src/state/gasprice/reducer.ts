import { createReducer } from '@reduxjs/toolkit'
import { newEstimate } from './actions'
import { utils } from 'ethers'

export interface GasPrice {
  fast: string
}

export const initialState: GasPrice = { fast: utils.parseEther('0.00000002').toString() }

export default createReducer(initialState, (builder) =>
  builder.addCase(newEstimate, (gasprice, { payload: { fast } }) => {
    gasprice.fast = fast
  })
)
