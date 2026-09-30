import { UniverseChainId } from '@universe/chains'
import { useTokenSectionsForEmptySearch } from 'uniswap/src/components/TokenSelector/hooks/useTokenSectionsForEmptySearch'
import { OnSelectCurrency, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { getSuggestedTilesMaxCount } from 'uniswap/src/components/TokenSelectorV2/constants'
import { TokenSelectorV2List } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2List'
import { useSectionsWithV2Headers } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'

export function EmptySearchListV2({
  addresses,
  chainFilter,
  chainIds,
  variation,
  renderedInModal,
  onSelectCurrency,
}: {
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  chainIds: UniverseChainId[]
  variation: TokenSelectorVariation
  renderedInModal: boolean
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const {
    data: sections,
    isLoading,
    error,
    refetch,
  } = useTokenSectionsForEmptySearch({ addresses, chainFilter, chainIds })

  // The legacy hook returns legacy-styled headers; swap in V2 headers so the pane doesn't mix styles.
  const v2Sections = useSectionsWithV2Headers(sections)

  // Recent searches are local, so a failed trending fetch shouldn't replace them with the error pane.
  const hasError = Boolean(error) && !sections?.length

  return (
    <TokenSelectorV2List
      chainFilter={chainFilter}
      hasError={hasError}
      loading={isLoading}
      refetch={refetch}
      sections={v2Sections}
      showTokenWarnings={true}
      renderedInModal={renderedInModal}
      suggestedTilesMaxCount={getSuggestedTilesMaxCount(variation)}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
