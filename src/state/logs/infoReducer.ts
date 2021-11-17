/* eslint-disable no-param-reassign */
import { createReducer } from '@reduxjs/toolkit'
import { createAction } from '@reduxjs/toolkit'

export const updateProtocolData = createAction<{ protocolData: any }>('info/protocol/updateProtocolData')
export const updateProtocolChartData = createAction<{ chartData: any[] }>(
  'info/protocol/updateProtocolChartData',
)
export const updateProtocolTransactions = createAction<{ transactions: any[] }>(
  'info/protocol/updateProtocolTransactions',
)

export const updatePoolData = createAction<{ pools: any[] }>('info/pools/updatePoolData')
export const addPoolKeys = createAction<{ poolAddresses: string[] }>('info/pools/addPoolKeys')
export const updatePoolChartData = createAction<{ poolAddress: string; chartData: any[] }>(
  'info/pools/updatePoolChartData',
)
export const updatePoolTransactions = createAction<{ poolAddress: string; transactions: any[] }>(
  'info/pools/updatePoolTransactions',
)

export const updateTokenData = createAction<{ tokens: any[] }>('info/tokens/updateTokenData')
export const addTokenKeys = createAction<{ tokenAddresses: string[] }>('info/tokens/addTokenKeys')
export const addTokenPoolAddresses = createAction<{ tokenAddress: string; poolAddresses: string[] }>(
  'info/tokens/addTokenPoolAddresses',
)
export const updateTokenChartData = createAction<{ tokenAddress: string; chartData: any[] }>(
  'info/tokens/updateTokenChartData',
)
export const updateTokenTransactions = createAction<{ tokenAddress: string; transactions: any[] }>(
  'info/tokens/updateTokenTransactions',
)
export const updateTokenPriceData = createAction<{
  tokenAddress: string
  secondsInterval: number
  priceData?: any[]
  oldestFetchedTimestamp: number
}>('info/tokens/updateTokenPriceData')

const initialState: any = {
  protocol: {
    overview: undefined,
    chartData: undefined,
    transactions: undefined,
  },
  pools: { byAddress: {} },
  tokens: { byAddress: {} },
}

export default createReducer(initialState, (builder) =>
  builder
    // Tokens actions
    .addCase(updateTokenData, (state, { payload: { tokens } }) => {
      tokens.forEach((tokenData) => {
        state.tokens.byAddress[tokenData.address] = {
          ...state.tokens.byAddress[tokenData.address],
          data: tokenData,
        }
      })
    })
    .addCase(addTokenKeys, (state, { payload: { tokenAddresses } }) => {
      tokenAddresses.forEach((address) => {
        if (!state.tokens.byAddress[address]) {
          state.tokens.byAddress[address] = {
            poolAddresses: undefined,
            data: undefined,
            chartData: undefined,
            priceData: {},
            transactions: undefined,
          }
        }
      })
    })
    .addCase(addTokenPoolAddresses, (state, { payload: { tokenAddress, poolAddresses } }) => {
      state.tokens.byAddress[tokenAddress] = { ...state.tokens.byAddress[tokenAddress], poolAddresses }
    })
    .addCase(updateTokenChartData, (state, { payload: { tokenAddress, chartData } }) => {
      state.tokens.byAddress[tokenAddress] = { ...state.tokens.byAddress[tokenAddress], chartData }
    })
    .addCase(updateTokenTransactions, (state, { payload: { tokenAddress, transactions } }) => {
      state.tokens.byAddress[tokenAddress] = { ...state.tokens.byAddress[tokenAddress], transactions }
    })
    .addCase(
      updateTokenPriceData,
      (state, { payload: { tokenAddress, secondsInterval, priceData, oldestFetchedTimestamp } }) => {
        state.tokens.byAddress[tokenAddress] = {
          ...state.tokens.byAddress[tokenAddress],
          priceData: {
            ...state.tokens.byAddress[tokenAddress].priceData,
            [secondsInterval]: priceData,
            oldestFetchedTimestamp,
          },
        }
      },
    ),
)
