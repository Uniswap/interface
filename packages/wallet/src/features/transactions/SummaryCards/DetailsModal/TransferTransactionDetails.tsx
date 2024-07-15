import { SharedEventName } from '@uniswap/analytics-events'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { NftTransactionDetails } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/NftTransactionDetails'
import { useFormattedCurrencyAmountAndUSDValue } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/utils'
import {
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
} from 'wallet/src/features/transactions/types'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export function TransferTransactionDetails({
  transactionDetails,
  typeInfo,
  onClose,
}: {
  transactionDetails: TransactionDetails
  typeInfo: ReceiveTokenTransactionInfo | SendTokenTransactionInfo
  onClose: () => void
}): JSX.Element {
  const formatter = useLocalizationContext()
  const isCurrency = typeInfo.assetType === AssetType.Currency
  const currencyInfo = useCurrencyInfo(
    isCurrency ? buildCurrencyId(transactionDetails.chainId, typeInfo.tokenAddress) : undefined,
  )

  const { amount, value } = useFormattedCurrencyAmountAndUSDValue({
    currency: currencyInfo?.currency,
    currencyAmountRaw: typeInfo.currencyAmountRaw,
    formatter,
    isApproximateAmount: false,
  })
  const symbol = getSymbolDisplayText(currencyInfo?.currency.symbol)

  const tokenAmountWithSymbol = symbol ? amount + ' ' + symbol : amount // Prevents 'undefined' from being displayed

  return isCurrency ? (
    <CurrencyTransferContent
      currencyInfo={currencyInfo}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={value}
      onClose={onClose}
    />
  ) : (
    <NftTransactionDetails transactionDetails={transactionDetails} typeInfo={typeInfo} onClose={onClose} />
  )
}

export function CurrencyTransferContent({
  tokenAmountWithSymbol,
  currencyInfo,
  value,
  onClose,
  showValueAsHeading = false,
}: {
  tokenAmountWithSymbol: string | undefined
  currencyInfo: Maybe<CurrencyInfo>
  value: string
  onClose: () => void
  showValueAsHeading?: boolean
}): JSX.Element {
  const { navigateToTokenDetails } = useWalletNavigation()

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
        <Text variant="heading2">{showValueAsHeading ? value : tokenAmountWithSymbol}</Text>
        <Flex centered row gap="$spacing8">
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon20} />
          <Text color="$neutral2" variant="body2">
            {showValueAsHeading ? tokenAmountWithSymbol : value}
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
