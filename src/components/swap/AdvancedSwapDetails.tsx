import { Plural, Trans } from '@lingui/macro'
import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent } from 'analytics'
import { LoadingRows } from 'components/Loader/styled'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import { ZERO_PERCENT } from 'constants/misc'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { ClassicTrade, InterfaceTrade } from 'state/routing/types'
import { getTransactionCount, isClassicTrade } from 'state/routing/utils'
import { formatCurrencyAmount, formatNumber, formatPriceImpact, NumberType } from 'utils/formatNumbers'

import { Separator, ThemedText } from '../../theme'
import Column from '../Column'
import RouterLabel from '../RouterLabel'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip, TooltipSize } from '../Tooltip'
import { GasBreakdownTooltip } from './GasBreakdownTooltip'
import SwapRoute from './SwapRoute'

interface AdvancedSwapDetailsProps {
  trade: InterfaceTrade
  allowedSlippage: Percent
  syncing?: boolean
}

function TextWithLoadingPlaceholder({
  syncing,
  width,
  children,
}: {
  syncing: boolean
  width: number
  children: JSX.Element
}) {
  return syncing ? (
    <LoadingRows data-testid="loading-rows">
      <div style={{ height: '15px', width: `${width}px` }} />
    </LoadingRows>
  ) : (
    children
  )
}

export function AdvancedSwapDetails({ trade, allowedSlippage, syncing = false }: AdvancedSwapDetailsProps) {
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)
  const txCount = getTransactionCount(trade)

  const supportsGasEstimate = chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)

  return (
    <Column gap="md">
      <Separator />
      {supportsGasEstimate && (
        <RowBetween>
          <MouseoverTooltip
            text={
              <Trans>
                The fee paid to miners who process your transaction. This must be paid in {nativeCurrency.symbol}.
              </Trans>
            }
          >
            <ThemedText.BodySmall color="textSecondary">
              <Plural value={txCount} one="Network fee" other="Network fees" />
            </ThemedText.BodySmall>
          </MouseoverTooltip>
          <MouseoverTooltip
            placement="right"
            size={TooltipSize.Small}
            text={<GasBreakdownTooltip trade={trade} hideUniswapXDescription />}
          >
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.BodySmall>
                {`${trade.totalGasUseEstimateUSD ? '~' : ''}${formatNumber(
                  trade.totalGasUseEstimateUSD,
                  NumberType.FiatGasPrice
                )}`}
              </ThemedText.BodySmall>
            </TextWithLoadingPlaceholder>
          </MouseoverTooltip>
        </RowBetween>
      )}
      {isClassicTrade(trade) && (
        <>
          <TokenTaxLineItem trade={trade} type="input" />
          <TokenTaxLineItem trade={trade} type="output" />
          <RowBetween>
            <MouseoverTooltip text={<Trans>The impact your trade has on the market price of this pool.</Trans>}>
              <ThemedText.BodySmall color="textSecondary">
                <Trans>Price Impact</Trans>
              </ThemedText.BodySmall>
            </MouseoverTooltip>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.BodySmall>{formatPriceImpact(trade.priceImpact)}</ThemedText.BodySmall>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        </>
      )}
      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={
              <Trans>
                The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will
                revert.
              </Trans>
            }
          >
            <ThemedText.BodySmall color="textSecondary">
              {trade.tradeType === TradeType.EXACT_INPUT ? <Trans>Minimum output</Trans> : <Trans>Maximum input</Trans>}
            </ThemedText.BodySmall>
          </MouseoverTooltip>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <ThemedText.BodySmall>
            {trade.tradeType === TradeType.EXACT_INPUT
              ? `${formatCurrencyAmount(trade.minimumAmountOut(allowedSlippage), NumberType.SwapTradeAmount)} ${
                  trade.outputAmount.currency.symbol
                }`
              : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
          </ThemedText.BodySmall>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <MouseoverTooltip
            text={
              <Trans>
                The amount you expect to receive at the current market price. You may receive less or more if the market
                price changes while your transaction is pending.
              </Trans>
            }
          >
            <ThemedText.BodySmall color="textSecondary">
              <Trans>Expected output</Trans>
            </ThemedText.BodySmall>
          </MouseoverTooltip>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <ThemedText.BodySmall>
            {`${formatCurrencyAmount(trade.postTaxOutputAmount, NumberType.SwapTradeAmount)} ${
              trade.outputAmount.currency.symbol
            }`}
          </ThemedText.BodySmall>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <Separator />
      <RowBetween>
        <ThemedText.BodySmall color="textSecondary">
          <Trans>Order routing</Trans>
        </ThemedText.BodySmall>
        {isClassicTrade(trade) ? (
          <MouseoverTooltip
            size={TooltipSize.Large}
            text={<SwapRoute data-testid="swap-route-info" trade={trade} syncing={syncing} />}
            onOpen={() => {
              sendAnalyticsEvent(SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED, {
                element: InterfaceElementName.AUTOROUTER_VISUALIZATION_ROW,
              })
            }}
          >
            <RouterLabel trade={trade} />
          </MouseoverTooltip>
        ) : (
          <MouseoverTooltip
            size={TooltipSize.Small}
            text={<GasBreakdownTooltip trade={trade} hideFees />}
            placement="right"
            onOpen={() => {
              sendAnalyticsEvent(SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED, {
                element: InterfaceElementName.AUTOROUTER_VISUALIZATION_ROW,
              })
            }}
          >
            <RouterLabel trade={trade} />
          </MouseoverTooltip>
        )}
      </RowBetween>
    </Column>
  )
}

function TokenTaxLineItem({ trade, type }: { trade: ClassicTrade; type: 'input' | 'output' }) {
  const [currency, percentage] =
    type === 'input' ? [trade.inputAmount.currency, trade.inputTax] : [trade.outputAmount.currency, trade.outputTax]

  if (percentage.equalTo(ZERO_PERCENT)) return null

  return (
    <RowBetween>
      <MouseoverTooltip
        text={
          <Trans>
            Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not
            receive any of these fees.
          </Trans>
        }
      >
        <ThemedText.BodySmall color="textSecondary">{`${currency.symbol} fee`}</ThemedText.BodySmall>
      </MouseoverTooltip>
      <ThemedText.BodySmall>{formatPriceImpact(percentage)}</ThemedText.BodySmall>
    </RowBetween>
  )
}
