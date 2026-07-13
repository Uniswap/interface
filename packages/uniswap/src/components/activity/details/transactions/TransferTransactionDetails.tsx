import { isWebPlatform } from '@universe/environment'
import { Flex, Loader, Text, useMedia } from 'ui/src'
import { fonts, iconSizes } from 'ui/src/theme'
import { NftTransactionDetails } from 'uniswap/src/components/activity/details/transactions/NftTransactionDetails'
import { TransactionTokenContextMenu } from 'uniswap/src/components/activity/details/transactions/TransactionTokenContextMenu'
import { useFormattedCurrencyAmountAndUSDValue } from 'uniswap/src/components/activity/hooks/useFormattedCurrencyAmountAndUSDValue'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const OFFSET = 100

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

  const { amount, value, isLoading } = useFormattedCurrencyAmountAndUSDValue({
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
      isLoading={isLoading}
      tokenAmountWithSymbol={tokenAmountWithSymbol}
      value={value}
      onClose={onClose}
    />
  ) : (
    <NftTransactionDetails typeInfo={typeInfo} />
  )
}

export function CurrencyTransferContent({
  tokenAmountWithSymbol,
  currencyInfo,
  value,
  onClose,
  showValueAsHeading = false,
  isLoading,
}: {
  tokenAmountWithSymbol: string | undefined
  currencyInfo: Maybe<CurrencyInfo>
  value: string
  onClose: () => void
  showValueAsHeading?: boolean
  isLoading?: boolean
}): JSX.Element {
  const media = useMedia()

  const headingText = showValueAsHeading ? value : tokenAmountWithSymbol
  const subtitleText = showValueAsHeading ? tokenAmountWithSymbol : value

  const offsetX = isWebPlatform && media.sm ? OFFSET / 2 : OFFSET

  return (
    <Flex centered gap="$spacing8" p="$spacing32">
      <TransactionTokenContextMenu currencyInfo={currencyInfo} offsetX={offsetX} onClose={onClose}>
        {isLoading ? (
          <Loader.Box height={fonts.heading2.lineHeight} width={iconSizes.icon100} />
        ) : (
          <Text variant="heading2" textAlign="center">
            {headingText}
          </Text>
        )}
        <Flex centered row gap="$spacing8">
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon20} />
          {isLoading ? (
            <Loader.Box height={fonts.body2.lineHeight} width={iconSizes.icon48} />
          ) : (
            <Text color="$neutral2" variant="body2">
              {subtitleText}
            </Text>
          )}
        </Flex>
      </TransactionTokenContextMenu>
    </Flex>
  )
}
