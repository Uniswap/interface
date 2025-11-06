import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

interface TokenSelectorPanelProps {
  currencyInfo: Maybe<CurrencyInfo>
  currencyBalance: Maybe<CurrencyAmount<Currency>>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  showTokenSelector: boolean
  onSelectCurrency: ({
    currency,
    field,
    allowCrossChainPair,
  }: {
    currency: Currency
    field: CurrencyField
    allowCrossChainPair: boolean
  }) => void
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
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { formatCurrencyAmount } = useLocalizationContext()

  const showMaxButton = currencyBalance && !currencyBalance.equalTo(0)
  const formattedCurrencyBalance = formatCurrencyAmount({
    value: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  return (
    <>
      <Flex fill overflow="hidden">
        <TokenSelectorModal
          evmAddress={activeAccountAddress}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Send}
          isModalOpen={showTokenSelector}
          isSurfaceReady={true}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      </Flex>
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
            {showMaxButton && (
              <PresetAmountButton
                percentage="max"
                currencyAmount={currencyAmount}
                currencyBalance={currencyBalance}
                currencyField={CurrencyField.INPUT}
                transactionType={TransactionType.Send}
                onSetPresetValue={onSetMax}
              />
            )}
            <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
        </Flex>
      </TouchableArea>
    </>
  )
}
