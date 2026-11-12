import { Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { InfoRow } from 'uniswap/src/components/activity/details/InfoRow'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getMarginDisplayCurrencyId } from 'uniswap/src/features/transactions/margin/marginDisplayCurrencyId'
import { type TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

export function getActivityDisplayMarginRows(typeInfo: TransactionDetails['typeInfo']): JSX.Element[] {
  return typeInfo.type === TransactionType.Plan && typeInfo.marginAction
    ? [<MarginMarketRow key="marginMarket" {...typeInfo.marginAction} />]
    : []
}

function MarginMarketRow(props: { collateralCurrencyId: string; debtCurrencyId: string }): JSX.Element {
  const { t } = useTranslation()
  const collateral = getSymbolDisplayText(
    useCurrencyInfo(getMarginDisplayCurrencyId(props.collateralCurrencyId))?.currency.symbol,
  )
  const debt = getSymbolDisplayText(useCurrencyInfo(getMarginDisplayCurrencyId(props.debtCurrencyId))?.currency.symbol)
  return (
    <InfoRow label={t('common.market.label')}>
      <Text variant="body3">{[collateral, debt].join(' / ')}</Text>
    </InfoRow>
  )
}
