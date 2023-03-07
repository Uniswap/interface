import { createSlice } from '@reduxjs/toolkit'

import { ElasticFarm, UserFarmInfo } from './types'

interface ElasticFarmState {
  [chainId: number]: {
    loading: boolean
    farms: ElasticFarm[] | null
    userFarmInfo?: UserFarmInfo
    poolFeeLast24h: {
      [poolId: string]: number
    }

    failedNFTs: string[]
  }
}

export const defaultChainData = {
  loading: false,
  farms: [],
  poolFeeLast24h: {},
  failedNFTs: [],
} as ElasticFarmState[number]

const initialState: ElasticFarmState = {}

const slice = createSlice({
  name: 'elasticFarm',
  initialState: initialState,
  reducers: {
    setFarms(state, { payload: { farms, chainId } }: { payload: { farms: ElasticFarm[]; chainId: number } }) {
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
      { payload: { userInfo, chainId } }: { payload: { userInfo: UserFarmInfo; chainId: number } },
    ) {
      state[chainId].userFarmInfo = userInfo
    },

    setPoolFeeData(state, { payload: { chainId, data } }) {
      state[chainId].poolFeeLast24h = data
    },

    addFailedNFTs(state, { payload: { chainId, ids } }: { payload: { chainId: number; ids: string[] } }) {
      state[chainId].failedNFTs = ids
    },

    resetErrorNFTs(state, { payload: chainId }: { payload: number }) {
      state[chainId].failedNFTs = []
    },
  },
})

export const { setFarms, setLoading, setUserFarmInfo, setPoolFeeData, addFailedNFTs, resetErrorNFTs } = slice.actions

export default slice.reducer
