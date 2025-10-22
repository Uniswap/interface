import { GqlResult } from '@universe/api'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SectionHeader } from 'uniswap/src/components/lists/SectionHeader'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'

function useTokenSectionsForSend({
  evmAddress,
  svmAddress,
  chainFilter,
}: TokenSectionsHookProps): GqlResult<OnchainItemSection<TokenOption>[]> {
  const {
    data: portfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ evmAddress, svmAddress, chainFilter })

  const loading = portfolioTokenOptionsLoading
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const sections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
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
      <SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />
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
  evmAddress,
  svmAddress,
  chainFilter,
  onSelectCurrency,
  onEmptyActionPress,
  renderedInModal,
}: TokenSectionsHookProps & {
  onSelectCurrency: OnSelectCurrency
  onEmptyActionPress: () => void
  renderedInModal: boolean
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSend({
    evmAddress,
    svmAddress,
    chainFilter,
  })
  const emptyElement = useMemo(() => <EmptyList onEmptyActionPress={onEmptyActionPress} />, [onEmptyActionPress])

  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={false}
      renderedInModal={renderedInModal}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSendList = memo(_TokenSelectorSendList)
