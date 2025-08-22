import { SharedEventName } from '@uniswap/analytics-events'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ApproveTransactionInfo, TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { isWeb } from 'utilities/src/platform'

const INFINITE_AMOUNT = 'INF'
const ZERO_AMOUNT = '0.0'
export function ApproveTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: ApproveTransactionInfo
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const { navigateToTokenDetails } = useUniswapContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress))

  const { approvalAmount } = typeInfo

  const amount =
    approvalAmount === INFINITE_AMOUNT
      ? t('transaction.amount.unlimited')
      : approvalAmount && approvalAmount !== ZERO_AMOUNT
        ? formatNumberOrString({ value: approvalAmount, type: NumberType.TokenNonTx })
        : ''

  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  const onPressToken = (): void => {
    if (currencyInfo) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.TokenItem,
        modal: ModalName.TransactionDetails,
      })

      navigateToTokenDetails(currencyInfo.currencyId)
      if (!isWeb) {
        onClose()
      }
    }
  }

  return (
    <TouchableArea onPress={onPressToken}>
      <Flex centered gap="$spacing8" p="$spacing32">
        <Text variant="heading3">{amount}</Text>
        <Flex centered row gap="$spacing8">
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon20} />
          <Text color="$neutral2" variant="body2">
            {symbol}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
