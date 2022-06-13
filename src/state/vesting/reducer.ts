import { createReducer } from '@reduxjs/toolkit'
import { BigNumber } from '@ethersproject/bignumber'

import { Token } from '@kyberswap/ks-sdk-core'
import {
  setAttemptingTxn,
  setLoading,
  setSchedulesByRewardLocker,
  setShowConfirm,
  setTxHash,
  setVestingError,
} from './actions'
import { RewardLockerVersion } from 'state/farms/types'

export interface VestingState {
  readonly loading: boolean
  readonly schedulesByRewardLocker: {
    [key: string]: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number, RewardLockerVersion][]
  }
  readonly showConfirm: boolean
  readonly attemptingTxn: boolean
  readonly txHash: string
  readonly error: string
}

const initialState: VestingState = {
  loading: false,
  schedulesByRewardLocker: {},
  showConfirm: false,
  attemptingTxn: false,
  txHash: '',
  error: '',
}

export default createReducer<VestingState>(initialState, builder =>
  builder
    .addCase(setLoading, (state, { payload: loading }) => {
      state.loading = loading
    })
    .addCase(setSchedulesByRewardLocker, (state, { payload: schedulesByRewardLocker }) => {
      state.schedulesByRewardLocker = schedulesByRewardLocker
    })
    .addCase(setShowConfirm, (state, { payload: showConfirm }) => {
      state.showConfirm = showConfirm
    })
    .addCase(setAttemptingTxn, (state, { payload: attemptingTxn }) => {
      state.attemptingTxn = attemptingTxn
    })
    .addCase(setTxHash, (state, { payload: txHash }) => {
      state.txHash = txHash
    })
    .addCase(setVestingError, (state, { payload: error }) => {
      state.error = error
    }),
)
