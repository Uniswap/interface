import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import {
  OnSelectCurrency,
  TokenOptionSection,
  TokenSection,
  TokenSectionsHookProps,
} from 'uniswap/src/components/TokenSelector/types'
import { useTokenOptionsSection } from 'uniswap/src/components/TokenSelector/utils'
import { SectionHeader } from 'uniswap/src/components/lists/TokenSectionHeader'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { GqlResult } from 'uniswap/src/data/types'

function useTokenSectionsForSend({
  activeAccountAddress,
  chainFilter,
}: TokenSectionsHookProps): GqlResult<TokenSection<TokenOption>[]> {
  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions(activeAccountAddress, chainFilter)

  const loading = portfolioTokenOptionsLoading
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const sections = useTokenOptionsSection({
    sectionKey: TokenOptionSection.YourTokens,
    tokenOptions: portfolioTokenOptions,
  })

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

  return (
    <Flex>
      <SectionHeader sectionKey={TokenOptionSection.YourTokens} />
      <Flex pt="$spacing16" px="$spacing16">
        <BaseCard.EmptyState
          buttonLabel={
            onEmptyActionPress ? t('tokens.selector.empty.buy.title') : t('tokens.selector.empty.receive.title')
          }
          description={t('tokens.selector.empty.buy.message')}
          title={t('tokens.selector.empty.title')}
          onPress={onEmptyActionPress}
        />
      </Flex>
    </Flex>
  )
}

function _TokenSelectorSendList({
  activeAccountAddress,
  chainFilter,
  isKeyboardOpen,
  onSelectCurrency,
  onEmptyActionPress,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  onEmptyActionPress: () => void
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSend({
    activeAccountAddress,
    chainFilter,
  })
  const emptyElement = useMemo(() => <EmptyList onEmptyActionPress={onEmptyActionPress} />, [onEmptyActionPress])

  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={false}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSendList = memo(_TokenSelectorSendList)
