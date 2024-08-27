import { uniswapReducer } from 'uniswap/src/state/uniswapReducer'

// Utility type to be used inside the uniswap shared package
// Apps and packages should re-define those with a more specific `AppState`
export type UniswapRootState = ReturnType<typeof uniswapReducer>
