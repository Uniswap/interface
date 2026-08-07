import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { OnSelectCurrency, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSuggestedTilesMaxCount } from 'uniswap/src/components/TokenSelectorV2/constants'
import { useTokenSectionsForSendV2 } from 'uniswap/src/components/TokenSelectorV2/hooks/useTokenSectionsForSendV2'
import { TokenSelectorV2List } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2List'
import { TokenSelectorV2SectionHeader } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function SendEmptyList({ onEmptyActionPress }: { onEmptyActionPress?: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex>
      <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />
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

export function SendListV2({
  chainFilter,
  chainIds,
  portfolioData,
  renderedInModal,
  onSelectCurrency,
  onEmptyActionPress,
}: {
  chainFilter: UniverseChainId | null
  chainIds: UniverseChainId[]
  portfolioData: PortfolioBalancesResult
  renderedInModal: boolean
  onSelectCurrency: OnSelectCurrency
  onEmptyActionPress: () => void
}): JSX.Element {
  const {
    data: sections,
    loading,
    error,
    refetch,
  } = useTokenSectionsForSendV2({ chainFilter, chainIds, portfolioData })
  const emptyElement = useMemo(() => <SendEmptyList onEmptyActionPress={onEmptyActionPress} />, [onEmptyActionPress])

  return (
    <TokenSelectorV2List
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      hasError={Boolean(error)}
      loading={loading}
      refetch={refetch}
      sections={sections}
      showTokenWarnings={false}
      renderedInModal={renderedInModal}
      suggestedTilesMaxCount={getSuggestedTilesMaxCount(TokenSelectorVariation.BalancesOnly)}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
