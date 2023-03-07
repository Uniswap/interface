import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'
import { captureException } from '@sentry/react'

import { RewardLockerVersion } from 'state/farms/classic/types'

import {
  setAttemptingTxn,
  setLoading,
  setSchedulesByRewardLocker,
  setShowConfirm,
  setTxHash,
  setVestingError,
} from './actions'

interface VestingState {
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
      if (error) {
        const e = new Error('Classic Farm Vesting Error', {
          cause: error,
        })
        e.name = 'VestingError'
        captureException(e, { level: 'error' })
      }
      state.error = error ? error?.message : ''
    }),
)
