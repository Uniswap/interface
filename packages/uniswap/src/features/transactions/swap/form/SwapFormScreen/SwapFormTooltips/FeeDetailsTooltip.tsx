import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'

function FeeDetails(props: { tokenSymbol: string; feePercent: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex
      row
      p="$spacing8"
      backgroundColor="$surface2"
      borderRadius="$rounded8"
      justifyContent="space-between"
      alignItems="center"
    >
      <Text variant="body4" color="$neutral2">
        {t('swap.details.feeOnTransfer', { tokenSymbol: props.tokenSymbol })}
      </Text>
      <Text variant="body4" color="$neutral1">
        {props.feePercent}
      </Text>
    </Flex>
  )
}

export function SwapFeeOnTransferTooltip(props: FeeOnTransferFeeGroupProps): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const buyFeePercent = formatPercent(props.outputTokenInfo.fee.toFixed(8))
  const hasBuyFee = props.outputTokenInfo.fee.greaterThan(0)
  const sellFeePercent = formatPercent(props.inputTokenInfo.fee.toFixed(8))
  const hasSellFee = props.inputTokenInfo.fee.greaterThan(0)

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('token.safety.fee.detected'),
        }}
      />
      <Tooltip.Content>
        {hasBuyFee && (
          <Tooltip.Description
            text={t('token.safety.warning.tokenChargesFee.buy.message.descriptive', {
              tokenSymbol: props.outputTokenInfo.tokenSymbol,
              feePercent: buyFeePercent,
            })}
          />
        )}
        {hasSellFee && (
          <Tooltip.Description
            text={t('token.safety.warning.tokenChargesFee.sell.message.descriptive', {
              tokenSymbol: props.inputTokenInfo.tokenSymbol,
              feePercent: sellFeePercent,
            })}
          />
        )}
      </Tooltip.Content>
      {hasBuyFee && <FeeDetails tokenSymbol={props.outputTokenInfo.tokenSymbol} feePercent={buyFeePercent} />}
      {hasSellFee && <FeeDetails tokenSymbol={props.inputTokenInfo.tokenSymbol} feePercent={sellFeePercent} />}
    </Tooltip.Outer>
  )
}
