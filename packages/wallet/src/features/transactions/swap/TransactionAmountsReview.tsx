import { useTranslation } from 'react-i18next'
import { Button, Flex, Icons, Text, isWeb, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

export function TransactionAmountsReview({
  acceptedDerivedSwapInfo,
  newTradeRequiresAcceptance,
  onClose,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  newTradeRequiresAcceptance: boolean
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted, formatCurrencyAmount, formatNumberOrString } =
    useLocalizationContext()

  const {
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    exactAmountToken,
    exactCurrencyField,
  } = acceptedDerivedSwapInfo

  const currencyInInfo = currencies[CurrencyField.INPUT]
  const currencyOutInfo = currencies[CurrencyField.OUTPUT]

  const usdAmountIn =
    exactCurrencyField === CurrencyField.INPUT
      ? currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact()
      : acceptedDerivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact()

  const usdAmountOut =
    exactCurrencyField === CurrencyField.OUTPUT
      ? currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact()
      : acceptedDerivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact()

  const formattedFiatAmountIn = convertFiatAmountFormatted(
    usdAmountIn,
    NumberType.FiatTokenQuantity
  )
  const formattedFiatAmountOut = convertFiatAmountFormatted(
    usdAmountOut,
    NumberType.FiatTokenQuantity
  )

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = formatCurrencyAmount({
    value: acceptedDerivedSwapInfo?.currencyAmounts[derivedCurrencyField],
    type: NumberType.TokenTx,
  })

  const formattedExactAmountToken = formatNumberOrString({
    value: exactAmountToken,
    type: NumberType.TokenTx,
  })

  const [formattedTokenAmountIn, formattedTokenAmountOut] =
    exactCurrencyField === CurrencyField.INPUT
      ? [formattedExactAmountToken, derivedAmount]
      : [derivedAmount, formattedExactAmountToken]

  const shouldDimInput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.OUTPUT
  const shouldDimOutput = newTradeRequiresAcceptance && exactCurrencyField === CurrencyField.INPUT

  if (
    !currencyInInfo ||
    !currencyOutInfo ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT] ||
    !acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.INPUT] ||
    !acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]
  ) {
    // This should never happen. It's just to keep TS happy.
    throw new Error(
      'Missing required props in `derivedSwapInfo` to render `TransactionAmountsReview` screen.'
    )
  }

  return (
    <Flex $short={{ gap: '$spacing8' }} gap="$spacing16" ml="$spacing12" mr="$spacing12">
      <Flex row alignItems="center">
        <Flex fill>
          <Text color="$neutral2" variant="body2">
            {t('swap.review.summary')}
          </Text>
        </Flex>
        {isWeb && (
          <Button
            backgroundColor="$transparent"
            color="$neutral2"
            icon={<Icons.X size="$icon.20" />}
            p="$none"
            theme="secondary"
            onClick={onClose}
          />
        )}
      </Flex>

      <CurrencyValueWithIcon
        currencyInfo={currencyInInfo}
        formattedFiatAmount={formattedFiatAmountIn}
        formattedTokenAmount={formattedTokenAmountIn}
        shouldDim={shouldDimInput}
      />

      <Icons.ArrowDown color={colors.neutral3.get()} size={20} />

      <CurrencyValueWithIcon
        currencyInfo={currencyOutInfo}
        formattedFiatAmount={formattedFiatAmountOut}
        formattedTokenAmount={formattedTokenAmountOut}
        shouldDim={shouldDimOutput}
      />
    </Flex>
  )
}

function CurrencyValueWithIcon({
  currencyInfo,
  formattedFiatAmount,
  formattedTokenAmount,
  shouldDim,
}: {
  currencyInfo: CurrencyInfo
  formattedFiatAmount: string
  formattedTokenAmount: string
  shouldDim: boolean
}): JSX.Element {
  return (
    <Flex centered grow row>
      <Flex grow gap="$spacing4">
        <Text color={shouldDim ? '$neutral3' : '$neutral1'} variant="heading3">
          {formattedTokenAmount} {getSymbolDisplayText(currencyInfo.currency.symbol)}
        </Text>

        <Text color={shouldDim ? '$neutral3' : '$neutral2'} variant="body2">
          {formattedFiatAmount}
        </Text>
      </Flex>

      <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon40} />
    </Flex>
  )
}
