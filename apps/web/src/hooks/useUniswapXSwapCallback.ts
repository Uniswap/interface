import { BigNumber } from '@ethersproject/bignumber'
import { Percent } from '@uniswap/sdk-core'
import {
  DutchOrderBuilder,
  PriorityOrderBuilder,
  V2DutchOrderBuilder,
  V3DutchOrderBuilder,
} from '@uniswap/uniswapx-sdk'
import { SharedQueryClient } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { InterfaceEventName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getCurrencyAddressForAnalytics } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useTotalBalancesUsdForAnalytics } from '~/appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { getConfig } from '~/config'
import { useAccount } from '~/hooks/useAccount'
import { useEthersWeb3Provider } from '~/hooks/useEthersProvider'
import { formatSwapSignedAnalyticsEventProperties } from '~/lib/utils/analytics'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import {
  DutchOrderTrade,
  LimitOrderTrade,
  OffchainOrderType,
  PriorityOrderTrade,
  TradeFillType,
  V2DutchOrderTrade,
  V3DutchOrderTrade,
} from '~/state/routing/types'
import {
  SignatureExpiredError,
  UniswapXv2HardQuoteError,
  UserRejectedRequestError,
  WrongChainError,
} from '~/utils/errors'
import { signTypedData } from '~/utils/signing'
import { didUserReject, swapErrorToUserReadableMessage } from '~/utils/swapErrorToUserReadableMessage'

type DutchAuctionOrderError = { errorCode?: number; detail?: string }
type DutchAuctionOrderSuccess = { hash: string }
type V2DutchAuctionOrderSuccess = {
  orderHash: string
}
type DutchAuctionOrderResponse = DutchAuctionOrderError | DutchAuctionOrderSuccess | V2DutchAuctionOrderSuccess

function isV2DutchAuctionOrderSuccess(response: any): response is V2DutchAuctionOrderSuccess {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  return (response as V2DutchAuctionOrderSuccess).orderHash !== undefined
}

// oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
const isErrorResponse = (res: Response, order: DutchAuctionOrderResponse): order is DutchAuctionOrderError =>
  res.status < 200 || res.status > 202

const UNISWAP_GATEWAY_DNS_URL = getConfig().uniswapGatewayDns

// getUpdatedNonce queries the UniswapX service for the most up-to-date nonce for a user.
// The `nonce` exists as part of the Swap quote response already, but if a user submits back-to-back
// swaps without refreshing the quote (and therefore uses the same nonce), then the subsequent swaps will fail.
//
async function getUpdatedNonce(swapper: string, chainId: number): Promise<BigNumber | null> {
  try {
    // endpoint fetches current nonce
    const res = await fetch(
      `${UNISWAP_GATEWAY_DNS_URL}/nonce?address=${getValidAddress({ address: swapper, chainId, withEVMChecksum: false })}&chainId=${chainId}`,
    )

    const { nonce } = await res.json()
    return BigNumber.from(nonce).add(1)
  } catch (e) {
    logger.error(e, {
      tags: {
        file: 'useUniswapXSwapCallback',
        function: 'getUpdatedNonce',
      },
    })
    return null
  }
}

/**
 * Per-trade-type dispatch to the right uniswapx-sdk
 * builder, applying the fresh nonce when present.
 */
