import { Flex, useIsTouchDevice } from '@universe/mycelium'
import { InfoCircleFilled } from '@universe/mycelium/icons/InfoCircleFilled'
import { useTranslation } from 'react-i18next'
import { useEvent } from 'utilities/src/react/hooks'
import { stopPropagationPressProps } from 'utilities/src/react/stopPropagation'
import { ClickableHeaderRow, HeaderArrow, HeaderSortText } from '~/components/Table/shared/SortableHeader'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import type { OrderDirection } from '~/data/util'
import { AuctionSortField } from '~/features/Toucan/AuctionDiscovery/TopAuctionsTable/types'

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
