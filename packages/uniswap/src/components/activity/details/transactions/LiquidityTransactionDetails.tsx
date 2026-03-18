import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import {
  TwoTokenDetails,
  useTokenAmountInfo,
  ValueText,
} from 'uniswap/src/components/activity/details/transactions/utilityComponents'
import { useTokenDetailsNavigation } from 'uniswap/src/components/activity/hooks/useTokenDetailsNavigation'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { LiquidityTransactionBaseInfos } from 'uniswap/src/features/transactions/types/transactionDetails'

export function LiquidityTransactionDetails({
  typeInfo,
  onClose,
}: {
  typeInfo: LiquidityTransactionBaseInfos
  onClose?: () => void
}): JSX.Element {
  const currency0 = useCurrencyInfo(typeInfo.currency0Id)
  const currency1 = useCurrencyInfo(typeInfo.currency1Id)

  const { currency0AmountRaw, currency1AmountRaw } = typeInfo

  return (
    <LiquidityTransactionContent
      currency0={currency0}
      currency0AmountRaw={currency0AmountRaw}
      currency1={currency1}
      currency1AmountRaw={currency1AmountRaw}
      onClose={onClose}
    />
  )
}

export function LiquidityTransactionContent({
  currency0,
  currency1,
  currency0AmountRaw,
  currency1AmountRaw,
  onClose,
}: {
  currency0: Maybe<CurrencyInfo>
  currency1: Maybe<CurrencyInfo>
  currency0AmountRaw: string
  currency1AmountRaw?: string
  onClose?: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const onPressToken0 = useTokenDetailsNavigation(currency0, onClose)

  const { descriptor: token0Descriptor, value: token0Value } = useTokenAmountInfo({
    currency: currency0?.currency,
    amountRaw: currency0AmountRaw,
  })
  const { descriptor: token1Descriptor, value: token1Value } = useTokenAmountInfo({
    currency: currency1?.currency,
    amountRaw: currency1AmountRaw || '0',
  })

  // Handle two token case

  if (currency1AmountRaw) {
    return (
      <TwoTokenDetails
        inputCurrency={currency0}
        outputCurrency={currency1}
        tokenDescriptorA={token0Descriptor}
        usdValueA={token0Value}
        tokenDescriptorB={token1Descriptor}
        usdValueB={token1Value}
        separatorElement={
          <Text variant="body3" color="$neutral2">
            {t('common.and')}
          </Text>
        }
      />
    )
  }

  // Handle single token case

  return (
    <Flex gap="$spacing16" px="$spacing8" py="$spacing12">
      <TouchableArea cursor="pointer" onPress={onPressToken0}>
        <Flex centered row justifyContent="space-between">
          <Flex>
            <Text variant="heading3">{token0Descriptor}</Text>
            <ValueText value={token0Value} />
          </Flex>
          <CurrencyLogo hideNetworkLogo currencyInfo={currency0} size={iconSizes.icon40} />
        </Flex>
      </TouchableArea>
      <Flex />
    </Flex>
  )
}
