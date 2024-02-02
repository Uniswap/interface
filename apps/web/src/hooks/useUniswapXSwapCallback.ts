import { BigNumber } from '@ethersproject/bignumber'
import * as Sentry from '@sentry/react'
import { CustomUserProperties, SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { DutchOrder, DutchOrderBuilder } from '@uniswap/uniswapx-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, useTrace } from 'analytics'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { getConnection } from 'connection'
import { useGatewayDNSUpdateAllEnabled } from 'featureFlags/flags/gatewayDNSUpdate'
import { formatSwapSignedAnalyticsEventProperties } from 'lib/utils/analytics'
import { useCallback } from 'react'
import { DutchOrderTrade, LimitOrderTrade, TradeFillType } from 'state/routing/types'
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
    async () =>
      trace('swapx.send', async ({ setTraceData, setTraceStatus }) => {
        if (!account) throw new Error('missing account')
        if (!provider) throw new Error('missing provider')
        if (!trade) throw new Error('missing trade')

        const signDutchOrder = async (): Promise<{ signature: string; updatedOrder: DutchOrder }> => {
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
            setTraceData('startTime', startTime)

            const endTime = startTime + trade.auctionPeriodSecs
            setTraceData('endTime', endTime)

            const deadline = endTime + trade.deadlineBufferSecs
            setTraceData('deadline', deadline)

            // Set timestamp and account based values when the user clicks 'swap' to make them as recent as possible
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

            const signature = await signTypedData(provider.getSigner(account), domain, types, values)
            if (deadline < Math.floor(Date.now() / 1000)) {
              throw new SignatureExpiredError()
            }
            return { signature, updatedOrder }
          } catch (swapError) {
            if (swapError instanceof SignatureExpiredError) {
              throw swapError
            }
            if (didUserReject(swapError)) {
              setTraceStatus('cancelled')
              throw new UserRejectedRequestError(swapErrorToUserReadableMessage(swapError))
            }
            throw new Error(swapErrorToUserReadableMessage(swapError))
          }
        }

        const beforeSign = Date.now()
        const { signature, updatedOrder } = await signDutchOrder()

        sendAnalyticsEvent(SwapEventName.SWAP_SIGNED, {
          ...formatSwapSignedAnalyticsEventProperties({
            trade,
            allowedSlippage,
            fiatValues,
            timeToSignSinceRequestMs: Date.now() - beforeSign,
            portfolioBalanceUsd,
          }),
          ...analyticsContext,
          // TODO (WEB-2993): remove these after debugging missing user properties.
          [CustomUserProperties.WALLET_ADDRESS]: account,
          [CustomUserProperties.WALLET_TYPE]: getConnection(connector).getProviderInfo().name,
          [CustomUserProperties.PEER_WALLET_AGENT]: provider ? getWalletMeta(provider)?.agent : undefined,
        })

        const baseURL = gatewayDNSUpdateAllEnabled ? UNISWAP_GATEWAY_DNS_URL : UNISWAP_API_URL
        const res = await fetch(`${baseURL}/order`, {
          method: 'POST',
          body: JSON.stringify({
            encodedOrder: updatedOrder.serialize(),
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

        return {
          type: TradeFillType.UniswapX as const,
          response: { orderHash: body.hash, deadline: updatedOrder.info.deadline },
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
