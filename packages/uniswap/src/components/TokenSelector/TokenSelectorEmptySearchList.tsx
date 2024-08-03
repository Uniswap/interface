import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSection,
} from 'uniswap/src/components/TokenSelector/types'
import { GqlResult } from 'uniswap/src/data/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'

function _TokenSelectorEmptySearchList({
  onDismiss,
  onSelectCurrency,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  useTokenSectionsForEmptySearchHook,
  useTokenWarningDismissedHook,
}: {
  onSelectCurrency: OnSelectCurrency
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
  useTokenWarningDismissedHook: (currencyId: Maybe<string>) => {
    tokenWarningDismissed: boolean
    dismissWarningCallback: () => void
  }
  useTokenSectionsForEmptySearchHook: () => GqlResult<TokenSection[]>
}): JSX.Element {
  const { t } = useTranslation()

  const { data: sections, loading, error, refetch } = useTokenSectionsForEmptySearchHook()

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
