import { GasEstimate } from '@universe/api'
import type { JupiterOrderUrlParams } from '@universe/api/src/clients/jupiter/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { type ValidatedTradeInput } from 'uniswap/src/features/transactions/swap/services/tradeService/transformations/buildQuoteRequest'
import { IndicativeTrade, Trade, type UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
export interface TradeWithGasEstimates {
  quoteHash?: string
  trade: Trade | null
  gasEstimate?: GasEstimate
}

export interface TradeService {
  getTrade(input: UseTradeArgs): Promise<TradeWithGasEstimates>
  prepareTradeInput(input?: UseTradeArgs): ValidatedTradeInput | JupiterOrderUrlParams | null // TODO(SWAP-383): Remove JupiterOrderUrlParams from union once Solana trade repo is implemented
  getIndicativeTrade(input: UseTradeArgs): Promise<IndicativeTrade | null>
  prepareIndicativeTradeInput(input?: UseTradeArgs): ValidatedTradeInput | null
}

export function createTradeService(ctx: { serviceByPlatform: Record<Platform, TradeService> }): TradeService {
  function selectServiceFromArgs(args: UseTradeArgs): TradeService {
    const chainId = args.amountSpecified?.currency.chainId
    if (!chainId) {
      return ctx.serviceByPlatform[Platform.EVM]
    }
    return ctx.serviceByPlatform[chainIdToPlatform(chainId)]
  }

  const service: TradeService = {
    prepareTradeInput(args) {
      if (!args) {
        return null
      }
      return selectServiceFromArgs(args).prepareTradeInput(args)
    },
    prepareIndicativeTradeInput(args) {
      if (!args) {
        return null
      }
      return selectServiceFromArgs(args).prepareIndicativeTradeInput(args)
    },
    async getTrade(args) {
      return selectServiceFromArgs(args).getTrade(args)
    },
    async getIndicativeTrade(args) {
      return selectServiceFromArgs(args).getIndicativeTrade(args)
    },
  }
  return service
}
