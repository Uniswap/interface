import { createSlice } from '@reduxjs/toolkit'

export interface TokenPrice {
  // format: [tokenAddress]_[chainId]
  readonly [key: string]: number
}

const slice = createSlice({
  name: 'tokenPrices',
  initialState: {} as TokenPrice,
  reducers: {
    updatePrices(state, { payload }: { payload: Array<{ address: string; chainId: number; price: number }> }) {
      payload.forEach(item => {
        state[item.address + '_' + item.chainId] = item.price
      })
    },
  },
})

export const { updatePrices } = slice.actions

export default slice.reducer
