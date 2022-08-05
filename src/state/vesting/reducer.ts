import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { RewardLockerVersion } from 'state/farms/types'
import { reportException } from 'utils/sentry'

import {
  setAttemptingTxn,
  setLoading,
  setSchedulesByRewardLocker,
  setShowConfirm,
  setTxHash,
  setVestingError,
} from './actions'

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
      if (error) reportException(error)
      state.error = error ? error?.message : ''
    }),
)
