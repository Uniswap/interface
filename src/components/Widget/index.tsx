import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import {
  InterfaceEventName,
  InterfaceSectionName,
  SwapEventName,
  SwapPriceUpdateUserResponse,
} from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import {
  AddEthereumChainParameter,
  DialogAnimationType,
  EMPTY_TOKEN_LIST,
  OnReviewSwapClick,
  SwapWidget,
  SwapWidgetSkeleton,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { useActiveLocale } from 'hooks/useActiveLocale'
import {
  formatPercentInBasisPointsNumber,
  formatSwapQuoteReceivedEventProperties,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getPriceUpdateBasisPoints,
  getTokenAddress,
} from 'lib/utils/analytics'
import { useCallback, useState } from 'react'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { computeRealizedPriceImpact } from 'utils/prices'
import { switchChain } from 'utils/switchChain'

import { DefaultTokens, SwapTokens, useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { DARK_THEME, LIGHT_THEME } from './theme'
import { useSyncWidgetTransactions } from './transactions'

export const DEFAULT_WIDGET_WIDTH = 360

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

function useWidgetTheme() {
  return useIsDarkMode() ? DARK_THEME : LIGHT_THEME
}

interface WidgetProps {
  defaultTokens: DefaultTokens
  width?: number | string
  onDefaultTokenChange?: (tokens: SwapTokens) => void
  onReviewSwapClick?: OnReviewSwapClick
}

export default function Widget({
  defaultTokens,
  width = DEFAULT_WIDGET_WIDTH,
  onDefaultTokenChange,
  onReviewSwapClick,
}: WidgetProps) {
  const { connector, provider, chainId } = useWeb3React()
  const locale = useActiveLocale()
  const theme = useWidgetTheme()
  const { inputs, tokenSelector } = useSyncWidgetInputs({
    defaultTokens,
    onDefaultTokenChange,
  })
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  const toggleWalletDrawer = useToggleAccountDrawer()
  const onConnectWalletClick = useCallback(() => {
    toggleWalletDrawer()
    return false // prevents the in-widget wallet modal from opening
  }, [toggleWalletDrawer])

  const onSwitchChain = useCallback(
    // TODO(WEB-1757): Widget should not break if this rejects - upstream the catch to ignore it.
    ({ chainId }: AddEthereumChainParameter) => switchChain(connector, Number(chainId)).catch(() => undefined),
    [connector]
  )

  const trace = useTrace({ section: InterfaceSectionName.WIDGET })
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
      sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, eventProperties)
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
    sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, eventProperties)
  }, [inputs.value.INPUT, trace])
  const onExpandSwapDetails = useCallback(() => {
    sendAnalyticsEvent(SwapEventName.SWAP_DETAILS_EXPANDED, { ...trace })
  }, [trace])
  const onSwapPriceUpdateAck = useCallback(
    (stale: Trade<Currency, Currency, TradeType>, update: Trade<Currency, Currency, TradeType>) => {
      const eventProperties = {
        chain_id: update.inputAmount.currency.chainId,
        response: SwapPriceUpdateUserResponse.ACCEPTED,
        token_in_symbol: update.inputAmount.currency.symbol,
        token_out_symbol: update.outputAmount.currency.symbol,
        price_update_basis_points: getPriceUpdateBasisPoints(stale.executionPrice, update.executionPrice),
        ...trace,
      }
      sendAnalyticsEvent(SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED, eventProperties)
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
      sendAnalyticsEvent(SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED, eventProperties)
    },
    [initialQuoteDate, trace]
  )

  if (!(inputs.value.INPUT || inputs.value.OUTPUT)) {
    return <WidgetSkeleton />
  }

  return (
    <>
      <div style={{ zIndex: 1, position: 'relative' }}>
        <SwapWidget
          hideConnectionUI
          brandedFooter={false}
          permit2
          routerUrl={WIDGET_ROUTER_URL}
          locale={locale}
          theme={theme}
          width={width}
          defaultChainId={chainId}
          onConnectWalletClick={onConnectWalletClick}
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
          dialogOptions={{
            pageCentered: true,
            animationType: DialogAnimationType.FADE,
          }}
          onError={(error, errorInfo) => {
            sendAnalyticsEvent(SwapEventName.SWAP_ERROR, { error, errorInfo, ...trace })
          }}
        />
      </div>
      {tokenSelector}
    </>
  )
}

export function WidgetSkeleton({ width = DEFAULT_WIDGET_WIDTH }: { width?: number | string }) {
  const theme = useWidgetTheme()
  return <SwapWidgetSkeleton theme={theme} width={width} />
}
