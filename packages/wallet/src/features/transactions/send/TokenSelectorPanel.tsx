import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Maybe } from 'graphql/jsutils/Maybe'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutAnimation } from 'react-native'
import { useSelector } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { TokenSelectorModal, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import {
  useCommonTokensOptions,
  useFilterCallbacks,
  usePopularTokensOptions,
  usePortfolioTokenOptions,
  useTokenSectionsForSearchResults,
} from 'uniswap/src/components/TokenSelector/hooks'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { selectSearchHistory } from 'uniswap/src/features/search/selectSearchHistory'
import { useTokenWarningDismissed } from 'uniswap/src/features/tokens/slice/hooks'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import {
  useAddToSearchHistory,
  useFavoriteTokensOptions,
  useTokenSectionsForEmptySearch,
} from 'wallet/src/components/TokenSelector/hooks'
import { MaxAmountButton } from 'wallet/src/components/input/MaxAmountButton'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
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
  const address = useActiveAccountAddressWithThrow()
  const valueModifiers = usePortfolioValueModifiers(address)
  const { formatNumberOrString, convertFiatAmountFormatted, formatCurrencyAmount } = useLocalizationContext()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()
  const { registerSearch } = useAddToSearchHistory()
  const searchHistory = useSelector(selectSearchHistory)

  const activeAccountAddress = useActiveAccountAddressWithThrow()

  const showMaxButton = currencyBalance && !currencyBalance.equalTo(0)
  const formattedCurrencyBalance = formatCurrencyAmount({
    value: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  return (
    <>
      <Flex fill overflow="hidden">
        <TokenSelectorModal
          activeAccountAddress={activeAccountAddress}
          addToSearchHistoryCallback={registerSearch}
          convertFiatAmountFormattedCallback={convertFiatAmountFormatted}
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Send}
          formatNumberOrStringCallback={formatNumberOrString}
          isModalOpen={showTokenSelector}
          isSurfaceReady={true}
          navigateToBuyOrReceiveWithEmptyWalletCallback={navigateToBuyOrReceiveWithEmptyWallet}
          searchHistory={searchHistory as TokenSearchResult[]}
          useCommonTokensOptionsHook={useCommonTokensOptions}
          useFavoriteTokensOptionsHook={useFavoriteTokensOptions}
          useFilterCallbacksHook={useFilterCallbacks}
          usePopularTokensOptionsHook={usePopularTokensOptions}
          usePortfolioTokenOptionsHook={usePortfolioTokenOptions}
          useTokenSectionsForEmptySearchHook={useTokenSectionsForEmptySearch}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResults}
          useTokenWarningDismissedHook={useTokenWarningDismissed}
          valueModifiers={valueModifiers}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onDismiss={() => Keyboard.dismiss()}
          onPressAnimation={() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)}
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
            {showMaxButton && onSetMax && (
              <MaxAmountButton
                currencyAmount={currencyAmount}
                currencyBalance={currencyBalance}
                currencyField={CurrencyField.INPUT}
                transactionType={TransactionType.Send}
                onSetMax={onSetMax}
              />
            )}
            <RotatableChevron color="$neutral3" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
        </Flex>
      </TouchableArea>
    </>
  )
}
