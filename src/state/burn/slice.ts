import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  LIQUIDITY = 'LIQUIDITY',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}
export interface BurnState {
  readonly independentField: Field
  readonly typedValue: string
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0',
}

const burnSlice = createSlice({
  name: 'burn',
  initialState,
  reducers: {
    typeInput(state, { payload: { independentField, typedValue } }: PayloadAction<BurnState>) {
      state.independentField = independentField
      state.typedValue = typedValue
    },
  },
})

export const { typeInput } = burnSlice.actions
export default burnSlice.reducer
