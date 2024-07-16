import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { SectionHeader, TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import {
  ConvertFiatAmountFormattedCallback,
  OnSelectCurrency,
  TokenSection,
  TokenSectionsForSend,
} from 'uniswap/src/components/TokenSelector/types'
import { getTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { GqlResult } from 'uniswap/src/data/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'

function useTokenSectionsForSend({
  activeAccountAddress,
  chainFilter,
  usePortfolioTokenOptionsHook,
}: TokenSectionsForSend): GqlResult<TokenSection[]> {
  const { t } = useTranslation()

  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptionsHook(activeAccountAddress, chainFilter)

  const loading = portfolioTokenOptionsLoading
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const sections = useMemo(
    () => getTokenOptionsSection(t('tokens.selector.section.yours'), portfolioTokenOptions),
    [portfolioTokenOptions, t],
  )

  return useMemo(
    () => ({
      data: sections,
      loading,
      error: error || undefined,
      refetch: refetchPortfolioTokenOptions,
    }),
    [error, loading, refetchPortfolioTokenOptions, sections],
  )
}

function EmptyList({ onEmptyActionPress }: { onEmptyActionPress?: () => void }): JSX.Element {
  const { t } = useTranslation()
  // This flag is enabled only for supported countries.
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)

  return (
    <Flex>
      <SectionHeader title={t('tokens.selector.section.yours')} />
      <Flex pt="$spacing16" px="$spacing16">
        <BaseCard.EmptyState
          buttonLabel={
            forAggregatorEnabled && onEmptyActionPress
              ? t('tokens.selector.empty.buy.title')
              : t('tokens.selector.empty.receive.title')
          }
          description={
            forAggregatorEnabled ? t('tokens.selector.empty.buy.message') : t('tokens.selector.empty.receive.message')
          }
          title={t('tokens.selector.empty.title')}
          onPress={onEmptyActionPress}
        />
      </Flex>
    </Flex>
  )
}

function _TokenSelectorSendList({
  onDismiss,
  onSelectCurrency,
  activeAccountAddress,
  chainFilter,
  onEmptyActionPress,
  formatNumberOrStringCallback,
  convertFiatAmountFormattedCallback,
  usePortfolioTokenOptionsHook,
  useTokenWarningDismissedHook,
}: TokenSectionsForSend & {
  onSelectCurrency: OnSelectCurrency
  onEmptyActionPress: () => void
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  onDismiss: () => void
  useTokenWarningDismissedHook: (currencyId: Maybe<string>) => {
    tokenWarningDismissed: boolean
    dismissWarningCallback: () => void
  }
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSend({
    activeAccountAddress,
    chainFilter,
    usePortfolioTokenOptionsHook,
  })
  const emptyElement = useMemo(() => <EmptyList onEmptyActionPress={onEmptyActionPress} />, [onEmptyActionPress])

  return (
    <TokenSelectorList
      chainFilter={chainFilter}
      convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
      emptyElement={emptyElement}
      formatNumberOrStringCallback={formatNumberOrStringCallback}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={false}
      useTokenWarningDismissedHook={useTokenWarningDismissedHook}
      onDismiss={onDismiss}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSendList = memo(_TokenSelectorSendList)