function buildUniswapXSignableOrder({
  trade,
  swapperAddress,
  updatedNonce,
  now,
}: {
  trade: DutchOrderTrade | V2DutchOrderTrade | V3DutchOrderTrade | LimitOrderTrade | PriorityOrderTrade
  swapperAddress: string
  updatedNonce: BigNumber | null
  now: number
}) {
  if (trade instanceof V3DutchOrderTrade) {
    const deadline = now + trade.deadlineBufferSecs
    const order = trade.order
    const updatedOrder = V3DutchOrderBuilder.fromOrder(order)
      .deadline(deadline)
      .nonFeeRecipient(swapperAddress, trade.swapFee?.recipient)
      // If fetching the nonce fails for any reason,
      // default to existing nonce from the Swap quote.
      .nonce(updatedNonce ?? order.info.nonce)
      .buildPartial()
    const { domain, types, values } = updatedOrder.permitData()
    return { deadline, updatedOrder, domain, types, values }
  }
  if (trade instanceof V2DutchOrderTrade) {
    const deadline = now + trade.deadlineBufferSecs
    const order = trade.order
    const updatedOrder = V2DutchOrderBuilder.fromOrder(order)
      .deadline(deadline)
      .nonFeeRecipient(swapperAddress, trade.swapFee?.recipient)
      // If fetching the nonce fails for any reason,
      // default to existing nonce from the Swap quote.
      .nonce(updatedNonce ?? order.info.nonce)
      .buildPartial()
    const { domain, types, values } = updatedOrder.permitData()
    return { deadline, updatedOrder, domain, types, values }
  }
  if (trade instanceof PriorityOrderTrade) {
    const deadline = now + trade.deadlineBufferSecs
    const order = trade.order
    const updatedOrder = PriorityOrderBuilder.fromOrder(order)
      .deadline(deadline)
      .nonFeeRecipient(swapperAddress, trade.swapFee?.recipient)
      // If fetching the nonce fails for any reason,
      // default to existing nonce from the Swap quote.
      .nonce(updatedNonce ?? order.info.nonce)
      .buildPartial()
    const { domain, types, values } = updatedOrder.permitData()
    return { deadline, updatedOrder, domain, types, values }
  }
  // DutchOrderTrade or LimitOrderTrade, both adapt to a DutchOrder
  const startTime = now + trade.startTimeBufferSecs
  const endTime = startTime + trade.auctionPeriodSecs
  const deadline = endTime + trade.deadlineBufferSecs
  const order = trade.asDutchOrderTrade({ nonce: updatedNonce, swapper: swapperAddress }).order
  const updatedOrder = DutchOrderBuilder.fromOrder(order)
    .decayStartTime(startTime)
    .decayEndTime(endTime)
    .deadline(deadline)
    .nonFeeRecipient(swapperAddress, trade.swapFee?.recipient)
    // If fetching the nonce fails for any reason,
    // default to existing nonce from the Swap quote.
    .nonce(updatedNonce ?? order.info.nonce)
    .build()
  const { domain, types, values } = updatedOrder.permitData()
  return { deadline, updatedOrder, domain, types, values }
}

