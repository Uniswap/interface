import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { CustomUserProperties, SwapEventName } from '@uniswap/analytics-events'
import { PermitTransferFrom } from '@uniswap/permit2-sdk'
import { Percent } from '@uniswap/sdk-core'
import {
  DutchOrder,
  DutchOrderBuilder,
  PriorityOrderBuilder,
  UnsignedPriorityOrder,
  UnsignedV2DutchOrder,
  V2DutchOrderBuilder,
} from '@uniswap/uniswapx-sdk'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import {
  DutchOrderTrade,
  LimitOrderTrade,
  OffchainOrderType,
  PriorityOrderTrade,
  TradeFillType,
  V2DutchOrderTrade,
} from 'state/routing/types'
import { trace } from 'tracing/trace'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import {
  SignatureExpiredError,
  UniswapXv2HardQuoteError,
  UserRejectedRequestError,
  WrongChainError,
} from 'utils/errors'
import { signTypedData } from 'utils/signing'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { getWalletMeta } from 'utils/walletMeta'

type DutchAuctionOrderError = { errorCode?: number; detail?: string }
type DutchAuctionOrderSuccess = { hash: string }
type V2DutchAuctionOrderSuccess = {
  orderHash: string
}
type DutchAuctionOrderResponse = DutchAuctionOrderError | DutchAuctionOrderSuccess | V2DutchAuctionOrderSuccess

function isV2DutchAuctionOrderSuccess(response: any): response is V2DutchAuctionOrderSuccess {
  return (response as V2DutchAuctionOrderSuccess).orderHash !== undefined
}

const isErrorResponse = (res: Response, order: DutchAuctionOrderResponse): order is DutchAuctionOrderError =>
  res.status < 200 || res.status > 202

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

