import { UniverseChainId } from '@universe/chains'
import { Flex, Text, zIndexes } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@universe/mycelium/shadcn'
import { useMedia, useScrollbarStyles, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { TriggerButtonCompat } from '@universe/mycelium/trigger-button-compat'
import { TestID } from '@universe/test'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { TimePeriod } from '~/data/util'
import { useEffectiveVolumeTimePeriod } from '~/features/Explore/hooks/useEffectiveVolumeTimePeriod'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import { useExploreTablesFilterStoreActions } from '~/features/Explore/state/exploreTablesFilterStore'
import {
  getDayBasedTimePeriodLabel,
  getTimePeriodLabel,
  ORDERED_TIMES,
  SOLANA_ORDERED_TIMES,
} from '~/features/Explore/timeLabels'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

const DROPDOWN_OFFSET = 10

// TODO: change this to reflect data pipeline
export function VolumeTimeFrameSelector({
  supportedPeriods,
}: {
  /** Explicit periods use day-based labels and skip the legacy Solana store clamp. */
  supportedPeriods?: readonly TimePeriod[]
} = {}): JSX.Element {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const activeTime = useEffectiveVolumeTimePeriod(supportedPeriods)
  const { setTimePeriod: setTime } = useExploreTablesFilterStoreActions()

  const media = useMedia()
  const headerHeight = useAppHeaderHeight()
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const isLargeScreen = !media.xl

  const getLabel = useCallback(
    (period: TimePeriod) =>
      supportedPeriods !== undefined ? getDayBasedTimePeriodLabel(t, period) : getTimePeriodLabel(t, period),
    [supportedPeriods, t],
  )
  const activeLabel = `${getLabel(activeTime)} ${t('common.volume').toLowerCase()}`

  // Solana volume data is only available for time frames < 1 day
  const { chainName } = useExploreParams()
  const currentChainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined
  const orderedTimes =
    supportedPeriods ?? (currentChainId === UniverseChainId.Solana ? SOLANA_ORDERED_TIMES : ORDERED_TIMES)
  useEffect(() => {
    // if the current displayed time period is not available for Solana, set it 1 Day
    if (
      supportedPeriods === undefined &&
      currentChainId === UniverseChainId.Solana &&
      !SOLANA_ORDERED_TIMES.includes(activeTime)
    ) {
      setTime(TimePeriod.DAY)
    }
  }, [currentChainId, activeTime, setTime, supportedPeriods])

  return (
    <Flex>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <DropdownMenuTrigger
          nativeButton={false}
          render={
            <TriggerButtonCompat
              isExpanded={isMenuOpen}
              testID={TestID.TimeSelector}
              tooltipLabel={isLargeScreen ? undefined : activeLabel}
              className="h-[40px] w-max pl-[14px]"
            />
          }
        >
          <Text width="max-content">{isLargeScreen ? activeLabel : getLabel(activeTime)}</Text>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          unstyled
          sideOffset={DROPDOWN_OFFSET}
          align={media.lg ? 'start' : 'end'}
          positionerProps={{
            // Exclude the sticky header while preserving Base UI's other viewport padding defaults.
            collisionPadding: { top: headerHeight, right: 5, bottom: 5, left: 5 },
            style: { zIndex: zIndexes.dropdown },
          }}
          render={
            <Flex
              {...shadowProps}
              style={scrollbarStyles}
              className="outline-none transition-opacity duration-150 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0"
              flexDirection="column"
              backgroundColor="$surface1"
              borderWidth={0.5}
              borderStyle="solid"
              borderColor="$surface3"
              borderRadius="$rounded12"
              p="$spacing8"
              overflow="auto"
              maxHeight="min(300px, var(--available-height))"
              width="max-content"
              minWidth={200}
              // Longest label across locales is vi-VN "Mọi thời điểm khối lượng", so cap rather than let it run wide.
              maxWidth="min(320px, calc(100vw - 32px))"
            />
          }
        >
          {orderedTimes.map((time) => (
            <DropdownMenuItem
              key={time}
              unstyled
              nativeButton={false}
              data-testid={getLabel(time)}
              render={<InternalMenuItem className="outline-none data-highlighted:bg-surface3" />}
              onClick={() => {
                setTime(time)
                sendAnalyticsEvent(InterfaceEventName.ExploreTableFilterSelected, {
                  filter_type: 'volume_time_period',
                  filter_value: time,
                })
              }}
            >
              {getLabel(time)} {t('common.volume').toLowerCase()}
              {time === activeTime && <Check color="$accent1" size="$icon.16" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  )
}
