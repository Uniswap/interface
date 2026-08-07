import { GqlResult } from '@universe/api'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { usePortfolioTokenOptions } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioTokenOptions'
import { TokenSectionsHookProps } from 'uniswap/src/components/TokenSelector/types'
import { TokenSelectorV2SectionHeader } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2SectionHeader'

/**
 * V2 send sections (SWAP-3050): same data as the legacy send hook (visible portfolio tokens +
 * expandable hidden tokens), rendered single-pane with the V2 section header. Send never gets
 * the My-tokens sidebar — the list already is the user's balances.
 */
export function useTokenSectionsForSendV2({
  chainFilter,
  chainIds,
  portfolioData,
}: Omit<TokenSectionsHookProps, 'variation' | 'addresses'> & {
  portfolioData: PortfolioBalancesResult
}): GqlResult<OnchainItemSection<TokenOption>[]> {
  const { t } = useTranslation()
  const {
    data: portfolioTokenOptions,
    hiddenTokens: hiddenPortfolioTokenOptions,
    error: portfolioTokenOptionsError,
    refetch: refetchPortfolioTokenOptions,
    loading: portfolioTokenOptionsLoading,
  } = usePortfolioTokenOptions({ chainFilter, chainIds, includeHidden: true, portfolioData })

  const [hiddenTokensExpanded, setHiddenTokensExpanded] = useState(false)

  const expandoElement = useMemo(() => {
    const hiddenTokensCount = hiddenPortfolioTokenOptions?.length ?? 0
    if (hiddenTokensCount === 0) {
      return undefined
    }
    return (
      <Flex backgroundColor="$surface1">
        <ExpandoRow
          isExpanded={hiddenTokensExpanded}
          label={t('hidden.tokens.info.text.button', { numHidden: hiddenTokensCount })}
          mx="$spacing20"
          onPress={(): void => {
            setHiddenTokensExpanded(!hiddenTokensExpanded)
          }}
        />
      </Flex>
    )
  }, [hiddenTokensExpanded, hiddenPortfolioTokenOptions?.length, t])

  const loading = portfolioTokenOptionsLoading
  const error = !portfolioTokenOptions && portfolioTokenOptionsError

  const yourTokensSectionHeader = useMemo(
    () => <TokenSelectorV2SectionHeader sectionKey={OnchainItemSectionName.YourTokens} />,
    [],
  )
  const visibleSections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.YourTokens,
    options: portfolioTokenOptions,
    sectionHeader: yourTokensSectionHeader,
  })

  const openHiddenSections = useOnchainItemListSection({
    sectionKey: OnchainItemSectionName.HiddenTokens,
    options: hiddenPortfolioTokenOptions,
    sectionHeader: expandoElement,
  })

  const closedHiddenSections: OnchainItemSection<TokenOption>[] = useMemo(
    () => [
      {
        sectionKey: OnchainItemSectionName.HiddenTokens,
        data: [],
        sectionHeader: expandoElement,
      },
    ],
    [expandoElement],
  )

  const sections = useMemo(() => {
    if (!visibleSections) {
      return undefined
    }
    if (openHiddenSections) {
      return [...visibleSections, ...(hiddenTokensExpanded ? openHiddenSections : closedHiddenSections)]
    }
    return visibleSections
  }, [visibleSections, openHiddenSections, closedHiddenSections, hiddenTokensExpanded])

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
