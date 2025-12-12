import { SerializedToken } from 'uniswap/src/features/tokens/slice/types'

export interface SerializedPair {
  token0: SerializedToken
  token1: SerializedToken
}

export enum SlippageTolerance {
  Auto = 'auto',
}
