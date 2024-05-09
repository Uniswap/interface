import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import {
  TokenSelector,
  TokenSelectorVariation,
} from 'wallet/src/components/TokenSelector/TokenSelector'
import { MaxAmountButton } from 'wallet/src/components/input/MaxAmountButton'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'

interface TokenSelectorPanelProps {
  currencyInfo: Maybe<CurrencyInfo>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  showTokenSelector: boolean
  onSelectCurrency: (currency: Currency, field: CurrencyField, context: SearchContext) => void
  onHideTokenSelector: () => void
  onShowTokenSelector: () => void
  onSetMax: (amount: string) => void
}

export function TokenSelectorPanel({
  currencyInfo,
  currencyBalance,
  currencyAmount,
  onSetMax,
  onSelectCurrency,
  onHideTokenSelector,
  onShowTokenSelector,
  showTokenSelector,
}: TokenSelectorPanelProps): JSX.Element {
  const { t } = useTranslation()
  const { formatCurrencyAmount } = useLocalizationContext()

  const showMaxButton = currencyBalance && !currencyBalance.equalTo(0)
  const formattedCurrencyBalance = formatCurrencyAmount({
    value: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  if (showTokenSelector) {
    return (
      <Flex fill overflow="hidden">
        <TokenSelector
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Transfer}
          isSurfaceReady={true}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      </Flex>
    )
  }

  return (
    <TouchableArea onPress={onShowTokenSelector}>
      <Flex centered row justifyContent="space-between" p="$spacing16">
        <Flex centered row gap="$spacing12">
          <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon36} />
          <Flex gap="$none">
            <Text color="$neutral1" variant="body2">
              {currencyInfo?.currency.name}
            </Text>
            {currencyInfo && (
              <Text color="$neutral2" variant="body3">
                {t('send.input.token.balance.title', {
                  balance: formattedCurrencyBalance,
                  symbol: currencyInfo.currency.symbol,
                })}
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex row gap="$spacing12">
          {showMaxButton && onSetMax && (
            <MaxAmountButton
              currencyAmount={currencyAmount}
              currencyBalance={currencyBalance}
              currencyField={CurrencyField.INPUT}
              onSetMax={onSetMax}
            />
          )}
          <RotatableChevron
            color="$neutral3"
            direction="down"
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
