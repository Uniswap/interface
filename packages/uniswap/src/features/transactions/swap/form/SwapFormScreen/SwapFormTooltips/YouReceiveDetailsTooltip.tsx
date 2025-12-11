import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { getSwapFeeUsdFromDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/utils/getSwapFeeUsd'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

export function YouReceiveDetailsTooltip({
  receivedAmount,
  feeOnTransferProps,
}: {
  receivedAmount: string
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
}): JSX.Element {
  const { t } = useTranslation()
  const isUniswapXContext = useSwapTxStore((s) => isUniswapX({ routing: s.routing }))
  const { formatPercent } = useLocalizationContext()
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)
  const swapFee = derivedSwapInfo.trade.trade?.swapFee
  const swapFeeUsd = getSwapFeeUsdFromDerivedSwapInfo(derivedSwapInfo)
  const formatter = useLocalizationContext()
  const { convertFiatAmountFormatted } = formatter

  const isNoInterfaceFees = useFeatureFlag(FeatureFlags.NoUniswapInterfaceFees)

  const outputCurrencyUSDValue = useUSDCValue(derivedSwapInfo.outputAmountUserWillReceive)
  const formattedOutputCurrencyUSDValue: string | undefined = outputCurrencyUSDValue
    ? convertFiatAmountFormatted(outputCurrencyUSDValue.toExact(), NumberType.FiatTokenQuantity)
    : undefined
  const formattedSwapFee =
    swapFee &&
    getFormattedCurrencyAmount({
      currency: derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency,
      amount: swapFee.amount,
      formatter,
    }) + getSymbolDisplayText(derivedSwapInfo.currencies[CurrencyField.OUTPUT]?.currency.symbol)
  const formattedSwapFeeAmountFiat =
    swapFeeUsd && !isNaN(swapFeeUsd) ? convertFiatAmountFormatted(swapFeeUsd, NumberType.FiatGasPrice) : undefined

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('swap.bestPrice.through', { provider: isUniswapXContext ? 'UniswapX' : 'Uniswap API' }),
        }}
        Icon={isUniswapXContext ? UniswapX : UniswapLogo}
        iconColor="$accent1"
      />
      <Tooltip.Content>
        {feeOnTransferProps?.inputTokenInfo.fee.greaterThan(0) && (
          <Tooltip.Row>
            <Tooltip.LineItemLabel
              label={`${t('swap.details.feeOnTransfer', { tokenSymbol: feeOnTransferProps.inputTokenInfo.tokenSymbol })} (${formatPercent(feeOnTransferProps.inputTokenInfo.fee.toFixed(8))})`}
            />
            <Tooltip.LineItemValue
              value={feeOnTransferProps.inputTokenInfo.formattedAmount}
              usdValue={feeOnTransferProps.inputTokenInfo.formattedUsdAmount}
            />
          </Tooltip.Row>
        )}
        {feeOnTransferProps?.outputTokenInfo.fee.greaterThan(0) && (
          <Tooltip.Row>
            <Tooltip.LineItemLabel
              label={`${t('swap.details.feeOnTransfer', { tokenSymbol: feeOnTransferProps.outputTokenInfo.tokenSymbol })} (${formatPercent(feeOnTransferProps.outputTokenInfo.fee.toFixed(8))})`}
            />
            <Tooltip.LineItemValue
              value={feeOnTransferProps.outputTokenInfo.formattedAmount}
              usdValue={feeOnTransferProps.outputTokenInfo.formattedUsdAmount}
            />
          </Tooltip.Row>
        )}
        <Tooltip.Row>
          <Tooltip.LineItemLabel label={t('fee.uniswap', { percent: formatPercent(0.25) })} />
          <Tooltip.LineItemValue value={formattedSwapFee} usdValue={formattedSwapFeeAmountFiat} />
        </Tooltip.Row>
        <Tooltip.Row>
          <Tooltip.LineItemLabel label={t('common.youReceive')} />
          <Tooltip.LineItemValue value={receivedAmount} usdValue={formattedOutputCurrencyUSDValue} />
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Separator />
      <Tooltip.Description
        text={isNoInterfaceFees ? t('swap.warning.noInterfaceFees.message') : t('swap.warning.uniswapFee.message')}
      />
    </Tooltip.Outer>
  )
}
