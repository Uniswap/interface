export interface Swap {
  timestamp: number
  usdValue: number
  input: SwapInOut
  output: SwapInOut
  maker: string
  transactionHash: string
}

export interface SwapInOut {
  contractAddress: string
  amount: number
  symbol: string
}

export enum SwapAction {
  Buy = 'Bought',
  Sell = 'Sold',
}
