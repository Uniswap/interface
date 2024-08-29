import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSectionsForEmptySearchHookType,
} from 'uniswap/src/components/TokenSelector/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { UniverseChainId } from 'uniswap/src/types/chains'

function _TokenSelectorEmptySearchList({
  onDismiss,
  chainFilter,
  onSelectCurrency,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenSectionsForEmptySearchHook,
  useTokenWarningDismissedHook,
}: {
  onSelectCurrency: OnSelectCurrency
  chainFilter: UniverseChainId | null
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
  useTokenWarningDismissedHook: (currencyId: Maybe<string>) => {
    tokenWarningDismissed: boolean
    dismissWarningCallback: () => void
  }
  useTokenSectionsForEmptySearchHook: TokenSectionsForEmptySearchHookType
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useTokenSectionsForEmptySearchHook(chainFilter)

  return (
    <TokenSelectorList
      showTokenAddress
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      errorText={t('token.selector.search.error')}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={true}
      useTokenWarningDismissedHook={useTokenWarningDismissedHook}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorEmptySearchList = memo(_TokenSelectorEmptySearchList)
