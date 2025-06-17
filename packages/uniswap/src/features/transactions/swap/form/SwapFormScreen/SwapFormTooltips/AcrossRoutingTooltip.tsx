import { useTranslation } from 'react-i18next'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'

export function AcrossRoutingInfoTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip.Outer>
      <Tooltip.Description text={t('swap.details.orderRoutingInfo')} />
    </Tooltip.Outer>
  )
}
