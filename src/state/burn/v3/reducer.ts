import { createReducer } from '@reduxjs/toolkit'

import { selectPercent } from './actions'

interface BurnV3State {
  readonly percent: number
}

const initialState: BurnV3State = {
  percent: 0,
}

export default createReducer<BurnV3State>(initialState, (builder) =>
  builder.addCase(selectPercent, (state, { payload: { percent } }) => {
    return {
      ...state,
      percent,
    }
  })
)
