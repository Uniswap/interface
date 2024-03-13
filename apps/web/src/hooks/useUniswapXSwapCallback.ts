import { BigNumber } from '@ethersproject/bignumber'
import * as Sentry from '@sentry/react'
import { CustomUserProperties, SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { DutchOrderBuilder } from '@uniswap/uniswapx-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { getConnection } from 'connection'
import { useGatewayDNSUpdateAllEnabled } from 'featureFlags/flags/gatewayDNSUpdate'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { DutchOrderTrade, LimitOrderTrade, OffchainOrderType, TradeFillType } from 'state/routing/types'
import { trace } from 'tracing/trace'
import { SignatureExpiredError, UserRejectedRequestError } from 'utils/errors'
import { signTypedData } from 'utils/signing'
import { didUserReject, swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { getWalletMeta } from 'utils/walletMeta'

type DutchAuctionOrderError = { errorCode?: number; detail?: string }
type DutchAuctionOrderSuccess = { hash: string }
type DutchAuctionOrderResponse = DutchAuctionOrderError | DutchAuctionOrderSuccess

const isErrorResponse = (res: Response, order: DutchAuctionOrderResponse): order is DutchAuctionOrderError =>
  res.status < 200 || res.status > 202

const UNISWAP_API_URL = process.env.REACT_APP_UNISWAP_API_URL
const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_API_URL === undefined || UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_API_URL and UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

// getUpdatedNonce queries the UniswapX service for the most up-to-date nonce for a user.
// The `nonce` exists as part of the Swap quote response already, but if a user submits back-to-back
// swaps without refreshing the quote (and therefore uses the same nonce), then the subsequent swaps will fail.
//
async function getUpdatedNonce(
  swapper: string,
  chainId: number,
  gatewayDNSUpdateAllEnabled: boolean
): Promise<BigNumber | null> {
  const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
  try {
    // endpoint fetches current nonce
    const res = await fetch(`${baseURL}/nonce?address=${swapper.toLowerCase()}&chainId=${chainId}`)
    const { nonce } = await res.json()
    return BigNumber.from(nonce).add(1)
  } catch (e) {
    Sentry.withScope(function (scope) {
      scope.setTag('method', 'getUpdatedNonce')
      scope.setLevel('warning')
      Sentry.captureException(e)
    })
    return null
  }
}

export function useUniswapXSwapCallback({
  trade,
  allowedSlippage,
  fiatValues,
}: {
  trade?: DutchOrderTrade | LimitOrderTrade
  fiatValues: { amountIn?: number; amountOut?: number; feeUsd?: number }
  allowedSlippage: Percent
}) {
  const { account, provider, connector } = useWeb3React()
  const analyticsContext = useTrace()
  const gatewayDNSUpdateAllEnabled = useGatewayDNSUpdateAllEnabled()

  const { data } = useCachedPortfolioBalancesQuery({ account })
  const portfolioBalanceUsd = data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value

  return useCallback(
    () =>
      trace({ name: 'Swap (Dutch)', op: 'swap.x.dutch' }, async (trace) => {
        if (!account) throw new Error('missing account')
        if (!provider) throw new Error('missing provider')
        if (!trade) throw new Error('missing trade')

        sendAnalyticsEvent('UniswapX Signature Requested', {
          ...formatSwapSignedAnalyticsEventProperties({
            trade,
            allowedSlippage,
            fiatValues,
            portfolioBalanceUsd,
          }),
          ...analyticsContext,
        })

        try {
          const updatedNonce = await getUpdatedNonce(
            account,
            trade.inputAmount.currency.chainId,
            gatewayDNSUpdateAllEnabled
          )
          // TODO(limits): WEB-3434 - add error state for missing nonce
          if (!updatedNonce) throw new Error('missing nonce')

          const order = trade.asDutchOrderTrade({ nonce: updatedNonce, swapper: account }).order
          const startTime = Math.floor(Date.now() / 1000) + trade.startTimeBufferSecs
          const endTime = startTime + trade.auctionPeriodSecs
          const deadline = endTime + trade.deadlineBufferSecs
          trace.setData('startTime', startTime)
          trace.setData('endTime', endTime)
          trace.setData('deadline', deadline)
          const updatedOrder = DutchOrderBuilder.fromOrder(order)
            .decayStartTime(startTime)
            .decayEndTime(endTime)
            .deadline(deadline)
            .swapper(account)
            .nonFeeRecipient(account, trade.swapFee?.recipient)
            // if fetching the nonce fails for any reason, default to existing nonce from the Swap quote.
            .nonce(updatedNonce ?? order.info.nonce)
            .build()
          const { domain, types, values } = updatedOrder.permitData()

          const signature = await trace.child({ name: 'Sign', op: 'wallet.sign' }, async (walletTrace) => {
            try {
              return await signTypedData(provider.getSigner(account), domain, types, values)
            } catch (error) {
              if (didUserReject(error)) {
                walletTrace.setStatus('cancelled')
                throw new UserRejectedRequestError(swapErrorToUserReadableMessage(error))
              } else {
                throw error
              }
            }
          })
          if (deadline < Math.floor(Date.now() / 1000)) {
            throw new SignatureExpiredError()
          }
          sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
            ...formatSwapSignedAnalyticsEventProperties({
              trade,
              allowedSlippage,
              fiatValues,
              timeToSignSinceRequestMs: trace.now(),
              portfolioBalanceUsd,
            }),
            ...analyticsContext,
            // TODO (WEB-2993): remove these after debugging missing user properties.
            [CustomUserProperties.WALLET_ADDRESS]: account,
            [CustomUserProperties.WALLET_TYPE]: getConnection(connector).getProviderInfo().name,
            [CustomUserProperties.PEER_WALLET_AGENT]: provider ? getWalletMeta(provider)?.agent : undefined,
          })

          const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
          const endpoint = trade.offchainOrderType === OffchainOrderType.LIMIT_ORDER ? 'limit-order' : 'order'
          const encodedOrder = updatedOrder.serialize()
          const res = await fetch(`${baseURL}/${endpoint}`, {
            method: 'POST',
            body: JSON.stringify({
              encodedOrder,
              signature,
              chainId: updatedOrder.chainId,
              quoteId: trade.quoteId,
            }),
          })
          const body = (await res.json()) as DutchAuctionOrderResponse
          // TODO(UniswapX): For now, `errorCode` is not always present in the response, so we have to fallback
          // check for status code and perform this type narrowing.
          if (isErrorResponse(res, body)) {
            sendAnalyticsEvent('UniswapX Order Post Error', {
              ...formatSwapSignedAnalyticsEventProperties({
                trade,
                allowedSlippage,
                fiatValues,
                portfolioBalanceUsd,
              }),
              ...analyticsContext,
              errorCode: body.errorCode,
              detail: body.detail,
            })
            // TODO(UniswapX): Provide a similar utility to `swapErrorToUserReadableMessage` once
            // backend team provides a list of error codes and potential messages
            throw new Error(`${body.errorCode ?? body.detail ?? 'Unknown error'}`)
          }
          sendAnalyticsEvent('UniswapX Order Submitted', {
            ...formatSwapSignedAnalyticsEventProperties({
              trade,
              allowedSlippage,
              fiatValues,
              portfolioBalanceUsd,
            }),
          })

          return {
            type: TradeFillType.UniswapX as const,
            response: { orderHash: body.hash, deadline: updatedOrder.info.deadline, encodedOrder },
          }
        } catch (error) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus('cancelled')
            throw error
          } else if (error instanceof SignatureExpiredError) {
            trace.setStatus('deadline_exceeded')
            throw error
          } else {
            trace.setError(error)
            throw new Error(swapErrorToUserReadableMessage(error))
          }
        }
      }),
    [
      account,
      provider,
      trade,
      allowedSlippage,
      fiatValues,
      portfolioBalanceUsd,
      analyticsContext,
      connector,
      gatewayDNSUpdateAllEnabled,
    ]
  )
}
