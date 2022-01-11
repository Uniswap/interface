import { createMulticall } from '@uniswap/redux-multicall'
import { combineReducers, createStore } from 'redux'

export const multicall = createMulticall()
const reducer = combineReducers({ [multicall.reducerPath]: multicall.reducer })
export const store = createStore(reducer)

export default multicall
