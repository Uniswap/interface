import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutAnimation } from 'react-native'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenSelector, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { NumberType } from 'utilities/src/format/types'
import {
  useAddToSearchHistory,
  useCommonTokensOptions,
  useFavoriteTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForEmptySearch,
  useTokenSectionsForSearchResults,
} from 'wallet/src/components/TokenSelector/hooks'
import { MaxAmountButton } from 'wallet/src/components/input/MaxAmountButton'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useTokenWarningDismissed } from 'wallet/src/features/tokens/safetyHooks'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

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
  const { formatNumberOrString, convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()
  const { registerSearch } = useAddToSearchHistory()

  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const showMaxButton = currencyBalance && !currencyBalance.equalTo(0)
  const formattedCurrencyBalance = formatCurrencyAmount({
    value: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  if (showTokenSelector) {
    return (
      <Flex fill overflow="hidden">
        <TokenSelector
          activeAccountAddress={activeAccountAddress}
          addToSearchHistoryCallback={registerSearch}
          convertFiatAmountFormattedCallback={convertFiatAmountFormatted}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Transfer}
          formatNumberOrStringCallback={formatNumberOrString}
          isSurfaceReady={true}
          navigateToBuyOrReceiveWithEmptyWalletCallback={navigateToBuyOrReceiveWithEmptyWallet}
          useCommonTokensOptionsHook={useCommonTokensOptions}
          useFavoriteTokensOptionsHook={useFavoriteTokensOptions}
          useFilterCallbacksHook={useFilterCallbacks}
          usePopularTokensOptionsHook={usePopularTokensOptions}
          usePortfolioTokenOptionsHook={usePortfolioTokenOptions}
          useTokenSectionsForEmptySearchHook={useTokenSectionsForEmptySearch}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResults}
          useTokenWarningDismissedHook={useTokenWarningDismissed}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onDismiss={() => Keyboard.dismiss()}
          onPressAnimation={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
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
          <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
