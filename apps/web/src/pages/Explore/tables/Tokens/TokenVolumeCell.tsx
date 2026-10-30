import { Flex } from '@universe/mycelium'
import { InfoCircle } from '@universe/mycelium/icons/InfoCircle'
import { TestID } from '@universe/test'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber.web'
import { Cell } from '~/components/Table/Cell'
import { TimePeriod } from '~/data/util'
import type { TokenTableValue } from '~/pages/Explore/tables/Tokens/tokenTableTypes'
import { hasVolumeBreakdown } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/utils'
import { VolumeByNetworkPopover } from '~/pages/Explore/tables/Tokens/VolumeByNetworkPopover/VolumeByNetworkPopover'

const VOLUME_INFO_ICON_WIDTH = 16

export function TokenVolumeCell({
  row,
  value,
  timePeriod,
  loading,
  textVariant,
}: {
  row?: TokenTableValue
  value: string
  timePeriod: TimePeriod
  loading: boolean
  textVariant: AnimatedNumberProps['textVariant']
}) {
  if (!row) {
    return (
      <Cell loading={loading} grow overflow="visible" testId={TestID.VolumeCell}>
        <AnimatedNumber ellipsis alignRight numericValue={undefined} textVariant={textVariant} value={value} />
      </Cell>
    )
  }
  // Same gate as the popover's own showPopover, so the icon can never render without a
  // breakdown behind it (a stats-less leg raises the network count but adds no row).
  const showBreakdownAffordance = hasVolumeBreakdown({
    rankedToken: row.mcToken,
    timePeriod,
    visibleChainIds: row.chainIdsByVolume,
  })
  return (
    <Cell loading={loading} grow overflow="visible" testId={TestID.VolumeCell}>
      <Flex flex={1} minWidth={0} justifyContent="flex-end">
        <VolumeByNetworkPopover
          rankedToken={row.mcToken}
          timePeriod={timePeriod}
          visibleChainIds={row.chainIdsByVolume}
        >
          <Flex position="relative">
            {/* Named trade: the cell keeps the backend aggregate (the value the column is
                sorted by), while the popover header shows the visible-leg sum its rows'
                percentages are computed against; they differ when a leg is hidden or
                stats-less. Filtering the cell would desync it from the sort order. */}
            <AnimatedNumber
              ellipsis
              alignRight
              numericValue={row.volumeRawValue}
              textVariant={textVariant}
              value={value}
            />
            {showBreakdownAffordance ? (
              <Flex
                centered
                position="absolute"
                width={VOLUME_INFO_ICON_WIDTH}
                alignItems="flex-end"
                top={0}
                right={-VOLUME_INFO_ICON_WIDTH}
                bottom={0}
                opacity={0}
                cursor="default"
                transition="opacity 0.15s ease"
                $group-hover={{ opacity: 1 }}
              >
                <InfoCircle color="$neutral3" size="$icon.12" />
              </Flex>
            ) : null}
          </Flex>
        </VolumeByNetworkPopover>
      </Flex>
    </Cell>
  )
}
