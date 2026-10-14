import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, useIsTouchDevice } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useEvent } from 'utilities/src/react/hooks'
import { stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { OrderDirection } from '~/data/util'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { PoolsTradeBadge } from '~/features/Toucan/Shared/PoolsTradeBadge'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'
import { isPoolsSupportedChain } from '~/features/Toucan/utils/quickLaunchLinks'
import { scrollToExploreTokenSection } from '~/pages/Explore/categories/useExploreCategory'

/**
 * Sort fields for auction table
 */
export enum AuctionSortField {
  FDV = 'FDV',
  COMMITTED_VOLUME = 'Committed Volume',
  LAUNCH_THRESHOLD = 'Launch Threshold',
  TIME_REMAINING = 'Time Remaining',
}

export function AuctionTableHeader({
  category,
  isCurrentSortMethod,
  direction,
  onSort,
}: {
  category: AuctionSortField
  isCurrentSortMethod: boolean
  direction: OrderDirection
  onSort: () => void
}) {
  const { t } = useTranslation()
  const isTouchDevice = useIsTouchDevice()
  const handleSortCategory = useEvent(() => {
    onSort()
    scrollToExploreTokenSection()
  })

  const HEADER_TEXT = {
    [AuctionSortField.FDV]: t('toucan.auction.fdvAtFloor'),
    [AuctionSortField.COMMITTED_VOLUME]: t('toucan.auction.committedVol'),
    [AuctionSortField.LAUNCH_THRESHOLD]: t('toucan.auction.launchThreshold'),
    [AuctionSortField.TIME_REMAINING]: t('common.status'),
  }

  const HEADER_TOOLTIP: Partial<Record<AuctionSortField, string>> = {
    [AuctionSortField.FDV]: t('toucan.auction.fdvAtFloor.tooltip'),
    [AuctionSortField.COMMITTED_VOLUME]: t('toucan.auction.committedVolume.tooltip'),
    [AuctionSortField.LAUNCH_THRESHOLD]: t('toucan.auction.launchThreshold.tooltip'),
  }

  const tooltipText = HEADER_TOOLTIP[category]

  return (
    <ClickableHeaderRow justifyContent="flex-end" onPress={handleSortCategory} group>
      <Flex row gap="$gap4" alignItems="center">
        <Flex opacity={isCurrentSortMethod ? 1 : 0}>
          <HeaderArrow orderDirection={direction} size="$icon.16" />
        </Flex>
        <HeaderSortText active={isCurrentSortMethod} variant="body3">
          {HEADER_TEXT[category]}
        </HeaderSortText>
        {tooltipText && (
          <MouseoverTooltip text={tooltipText} placement="top" size={TooltipSize.Small}>
            {/* On touch devices a tap on the info icon must show the tooltip, not sort — the sort
                re-render would unmount the tooltip before it opens. Desktop keeps click-to-sort
                since hover already shows the tooltip. */}
            <Flex alignItems="center" justifyContent="center" {...(isTouchDevice ? stopPropagationPressProps : {})}>
              <InfoCircleFilled color="$neutral3" size="$icon.16" />
            </Flex>
          </MouseoverTooltip>
        )}
      </Flex>
    </ClickableHeaderRow>
  )
}

export function TokenNameCell({ auction }: { auction: EnrichedAuction }) {
  const isTouchDevice = useIsTouchDevice()
  // QuickLaunch: pools.trade logo in the verified-icon slot; curated verified wins when both apply.
  // Off a pools.xyz-served chain the brand attribution would be false provenance.
  const isQuickLaunchBadgeEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const showQuickLaunchBadge =
    isQuickLaunchBadgeEnabled &&
    !auction.verified &&
    isQuickLaunchAuction(auction) &&
    isPoolsSupportedChain(auction.auction?.chainId)
  return (
    <Flex row gap="$gap8" alignItems="center" justifyContent="flex-start">
      <Flex pr="$spacing4">
        {/* logoUrl already resolves API image -> config override -> indexed logo (see useTopAuctions) */}
        <TokenLogo
          url={auction.logoUrl}
          size={24}
          chainId={auction.auction?.chainId}
          symbol={auction.auction?.tokenSymbol}
          name={auction.auction?.tokenName}
        />
      </Flex>
      <EllipsisText>
        {auction.auction?.tokenName ?? auction.auction?.tokenSymbol ?? auction.auction?.tokenAddress ?? '—'}
      </EllipsisText>
      <EllipsisText $platform-web={{ minWidth: 'fit-content' }} $lg={{ display: 'none' }} color="$neutral2">
        {auction.auction?.tokenSymbol}
      </EllipsisText>
      {auction.verified && <CheckmarkCircle size="$icon.16" color="$accent1" />}
      {showQuickLaunchBadge && (
        // The logo-only badge's tooltip is the sole carrier of the pools.trade attribution, and on
        // touch devices a tap would otherwise land on the clickable row and navigate before the
        // tooltip opens — same fix as the sort-header info icon above. Desktop keeps click-through
        // since hover already shows the tooltip.
        <Flex alignItems="center" justifyContent="center" {...(isTouchDevice ? stopPropagationPressProps : {})}>
          <PoolsTradeBadge />
        </Flex>
      )}
    </Flex>
  )
}
