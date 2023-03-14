import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import {
  formatPercentInBasisPointsNumber,
  formatPercentNumber,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getDurationUntilTimestampSeconds,
  getTokenAddress,
} from 'lib/utils/analytics'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import { useClientSideRouter, useUserSlippageTolerance } from 'state/user/hooks'
import { computeRealizedPriceImpact } from 'utils/prices'

import { ButtonError } from '../Button'
import { AutoRow } from '../Row'
import { SwapCallbackError } from './styleds'
import { getTokenPath, RoutingDiagramEntry } from './SwapRoute'

interface AnalyticsEventProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch: number | undefined
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  swapQuoteReceivedDate: Date | undefined
  routes: RoutingDiagramEntry[]
  fiatValueInput?: number
  fiatValueOutput?: number
}

const formatRoutesEventProperties = (routes: RoutingDiagramEntry[]) => {
  const routesEventProperties: Record<string, any[]> = {
    routes_percentages: [],
    routes_protocols: [],
  }

  routes.forEach((route, index) => {
    routesEventProperties['routes_percentages'].push(formatPercentNumber(route.percent))
    routesEventProperties['routes_protocols'].push(route.protocol)
    routesEventProperties[`route_${index}_input_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[0].symbol ?? ''
    )
    routesEventProperties[`route_${index}_output_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[1].symbol ?? ''
    )
    routesEventProperties[`route_${index}_input_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[0])
    )
    routesEventProperties[`route_${index}_output_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[1])
    )
    routesEventProperties[`route_${index}_fee_amounts_hundredths_of_bps`] = route.path.map((pathStep) => pathStep[2])
  })

  return routesEventProperties
}

const formatAnalyticsEventProperties = ({
  trade,
  hash,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  swapQuoteReceivedDate,
  routes,
  fiatValueInput,
  fiatValueOutput,
}: AnalyticsEventProps) => ({
  estimated_network_fee_usd: trade.gasUseEstimateUSD ? formatToDecimal(trade.gasUseEstimateUSD, 2) : undefined,
  transaction_hash: hash,
  transaction_deadline_seconds: getDurationUntilTimestampSeconds(transactionDeadlineSecondsSinceEpoch),
  token_in_address: getTokenAddress(trade.inputAmount.currency),
  token_out_address: getTokenAddress(trade.outputAmount.currency),
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
  token_in_amount_usd: fiatValueInput,
  token_out_amount_usd: fiatValueOutput,
  price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  is_auto_router_api: isAutoRouterApi,
  is_auto_slippage: isAutoSlippage,
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  duration_from_first_quote_to_swap_submission_milliseconds: swapQuoteReceivedDate
    ? getDurationFromDateMilliseconds(swapQuoteReceivedDate)
    : undefined,
  swap_quote_block_number: trade.blockNumber,
  ...formatRoutesEventProperties(routes),
})

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  hash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [clientSideRouter] = useClientSideRouter()
  const routes = getTokenPath(trade)

  return (
    <>
      <AutoRow>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
          name={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
          properties={formatAnalyticsEventProperties({
            trade,
            hash,
            allowedSlippage,
            transactionDeadlineSecondsSinceEpoch,
            isAutoSlippage,
            isAutoRouterApi: !clientSideRouter,
            swapQuoteReceivedDate,
            routes,
            fiatValueInput: fiatValueInput.data,
            fiatValueOutput: fiatValueOutput.data,
          })}
        >
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{ margin: '10px 0 0 0' }}
            id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
          >
            <Text fontSize={20} fontWeight={500}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonError>
        </TraceEvent>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
