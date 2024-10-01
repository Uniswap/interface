import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { PopupType, addPopup } from 'state/application/reducer'
import { HandleSignatureStepParams, getSwapTransactionInfo, handleSignatureStep } from 'state/sagas/transactions/utils'
import { addSignature } from 'state/signatures/reducer'
import { SignatureType, UnfilledUniswapXOrderDetails } from 'state/signatures/types'
import { call, put } from 'typed-redux-saga'
import { UniswapXOrderStatus } from 'types/uniswapx'
import { submitOrder } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getBaseTradeAnalyticsProperties } from 'uniswap/src/features/transactions/swap/analytics'
import { UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { UniswapXSignatureStep } from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { percentFromFloat } from 'utilities/src/format/percent'
import { logger } from 'utilities/src/logger/logger'

interface HandleUniswapXSignatureStepParams extends HandleSignatureStepParams<UniswapXSignatureStep> {
  trade: UniswapXTrade
  analytics: ReturnType<typeof getBaseTradeAnalyticsProperties>
}
export function* handleUniswapXSignatureStep(params: HandleUniswapXSignatureStepParams) {
  const { trade, analytics } = params
  const quote = trade.quote.quote
  const orderHash = quote.orderId
  const chainId = trade.inputAmount.currency.chainId
  const signatureDetails = getUniswapXSignatureInfo(params.step, trade, chainId)

  const analyticsParams: Parameters<typeof formatSwapSignedAnalyticsEventProperties>[0] = {
    trade,
    allowedSlippage: percentFromFloat(trade.slippageTolerance),
    fiatValues: {
      amountIn: analytics.token_in_amount_usd,
      amountOut: analytics.token_out_amount_usd,
      feeUsd: analytics.fee_usd,
    },
    portfolioBalanceUsd: analytics.total_balances_usd,
  }

  try {
    const signature = yield* call(handleSignatureStep, params)

    sendAnalyticsEvent(
      InterfaceEventNameLocal.UniswapXSignatureRequested,
      formatSwapSignedAnalyticsEventProperties(analyticsParams),
    )

    yield* call(submitOrder, { signature, quote, routing: trade.routing })

    sendAnalyticsEvent(
      InterfaceEventNameLocal.UniswapXOrderSubmitted,
      formatSwapSignedAnalyticsEventProperties(analyticsParams),
    )

    yield* put(addSignature(signatureDetails))

    yield* put(addPopup({ content: { type: PopupType.Order, orderHash }, key: orderHash }))
  } catch (e) {
    // TODO(WEB-4921): pass errors to onFailure and to handle in UI
    logger.error(e, { tags: { file: 'uniswapx', function: 'handleUniswapXSignatureStep' } })

    sendAnalyticsEvent(InterfaceEventNameLocal.UniswapXOrderPostError, {
      ...formatSwapSignedAnalyticsEventProperties(analyticsParams),
      detail: e.message,
    })
  }
}

function getUniswapXSignatureInfo(
  step: UniswapXSignatureStep,
  trade: UniswapXTrade,
  chainId: UniverseChainId,
): UnfilledUniswapXOrderDetails {
  const swapInfo = getSwapTransactionInfo(trade)

  return {
    type: SignatureType.SIGN_UNISWAPX_V2_ORDER,
    id: step.quote.orderId,
    addedTime: Date.now(),
    chainId,
    offerer: trade.quote.quote.orderInfo.reactor,
    orderHash: trade.quote.quote.orderId,
    status: UniswapXOrderStatus.OPEN,
    swapInfo,
  }
}