export function useUniswapXSwapCallback({
  trade,
  allowedSlippage,
  fiatValues,
}: {
  trade?: DutchOrderTrade | V2DutchOrderTrade | V3DutchOrderTrade | LimitOrderTrade | PriorityOrderTrade
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number }
  allowedSlippage: Percent
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const accountRef = useRef(account)
  accountRef.current = account

  const { chainId } = useMultichainContext()
  const provider = useEthersWeb3Provider({ chainId })
  const providerRef = useRef(provider)
  providerRef.current = provider

  const analyticsContext = useTrace()
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()
  const isCentralizedPricesEnabled = useFeatureFlag(FeatureFlags.CentralizedPrices)

  return useCallback(async () => {
    // oxlint-disable-next-line no-shadow
    const account = accountRef.current
    // oxlint-disable-next-line no-shadow
    const provider = providerRef.current
    if (account.status !== 'connected') {
      throw new Error('wallet not connected')
    }
    if (!provider) {
      throw new Error('missing provider')
    }
    if (!trade) {
      throw new Error('missing trade')
    }
    const connectedChainId = await provider.getSigner().getChainId()
    if (account.chainId !== connectedChainId || account.chainId !== chainId) {
      throw new WrongChainError()
    }

    const priceSource = getDisplayedPriceSource({
      isCentralizedPricesEnabled,
      surface: 'usdc',
      chainId: trade.inputAmount.currency.chainId,
      address: getCurrencyAddressForAnalytics(trade.inputAmount.currency),
      queryClient: SharedQueryClient,
    })

    sendAnalyticsEvent(
      InterfaceEventName.UniswapXSignatureRequested,
      formatSwapSignedAnalyticsEventProperties({
        trade,
        allowedSlippage,
        fiatValues,
        portfolioBalanceUsd,
        trace: analyticsContext,
        priceSource,
      }),
    )

    try {
      // TODO(limits): WEB-3434 - add error state for missing nonce
      const updatedNonce = await getUpdatedNonce(account.address, trade.inputAmount.currency.chainId)

      const now = Math.floor(Date.now() / 1000)
      const { deadline, updatedOrder, domain, types, values } = buildUniswapXSignableOrder({
        trade,
        swapperAddress: account.address,
        updatedNonce,
        now,
      })

      const signature = await (async () => {
        try {
          // oxlint-disable-next-line no-shadow
          const provider = providerRef.current
          if (!provider) {
            throw new Error('missing provider')
          }
          // oxlint-disable-next-line no-shadow
          const account = accountRef.current
          return await signTypedData({ signer: provider.getSigner(account.address), domain, types, value: values })
        } catch (error) {
          if (didUserReject(error)) {
            throw new UserRejectedRequestError(swapErrorToUserReadableMessage(t, error))
          } else {
            throw error
          }
        }
      })()
      const resultTime = Math.floor(Date.now() / 1000)
      if (deadline < resultTime) {
        sendAnalyticsEvent(InterfaceEventName.UniswapXSignatureDeadlineExpired, {
          ...formatSwapSignedAnalyticsEventProperties({
            trade,
            allowedSlippage,
            fiatValues,
            portfolioBalanceUsd,
            trace: analyticsContext,
            priceSource,
          }),
          deadline,
          resultTime,
        })
        throw new SignatureExpiredError()
      }
      sendAnalyticsEvent(SwapEventName.SwapSigned, {
        ...formatSwapSignedAnalyticsEventProperties({
          trade,
          allowedSlippage,
          fiatValues,
          portfolioBalanceUsd,
          trace: analyticsContext,
          priceSource,
        }),
      })

      const encodedOrder = updatedOrder.serialize()
      let endpoint: string
      let body: Record<string, any>
      // X v2 orders are posted to GPA; X v1 orders are posted to order-service. Their payloads are different.
      if (trade.offchainOrderType === OffchainOrderType.DUTCH_V2_AUCTION) {
        endpoint = 'rfq'
        // Should follow HardQuoteRequestBody schema type: https://github.com/Uniswap/uniswapx-parameterization-api/blob/main/lib/handlers/hard-quote/schema.ts
        body = {
          encodedInnerOrder: encodedOrder,
          innerSig: signature,
          tokenInChainId: updatedOrder.chainId,
          tokenOutChainId: updatedOrder.chainId,
          requestId: trade.requestId,
          quoteId: trade.quoteId,
          forceOpenOrder: trade.forceOpenOrder,
        }
      } else {
        endpoint = trade.offchainOrderType === OffchainOrderType.LIMIT_ORDER ? 'limit-order' : 'order'
        body = {
          encodedOrder,
          orderType: trade.offchainOrderType,
          signature,
          chainId: updatedOrder.chainId,
          quoteId: trade.quoteId,
          requestId: trade.requestId,
        }
      }

      const res = await fetch(`${UNISWAP_GATEWAY_DNS_URL}/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const responseBody = (await res.json()) as DutchAuctionOrderResponse

      // TODO(UniswapX): For now, `errorCode` is not always present in the response, so we have to fallback
      // check for status code and perform this type narrowing.
      if (isErrorResponse(res, responseBody)) {
        sendAnalyticsEvent(InterfaceEventName.UniswapXOrderPostError, {
          ...formatSwapSignedAnalyticsEventProperties({
            trade,
            allowedSlippage,
            fiatValues,
            portfolioBalanceUsd,
            trace: analyticsContext,
            priceSource,
          }),
          errorCode: responseBody.errorCode,
          detail: responseBody.detail,
        })

        // Always retry UniswapX v2 order errors from the UniswapX Parameterization API with classic swap
        if (trade.fillType === TradeFillType.UniswapXv2) {
          throw new UniswapXv2HardQuoteError()
        }

        // TODO(UniswapX): Provide a similar utility to `swapErrorToUserReadableMessage` once
        // backend team provides a list of error codes and potential messages
        throw new Error(`${responseBody.errorCode ?? responseBody.detail ?? 'Unknown error'}`)
      }
      sendAnalyticsEvent(
        InterfaceEventName.UniswapXOrderSubmitted,
        formatSwapSignedAnalyticsEventProperties({
          trade,
          allowedSlippage,
          fiatValues,
          portfolioBalanceUsd,
          trace: analyticsContext,
          priceSource,
        }),
      )

      return {
        type:
          trade.offchainOrderType === OffchainOrderType.DUTCH_V2_AUCTION
            ? (TradeFillType.UniswapXv2 as const)
            : (TradeFillType.UniswapX as const),
        response: {
          orderHash: isV2DutchAuctionOrderSuccess(responseBody) ? responseBody.orderHash : responseBody.hash,
          deadline: updatedOrder.info.deadline,
          encodedOrder,
        },
      }
    } catch (error) {
      if (error instanceof UserRejectedRequestError) {
        throw error
      } else if (error instanceof SignatureExpiredError || error instanceof UniswapXv2HardQuoteError) {
        throw error
      } else {
        throw new Error(swapErrorToUserReadableMessage(t, error))
      }
    }
  }, [
    trade,
    chainId,
    allowedSlippage,
    fiatValues,
    portfolioBalanceUsd,
    analyticsContext,
    t,
    isCentralizedPricesEnabled,
  ])
}