// getUpdatedNonce queries the UniswapX service for the most up-to-date nonce for a user.
// The `nonce` exists as part of the Swap quote response already, but if a user submits back-to-back
// swaps without refreshing the quote (and therefore uses the same nonce), then the subsequent swaps will fail.
//
async function getUpdatedNonce(swapper: string, chainId: number): Promise<BigNumber | null> {
  try {
    // endpoint fetches current nonce
    const res = await fetch(`${UNISWAP_GATEWAY_DNS_URL}/nonce?address=${swapper.toLowerCase()}&chainId=${chainId}`)
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

export function useUniswapXSwapCallback({
  trade,
  allowedSlippage,
  fiatValues,
}: {
  trade?: DutchOrderTrade | V2DutchOrderTrade | LimitOrderTrade | PriorityOrderTrade
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

  return useCallback(
    () =>
      trace({ name: 'Swap (Dutch)', op: 'swap.x.dutch' }, async (trace) => {
        const account = accountRef.current
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

        sendAnalyticsEvent(
          InterfaceEventNameLocal.UniswapXSignatureRequested,
          formatSwapSignedAnalyticsEventProperties({
            trade,
            allowedSlippage,
            fiatValues,
            portfolioBalanceUsd,
            trace: analyticsContext,
          }),
        )

        try {
          // TODO(limits): WEB-3434 - add error state for missing nonce
          const updatedNonce = await getUpdatedNonce(account.address, trade.inputAmount.currency.chainId)

          const now = Math.floor(Date.now() / 1000)
          let deadline: number
          let domain: TypedDataDomain
          let types: Record<string, TypedDataField[]>
          let values: PermitTransferFrom
          let updatedOrder: DutchOrder | UnsignedV2DutchOrder | UnsignedPriorityOrder

          if (trade instanceof V2DutchOrderTrade) {
            deadline = now + trade.deadlineBufferSecs

            const order: UnsignedV2DutchOrder = trade.order
            updatedOrder = V2DutchOrderBuilder.fromOrder(order)
              .deadline(deadline)
              .nonFeeRecipient(account.address, trade.swapFee?.recipient)
              // if fetching the nonce fails for any reason, default to existing nonce from the Swap quote.
              .nonce(updatedNonce ?? order.info.nonce)
              .buildPartial()
            ;({ domain, types, values } = updatedOrder.permitData())
          } else if (trade instanceof PriorityOrderTrade) {
            deadline = now + trade.deadlineBufferSecs

            const order = trade.order
            updatedOrder = PriorityOrderBuilder.fromOrder(order)
              .deadline(deadline)
              .nonFeeRecipient(account.address, trade.swapFee?.recipient)
              // if fetching the nonce fails for any reason, default to existing nonce from the Swap quote.
              .nonce(updatedNonce ?? order.info.nonce)
              .buildPartial()
            ;({ domain, types, values } = updatedOrder.permitData())
          } else {
            const startTime = now + trade.startTimeBufferSecs
            const endTime = startTime + trade.auctionPeriodSecs
            deadline = endTime + trade.deadlineBufferSecs

            const order = trade.asDutchOrderTrade({ nonce: updatedNonce, swapper: account.address }).order
            updatedOrder = DutchOrderBuilder.fromOrder(order)
              .decayStartTime(startTime)
              .decayEndTime(endTime)
              .deadline(deadline)
              .nonFeeRecipient(account.address, trade.swapFee?.recipient)
              // if fetching the nonce fails for any reason, default to existing nonce from the Swap quote.
              .nonce(updatedNonce ?? order.info.nonce)
              .build()
            ;({ domain, types, values } = updatedOrder.permitData())

            trace.setData('startTime', startTime)
            trace.setData('endTime', endTime)
          }
          trace.setData('deadline', deadline)

          const signature = await trace.child({ name: 'Sign', op: 'wallet.sign' }, async (walletTrace) => {
            try {
              const provider = providerRef.current
              if (!provider) {
                throw new Error('missing provider')
              }
              const account = accountRef.current
              return await signTypedData(provider.getSigner(account.address), domain, types, values)
            } catch (error) {
              if (didUserReject(error)) {
                walletTrace.setStatus('cancelled')
                throw new UserRejectedRequestError(swapErrorToUserReadableMessage(t, error))
              } else {
                throw error
              }
            }
          })
          const resultTime = Math.floor(Date.now() / 1000)
          if (deadline < resultTime) {
            sendAnalyticsEvent(InterfaceEventNameLocal.UniswapXSignatureDeadlineExpired, {
              ...formatSwapSignedAnalyticsEventProperties({
                trade,
                allowedSlippage,
                fiatValues,
                portfolioBalanceUsd,
                trace: analyticsContext,
              }),
              deadline,
              resultTime,
            })
            throw new SignatureExpiredError()
          }
          sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
            ...formatSwapSignedAnalyticsEventProperties({
              trade,
              allowedSlippage,
              fiatValues,
              timeToSignSinceRequestMs: trace.now(),
              portfolioBalanceUsd,
              trace: analyticsContext,
            }),
            // TODO (WEB-2993): remove these after debugging missing user properties.
            [CustomUserProperties.WALLET_ADDRESS]: account.address,
            [CustomUserProperties.WALLET_TYPE]: account.connector.name,
            [CustomUserProperties.PEER_WALLET_AGENT]: provider ? getWalletMeta(provider)?.agent : undefined,
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
            sendAnalyticsEvent(InterfaceEventNameLocal.UniswapXOrderPostError, {
              ...formatSwapSignedAnalyticsEventProperties({
                trade,
                allowedSlippage,
                fiatValues,
                portfolioBalanceUsd,
                trace: analyticsContext,
              }),
              errorCode: responseBody.errorCode,
              detail: responseBody.detail,
            })

            // Always retry UniswapX v2 order errors from the UniswapX Parameterization API with classic swap
            if (trade?.fillType === TradeFillType.UniswapXv2) {
              throw new UniswapXv2HardQuoteError()
            }

            // TODO(UniswapX): Provide a similar utility to `swapErrorToUserReadableMessage` once
            // backend team provides a list of error codes and potential messages
            throw new Error(`${responseBody.errorCode ?? responseBody.detail ?? 'Unknown error'}`)
          }
          sendAnalyticsEvent(
            InterfaceEventNameLocal.UniswapXOrderSubmitted,
            formatSwapSignedAnalyticsEventProperties({
              trade,
              allowedSlippage,
              fiatValues,
              portfolioBalanceUsd,
              trace: analyticsContext,
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
            trace.setStatus('cancelled')
            throw error
          } else if (error instanceof SignatureExpiredError || error instanceof UniswapXv2HardQuoteError) {
            trace.setStatus('unknown_error')
            throw error
          } else {
            trace.setError(error)
            throw new Error(swapErrorToUserReadableMessage(t, error))
          }
        }
      }),
    [trade, chainId, allowedSlippage, fiatValues, portfolioBalanceUsd, analyticsContext, t],
  )
}
