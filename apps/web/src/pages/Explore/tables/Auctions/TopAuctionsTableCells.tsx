import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, useIsTouchDevice } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useEvent } from 'utilities/src/react/hooks'
import { stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { EllipsisText } from '~/components/Table/shared/TableText'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { OrderDirection } from '~/data/util'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'
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
  // QuickLaunch: quick-launch badge in the verified-icon slot; Lightning until design adds a fire icon.
  const isQuickLaunchBadgeEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  const showQuickLaunchBadge = isQuickLaunchBadgeEnabled && !auction.verified && isQuickLaunchAuction(auction)
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
      {showQuickLaunchBadge && <Lightning size="$icon.16" color="$statusWarning" />}
    </Flex>
  )
}
