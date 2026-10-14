import { SharedEventName } from '@uniswap/analytics-events'
import { Flex } from '@universe/mycelium'
import React from 'react'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import { ElementName, MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * One token-grouping row on the category screen: parent ticker row that expands to per-issuer
 * sub-rows (multi-issuer) or navigates straight to the TDP (single issuer). The default
 * ExpandableAssetGroup issuer renderer is used — no context menus, matching the screen list rows.
 */
export function CategoryGroupingRow({
  grouping,
  categoryId,
  index,
  itemKey,
  isExpanded,
  onToggle,
}: {
  // Served by the RWA endpoints until ListTokensGrouped lands; only the data type should change then.
  grouping: Rwa
  categoryId: string
  index: number
  itemKey: string
  isExpanded: boolean
  // Keyed callback so the parent can pass one stable handler to every row — an inline arrow per
  // cell would defeat itemsAreEqual/recycleItems memoization.
  onToggle: (key: string) => void
}): JSX.Element {
  const { chains: enabledChainIds } = useEnabledChains()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const trace = useTrace()

  const selectIssuer = useEvent((issuer: IssuerToken): void => {
    const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
    if (!resolved) {
      logger.warn('CategoryGroupingRow', 'selectIssuer', 'Grouping issuer has no enabled/supported chainToken', {
        issuer: issuer.issuer,
        symbol: grouping.symbol,
      })
      return
    }
    sendAnalyticsEvent(MobileEventName.ExploreTokenItemSelected, {
      address: resolved.chainToken.address,
      chain: resolved.chainId,
      name: issuer.name,
      position: index + 1,
      category_id: categoryId,
      issuer: issuer.issuer,
    })
    tokenDetailsNavigation.navigate(buildCurrencyId(resolved.chainId, resolved.chainToken.address))
  })

  const handleToggle = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.TokensTableGroupRow,
      token_symbol: grouping.symbol,
      token_list_rank: index + 1,
      category_id: categoryId,
    })
    onToggle(itemKey)
  })

  const canExpand = grouping.issuerTokens.length > 1
  const soleIssuer = canExpand ? undefined : grouping.issuerTokens[0]

  return (
    // 12 + the row's internal 12 = 24, matching TokenItem's inset so grouped rows align with token rows.
    <Flex px="$spacing12">
      <ExpandableAssetGroup
        showIssuerTag
        asset={grouping}
        enabledChainIds={enabledChainIds}
        isExpanded={isExpanded}
        // The whole screen is one category, so the per-row category tag is redundant here.
        showCategoryTag={false}
        onToggle={handleToggle}
        onParentPress={soleIssuer && ((): void => selectIssuer(soleIssuer))}
        onIssuerPress={selectIssuer}
      />
    </Flex>
  )
}
