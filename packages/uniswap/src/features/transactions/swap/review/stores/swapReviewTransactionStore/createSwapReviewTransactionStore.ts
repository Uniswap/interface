import { TradingApi } from '@universe/api'
import type { Warning, WarningWithStyle } from 'uniswap/src/components/modals/WarningModal/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import type { SwapTxStoreState } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import type { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import type { IndicativeTrade, Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import type {
  FeeOnTransferFeeGroupProps,
  TokenWarningProps,
} from 'uniswap/src/features/transactions/TransactionDetails/types'
import { isDevEnv } from 'utilities/src/environment/env'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type SwapReviewTransactionStore = UseBoundStore<StoreApi<SwapReviewTransactionState>>

export type SwapReviewTransactionState = {
  trade: Trade | undefined
  indicativeTrade: IndicativeTrade | undefined
  acceptedTrade: Trade | undefined
  swapTxContext: SwapTxStoreState
  gasFee: GasFeeResult
  uniswapXGasBreakdown: UniswapXGasBreakdown | undefined
  derivedSwapInfo: DerivedSwapInfo
  acceptedDerivedSwapInfo: DerivedSwapInfo | undefined
  isWrap: boolean
  blockingWarning: Warning | undefined
  reviewScreenWarning: WarningWithStyle | undefined
  txSimulationErrors: TradingApi.TransactionFailureReason[] | undefined
  newTradeRequiresAcceptance: boolean
  feeOnTransferProps: FeeOnTransferFeeGroupProps | undefined
  tokenWarningProps: TokenWarningProps
  currencyInInfo: Maybe<CurrencyInfo>
  currencyOutInfo: Maybe<CurrencyInfo>
  chainId: UniverseChainId | undefined
}

export const createSwapReviewTransactionStore = (
  initialState: SwapReviewTransactionState,
): SwapReviewTransactionStore =>
  create<SwapReviewTransactionState>()(
    devtools(() => initialState, {
      name: 'useSwapReviewTransactionStore',
      enabled: isDevEnv(),
      trace: true,
      traceLimit: 25,
    }),
  )
