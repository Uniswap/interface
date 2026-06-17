import type { TransactionResponse } from '@ethersproject/abstract-provider'
import type { BigNumber } from '@ethersproject/bignumber'

/** How a quoted swap / order is executed (on-chain classic vs UniswapX variants). */
export enum TradeFillType {
  Classic = 'classic', // Uniswap V1, V2, and V3 trades with on-chain routes
  UniswapX = 'uniswap_x', // off-chain trades, no routes
  UniswapXv2 = 'uniswap_x_v2',
  UniswapXv3 = 'uniswap_x_v3',
  None = 'none', // for preview trades, cant be used for submission
}

/** Outcome of submitting a limit order (classic tx or UniswapX off-chain order). */
export type LimitOrderResult =
  | {
      type: TradeFillType.Classic
      response: TransactionResponse
      deadline?: BigNumber
    }
  | {
      type: TradeFillType.UniswapX | TradeFillType.UniswapXv2
      response: {
        orderHash: string
        deadline: number
        encodedOrder: string
      }
    }
