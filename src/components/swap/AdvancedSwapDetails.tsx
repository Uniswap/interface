import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { LoadingRows } from 'components/Loader/styled'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { useTheme } from 'styled-components/macro'

import { Separator, ThemedText } from '../../theme'
import { computeRealizedPriceImpact } from '../../utils/prices'
import Column from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip, TooltipSize } from '../Tooltip'
import FormattedPriceImpact from './FormattedPriceImpact'
import RouterLabel from './RouterLabel'
import SwapRoute from './SwapRoute'

interface AdvancedSwapDetailsProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
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
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)

  const { expectedOutputAmount, priceImpact } = useMemo(() => {
    return {
      expectedOutputAmount: trade.outputAmount,
      priceImpact: computeRealizedPriceImpact(trade),
    }
  }, [trade])

  return (
    <Column gap="md">
      <Separator />
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
            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
              <Trans>Expected Output</Trans>
            </ThemedText.DeprecatedSubHeader>
          </MouseoverTooltip>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
            {expectedOutputAmount
              ? `${expectedOutputAmount.toSignificant(6)}  ${expectedOutputAmount.currency.symbol}`
              : '-'}
          </ThemedText.DeprecatedBlack>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <MouseoverTooltip text={<Trans>The impact your trade has on the market price of this pool.</Trans>}>
            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
              <Trans>Price Impact</Trans>
            </ThemedText.DeprecatedSubHeader>
          </MouseoverTooltip>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={50}>
          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
            <FormattedPriceImpact priceImpact={priceImpact} />
          </ThemedText.DeprecatedBlack>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <Separator />
      <RowBetween>
        <RowFixed style={{ marginRight: '20px' }}>
          <MouseoverTooltip
            text={
              <Trans>
                The minimum amount you are guaranteed to receive. If the price slips any further, your transaction will
                revert.
              </Trans>
            }
          >
            <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
              {trade.tradeType === TradeType.EXACT_INPUT ? (
                <Trans>Minimum received</Trans>
              ) : (
                <Trans>Maximum sent</Trans>
              )}{' '}
              <Trans>after slippage</Trans> ({allowedSlippage.toFixed(2)}%)
            </ThemedText.DeprecatedSubHeader>
          </MouseoverTooltip>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
            {trade.tradeType === TradeType.EXACT_INPUT
              ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
              : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
          </ThemedText.DeprecatedBlack>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      {!trade.gasUseEstimateUSD || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
        <RowBetween>
          <MouseoverTooltip
            text={
              <Trans>
                The fee paid to miners who process your transaction. This must be paid in {nativeCurrency.symbol}.
              </Trans>
            }
          >
            <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
              <Trans>Network Fee</Trans>
            </ThemedText.DeprecatedSubHeader>
          </MouseoverTooltip>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
              ~${trade.gasUseEstimateUSD.toFixed(2)}
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
      )}
      <Separator />
      <RowBetween>
        <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
          <Trans>Order routing</Trans>
        </ThemedText.DeprecatedSubHeader>
        <MouseoverTooltip
          size={TooltipSize.Large}
          text={<SwapRoute data-testid="swap-route-info" trade={trade} syncing={syncing} />}
        >
          <RouterLabel />
        </MouseoverTooltip>
      </RowBetween>
    </Column>
  )
}
