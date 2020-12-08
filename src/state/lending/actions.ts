import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk'
import { CToken, CTokenState } from 'data/CToken'

export enum LendField {
  SUPPLY = 'SUPPLY',
  BORROW = 'BORROW',
  WITHDRAW = 'WITHDRAW',
  REPAY = 'REPAY'
}

export const updateLendingToken = createAction<{
  chainId: ChainId
  markets: [CTokenState, CToken | null][]
}>('lending/updateLendingToken')
