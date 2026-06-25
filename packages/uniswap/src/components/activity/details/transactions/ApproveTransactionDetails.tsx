import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TransactionTokenContextMenu } from 'uniswap/src/components/activity/details/transactions/TransactionTokenContextMenu'
import { formatApprovalAmount } from 'uniswap/src/components/activity/utils'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ApproveTransactionInfo,
  Permit2ApproveTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function ApproveTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: ApproveTransactionInfo | Permit2ApproveTransactionInfo
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress ?? ''))

  if (!currencyInfo && typeInfo.type === TransactionType.Permit2Approve) {
    return null
  }

  const approvalAmount = typeInfo.type === TransactionType.Approve ? typeInfo.approvalAmount : typeInfo.amount

  const amount = formatApprovalAmount({
    approvalAmount,
    formatNumberOrString,
    t,
  })

  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  return (
    <Flex centered gap="$spacing8" p="$spacing32">
      <TransactionTokenContextMenu currencyInfo={currencyInfo} onClose={onClose}>
        <Text variant="heading3">{amount}</Text>
        <Flex centered row gap="$spacing8">
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon20} />
          <Text color="$neutral2" variant="body2">
            {symbol}
          </Text>
        </Flex>
      </TransactionTokenContextMenu>
    </Flex>
  )
}
