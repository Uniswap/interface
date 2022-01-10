import { createMulticall } from '@uniswap/redux-multicall'
import { createStore } from 'redux'

export const multicall = createMulticall()
export const store = createStore(multicall.reducer)

export default multicall
