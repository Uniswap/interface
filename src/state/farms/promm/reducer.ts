import { createReducer } from '@reduxjs/toolkit'

import {
  addFailedNFTs,
  resetErrorNFTs,
  setAttemptingTxn,
  setError,
  setLoading,
  setShowConfirm,
  setVestingTxHash,
  updatePrommFarms,
} from './actions'
import { ProMMFarm } from './types'

export interface FarmsState {
  readonly data: { [farmAddress: string]: ProMMFarm[] }
  readonly loading: boolean
  readonly showConfirm: boolean
  readonly attemptingTxn: boolean
  readonly vestingTxHash: string
  readonly error: string
  // List nft can not withdraw because of contract issue
  // https://www.notion.so/kybernetwork/Elastic-Farm-Issue-Product-Changes-High-Priority-d2c086629d1d4332a8e96adfa4295c86
  readonly failedNFTs: string[]
}

const initialState: FarmsState = {
  data: {},
  loading: false,
  showConfirm: false,
  attemptingTxn: false,
  vestingTxHash: '',
  error: '',
  failedNFTs: [],
}

export default createReducer<FarmsState>(initialState, builder =>
  builder
    .addCase(updatePrommFarms, (state, { payload: data }) => {
      return {
        ...state,
        data,
      }
    })
    .addCase(setLoading, (state, { payload: loading }) => {
      return {
        ...state,
        loading,
      }
    })
    .addCase(setShowConfirm, (state, { payload: showConfirm }) => {
      state.showConfirm = showConfirm
    })
    .addCase(setAttemptingTxn, (state, { payload: attemptingTxn }) => {
      state.attemptingTxn = attemptingTxn
    })
    .addCase(setVestingTxHash, (state, { payload: txHash }) => {
      state.vestingTxHash = txHash
    })
    .addCase(setError, (state, { payload: error }) => {
      return {
        ...state,
        error,
      }
    })
    .addCase(addFailedNFTs, (state, { payload: ids }) => {
      state.failedNFTs = [...new Set([...state.failedNFTs, ...ids])]
    })
    .addCase(resetErrorNFTs, state => {
      state.failedNFTs = []
    }),
)
