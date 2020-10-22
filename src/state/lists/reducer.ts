import { createReducer } from '@reduxjs/toolkit'
import { TokenList } from 'dxswap-sdk'
import { setTokenList } from './actions'

const initialState: TokenList = {
  name: '',
  tokens: []
}

export default createReducer<TokenList>(initialState, builder =>
  builder.addCase(setTokenList, (_state, { payload }) => payload)
)
