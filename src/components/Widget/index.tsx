// Import fonts.css for the side-effect of loading fonts for @uniswap/widgets.
// eslint-disable-next-line no-restricted-imports
import '@uniswap/widgets/dist/fonts.css'

import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import {
  AddEthereumChainParameter,
  EMPTY_TOKEN_LIST,
  OnReviewSwapClick,
  SwapWidget,
  SwapWidgetSkeleton,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import { EventName, SectionName } from 'analytics/constants'
import { SWAP_PRICE_UPDATE_USER_RESPONSE } from 'analytics/constants'
import { useTrace } from 'analytics/Trace'
import {
  formatPercentInBasisPointsNumber,
  formatSwapQuoteReceivedEventProperties,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getPriceUpdateBasisPoints,
  getTokenAddress,
} from 'analytics/utils'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback, useState } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'
import { computeRealizedPriceImpact } from 'utils/prices'
import { switchChain } from 'utils/switchChain'

import { useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { useSyncWidgetTransactions } from './transactions'

export const WIDGET_WIDTH = 360

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export interface WidgetProps {
  defaultToken?: Currency
  onReviewSwapClick?: OnReviewSwapClick
}

export default function Widget({ defaultToken, onReviewSwapClick }: WidgetProps) {
  const locale = useActiveLocale()
  const theme = useIsDarkMode() ? DARK_THEME : LIGHT_THEME
  const { connector, provider } = useWeb3React()

  const { inputs, tokenSelector } = useSyncWidgetInputs(defaultToken)
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  const trace = useTrace({ section: SectionName.WIDGET })

  const [initialQuoteDate, setInitialQuoteDate] = useState<Date>()

  const onInitialSwapQuote = useCallback(
    (trade: Trade<Currency, Currency, TradeType>) => {
      setInitialQuoteDate(new Date())
      const eventProperties = {
        // TODO(1416): Include undefined values.
        ...formatSwapQuoteReceivedEventProperties(
          trade,
          /* gasUseEstimateUSD= */ undefined,
          /* fetchingSwapQuoteStartTime= */ undefined
        ),
        ...trace,
      }
      sendAnalyticsEvent(EventName.SWAP_QUOTE_RECEIVED, eventProperties)
    },
    [trace]
  )

  const onApproveToken = useCallback(() => {
    const input = inputs.value.INPUT
    if (!input) return
    const eventProperties = {
      chain_id: input.chainId,
      token_symbol: input.symbol,
      token_address: getTokenAddress(input),
      ...trace,
    }
    sendAnalyticsEvent(EventName.APPROVE_TOKEN_TXN_SUBMITTED, eventProperties)
  }, [inputs.value.INPUT, trace])

  const onExpandSwapDetails = useCallback(() => {
    sendAnalyticsEvent(EventName.SWAP_DETAILS_EXPANDED, { ...trace })
  }, [trace])

  const onSwapPriceUpdateAck = useCallback(
    (stale: Trade<Currency, Currency, TradeType>, update: Trade<Currency, Currency, TradeType>) => {
      const eventProperties = {
        chain_id: update.inputAmount.currency.chainId,
        response: SWAP_PRICE_UPDATE_USER_RESPONSE.ACCEPTED,
        token_in_symbol: update.inputAmount.currency.symbol,
        token_out_symbol: update.outputAmount.currency.symbol,
        price_update_basis_points: getPriceUpdateBasisPoints(stale.executionPrice, update.executionPrice),
        ...trace,
      }
      sendAnalyticsEvent(EventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED, eventProperties)
    },
    [trace]
  )

  const onSubmitSwapClick = useCallback(
    (trade: Trade<Currency, Currency, TradeType>) => {
      const eventProperties = {
        // TODO(1416): Include undefined values.
        estimated_network_fee_usd: undefined,
        transaction_deadline_seconds: undefined,
        token_in_address: getTokenAddress(trade.inputAmount.currency),
        token_out_address: getTokenAddress(trade.outputAmount.currency),
        token_in_symbol: trade.inputAmount.currency.symbol,
        token_out_symbol: trade.outputAmount.currency.symbol,
        token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
        token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
        token_in_amount_usd: undefined,
        token_out_amount_usd: undefined,
        price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
        allowed_slippage_basis_points: undefined,
        is_auto_router_api: undefined,
        is_auto_slippage: undefined,
        chain_id: trade.inputAmount.currency.chainId,
        duration_from_first_quote_to_swap_submission_milliseconds: getDurationFromDateMilliseconds(initialQuoteDate),
        swap_quote_block_number: undefined,
        ...trace,
      }
      sendAnalyticsEvent(EventName.SWAP_SUBMITTED_BUTTON_CLICKED, eventProperties)
    },
    [initialQuoteDate, trace]
  )
  const onSwitchChain = useCallback(
    // TODO: Widget should not break if this rejects - upstream the catch to ignore it.
    ({ chainId }: AddEthereumChainParameter) => switchChain(connector, Number(chainId)).catch(() => undefined),
    [connector]
  )

  if (!inputs.value.INPUT && !inputs.value.OUTPUT) {
    return <WidgetSkeleton />
  }

  return (
    <>
      <SwapWidget
        disableBranding
        hideConnectionUI
        routerUrl={WIDGET_ROUTER_URL}
        width={WIDGET_WIDTH}
        locale={locale}
        theme={theme}
        // defaultChainId is excluded - it is always inferred from the passed provider
        provider={provider}
        onSwitchChain={onSwitchChain}
        tokenList={EMPTY_TOKEN_LIST} // prevents loading the default token list, as we use our own token selector UI
        {...inputs}
        {...settings}
        {...transactions}
        onExpandSwapDetails={onExpandSwapDetails}
        onReviewSwapClick={onReviewSwapClick}
        onSubmitSwapClick={onSubmitSwapClick}
        onSwapApprove={onApproveToken}
        onInitialSwapQuote={onInitialSwapQuote}
        onSwapPriceUpdateAck={onSwapPriceUpdateAck}
      />
      {tokenSelector}
    </>
  )
}

export function WidgetSkeleton() {
  return <SwapWidgetSkeleton theme={useIsDarkMode() ? DARK_THEME : LIGHT_THEME} width={WIDGET_WIDTH} />
}
