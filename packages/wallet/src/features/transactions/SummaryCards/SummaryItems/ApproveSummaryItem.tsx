import { createElement } from 'react'
import { useTranslation } from 'react-i18next'
import { NumberType } from 'utilities/src/format/types'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'wallet/src/entities/assets'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  ApproveTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

const INFINITE_AMOUNT = 'INF'
const ZERO_AMOUNT = '0.0'

export function ApproveSummaryItem({
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transaction: TransactionDetails & { typeInfo: ApproveTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(
    buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
  )

  const { approvalAmount } = transaction.typeInfo

  const amount =
    approvalAmount === INFINITE_AMOUNT
      ? t('transaction.amount.unlimited')
      : approvalAmount && approvalAmount !== ZERO_AMOUNT
      ? formatNumberOrString({ value: approvalAmount, type: NumberType.TokenNonTx })
      : ''

  const caption = `${amount ? amount + ' ' : ''}${
    getSymbolDisplayText(currencyInfo?.currency.symbol) ?? ''
  }`

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
    icon: (
      <LogoWithTxStatus
        assetType={AssetType.Currency}
        chainId={transaction.chainId}
        currencyInfo={currencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={TransactionType.Approve}
      />
    ),
    transaction,
  })
}
