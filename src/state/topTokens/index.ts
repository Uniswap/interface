import { ChainId } from '@kyberswap/ks-sdk-core'
import { createSlice } from '@reduxjs/toolkit'

import { TopToken } from './type'

type TopTokenState = {
  [chainId in ChainId]: TopToken[] | undefined
}

const slice = createSlice({
  name: 'topTokens',
  initialState: {} as TopTokenState,
  reducers: {
    updateTopTokens(
      state,
      { payload: { chainId, topTokens } }: { payload: { chainId: ChainId; topTokens: TopToken[] } },
    ) {
      state[chainId] = topTokens
    },
  },
})

export const { updateTopTokens } = slice.actions

export default slice.reducer
