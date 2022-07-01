import { BigNumber } from '@ethersproject/bignumber'
import { createReducer } from '@reduxjs/toolkit'

import { fetchData, fetchDataSuccess, fetchDataWithSignerSuccess } from './actions'

export enum Status {
  INITIAL = 'INITIAL',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  PENDING = 'PENDING',
}

export interface IXttPresaleState {
  token: string
  privateSaleStartTimestamp: number
  privateSaleEndTimestamp: number
  hardCapEthAmount: string
  totalDepositedEthBalance: string
  minimumDepositEthAmount: string
  maximumDepositEthAmount: string
  tokenPerETH: string
  claimEnabledStart: number // timestamp
  totalBought: string
  totalClaimed: string
  bonus: number
  deposits: string
  balanceOf: string
  status: Status
  statusWithSigner: Status
}

export interface IXttPresaleFormattedState
  extends Omit<
    IXttPresaleState,
    | 'hardCapEthAmount'
    | 'totalDepositedEthBalance'
    | 'minimumDepositEthAmount'
    | 'maximumDepositEthAmount'
    | 'tokenPerETH'
    | 'totalBought'
    | 'totalClaimed'
    | 'deposits'
    | 'balanceOf'
  > {
  hardCapEthAmount: BigNumber
  totalDepositedEthBalance: BigNumber
  minimumDepositEthAmount: BigNumber
  maximumDepositEthAmount: BigNumber
  tokenPerETH: BigNumber
  totalBought: BigNumber
  totalClaimed: BigNumber
  deposits: BigNumber
  balanceOf: BigNumber
}

export type DataWithSigner = 'balanceOf' | 'deposits' | 'statusWithSigner'

export const initialState: IXttPresaleState = {
  balanceOf: '',
  claimEnabledStart: 0,
  deposits: '',
  hardCapEthAmount: '',
  maximumDepositEthAmount: '',
  minimumDepositEthAmount: '',
  privateSaleEndTimestamp: 0,
  privateSaleStartTimestamp: 0,
  tokenPerETH: '',
  totalBought: '',
  totalClaimed: '',
  totalDepositedEthBalance: '',
  token: '',
  bonus: 0,
  status: Status.INITIAL,
  statusWithSigner: Status.INITIAL,
}

export default createReducer<IXttPresaleState>(initialState, (builder) =>
  builder
    .addCase(fetchData, (state) => ({
      ...state,
      status: Status.PENDING,
    }))
    .addCase(fetchDataSuccess, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
    .addCase(fetchDataWithSignerSuccess, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
)
