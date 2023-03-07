import { createSlice } from '@reduxjs/toolkit'

import { ElasticFarmV2, UserFarmV2Info } from './types'

interface ElasticFarmV2State {
  [chainId: number]: {
    loading: boolean
    // null mean untouch
    farms: ElasticFarmV2[] | null
    userInfo: UserFarmV2Info[] | null
  }
}

export const defaultChainData = {
  loading: false,
  farms: null,
  userInfo: null,
} as ElasticFarmV2State[number]

const initialState: ElasticFarmV2State = {}

const slice = createSlice({
  name: 'elasticFarmV2',
  initialState: initialState,
  reducers: {
    setFarms(state, { payload: { farms, chainId } }: { payload: { farms: ElasticFarmV2[]; chainId: number } }) {
      if (!state[chainId]) {
        state[chainId] = { ...defaultChainData, farms }
      } else state[chainId] = { ...state[chainId], farms }
    },
    setLoading(state, { payload: { loading, chainId } }) {
      if (!state[chainId]) {
        state[chainId] = { ...defaultChainData, loading }
      } else state[chainId] = { ...state[chainId], loading }
    },

    setUserFarmInfo(
      state,
      { payload: { userInfo, chainId } }: { payload: { userInfo: UserFarmV2Info[]; chainId: number } },
    ) {
      state[chainId].userInfo = userInfo
    },
  },
})

export const { setFarms, setLoading, setUserFarmInfo } = slice.actions

export default slice.reducer
