import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import {
  addTransactionBreadcrumb,
  getSwapTransactionInfo,
  handleSignatureStep,
  TransactionBreadcrumbStatus,
} from 'state/sagas/transactions/utils'
import { call, put } from 'typed-redux-saga'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { InterfaceEventName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapTradeBaseProperties } from 'uniswap/src/features/telemetry/types'
import { HandledTransactionInterrupt } from 'uniswap/src/features/transactions/errors'
import { addTransaction } from 'uniswap/src/features/transactions/slice'
import { HandleSignatureStepParams } from 'uniswap/src/features/transactions/steps/types'
import { UniswapXSignatureStep } from 'uniswap/src/features/transactions/swap/steps/signOrder'
import { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import {
  QueuedOrderStatus,
  TransactionOriginType,
  TransactionStatus,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

interface HandleUniswapXSignatureStepParams extends HandleSignatureStepParams<UniswapXSignatureStep> {
  trade: UniswapXTrade
  analytics: SwapTradeBaseProperties
}

export function* handleUniswapXSignatureStep(params: HandleUniswapXSignatureStepParams) {
  const { analytics, step, trade, account } = params
  const { quote, routing } = trade.quote
  const orderHash = quote.orderId
  const chainId = trade.inputAmount.currency.chainId

  const analyticsParams: Parameters<typeof formatSwapSignedAnalyticsEventProperties>[0] = {
    trade,
    allowedSlippage: slippageToleranceToPercent(trade.slippageTolerance),
    fiatValues: {
      amountIn: analytics.token_in_amount_usd,
      amountOut: analytics.token_out_amount_usd,
      feeUsd: analytics.fee_usd,
    },
    portfolioBalanceUsd: analytics.total_balances_usd,
    trace: { ...analytics },
  }

  sendAnalyticsEvent(
    InterfaceEventName.UniswapXSignatureRequested,
    formatSwapSignedAnalyticsEventProperties(analyticsParams),
  )

  const signature = yield* call(handleSignatureStep, params)

  if (Date.now() / 1000 > step.deadline) {
    throw new HandledTransactionInterrupt('User signed after deadline')
  }

  const swapInfo = getSwapTransactionInfo(trade)
  addTransactionBreadcrumb({ step, data: { routing, ...swapInfo }, status: TransactionBreadcrumbStatus.InProgress })
  sendAnalyticsEvent(
    SwapEventName.SwapSigned,
    formatSwapSignedAnalyticsEventProperties({
      trade,
      allowedSlippage: slippageToleranceToPercent(trade.slippageTolerance),
      fiatValues: {
        amountIn: analytics.token_in_amount_usd,
        amountOut: analytics.token_out_amount_usd,
        feeUsd: analytics.fee_usd,
      },
      portfolioBalanceUsd: analytics.total_balances_usd,
      trace: { ...analytics },
    }),
  )

  try {
    yield* call(TradingApiClient.submitOrder, { signature, quote, routing })
  } catch (error) {
    sendAnalyticsEvent(InterfaceEventName.UniswapXOrderPostError, {
      ...formatSwapSignedAnalyticsEventProperties(analyticsParams),
      detail: error.message,
    })
    throw error
  }

  sendAnalyticsEvent(
    InterfaceEventName.UniswapXOrderSubmitted,
    formatSwapSignedAnalyticsEventProperties(analyticsParams),
  )
  const transaction: UniswapXOrderDetails = {
    // Use orderHash as the ID to ensure consistency with orders fetched from remote
    // This prevents duplicate orders when the same order is fetched from GraphQL
    id: orderHash,
    routing,
    orderHash,
    chainId,
    from: account.address,
    typeInfo: swapInfo,
    status: TransactionStatus.Pending,
    queueStatus: QueuedOrderStatus.Waiting,
    transactionOriginType: TransactionOriginType.Internal,
    addedTime: Date.now(),
    expiry: step.deadline,
    encodedOrder: trade.quote.quote.encodedOrder,
  }

  yield* put(addTransaction(transaction))

  popupRegistry.addPopup({ type: PopupType.Order, orderHash }, orderHash)
}
