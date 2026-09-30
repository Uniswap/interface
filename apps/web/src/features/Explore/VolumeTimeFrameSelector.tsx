import { UniverseChainId } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'ui/src/components/icons/Check'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { TimePeriod } from '~/data/util'
import { useExploreParams } from '~/features/Explore/hooks/useExploreParams'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { getTimePeriodLabel, ORDERED_TIMES, SOLANA_ORDERED_TIMES } from '~/features/Explore/timeLabels'
import { getChainIdFromChainUrlParam } from '~/utils/params/chainParams'

// TODO: change this to reflect data pipeline
export function VolumeTimeFrameSelector() {
  const { t } = useTranslation()
  const [isMenuOpen, toggleMenu] = useState(false)
  const activeTime = useExploreTablesFilterStore((s) => s.timePeriod)
  const { setTimePeriod: setTime } = useExploreTablesFilterStoreActions()

  const media = useMedia()
  const isLargeScreen = !media.xl

  const getLabel = useCallback((period: TimePeriod) => getTimePeriodLabel(t, period), [t])

  // Solana volume data is only available for time frames < 1 day
  const { chainName } = useExploreParams()
  const currentChainId = chainName ? getChainIdFromChainUrlParam(chainName) : undefined
  const orderedTimes = currentChainId === UniverseChainId.Solana ? SOLANA_ORDERED_TIMES : ORDERED_TIMES
  useEffect(() => {
    // if the current displayed time period is not available for Solana, set it 1 Day
    if (currentChainId === UniverseChainId.Solana && !SOLANA_ORDERED_TIMES.includes(activeTime)) {
      setTime(TimePeriod.DAY)
    }
  }, [currentChainId, activeTime, setTime])

  return (
    <Flex>
      <Dropdown
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={
          <Text width="max-content">{`${getLabel(activeTime)} ${isLargeScreen ? t('common.volume').toLowerCase() : ''}`}</Text>
        }
        dataTestId={TestID.TimeSelector}
        buttonStyle={{ height: 40, width: 'max-content' }}
        dropdownStyle={{
          maxHeight: 300,
          width: 'max-content',
          minWidth: 200,
          // Longest label across locales is vi-VN "Mọi thời điểm khối lượng", so cap rather than let it run wide.
          maxWidth: 'min(320px, calc(100vw - 32px))',
        }}
        adaptToSheet
        allowFlip
        alignRight={!media.lg}
      >
        {orderedTimes.map((time) => (
          <InternalMenuItem
            key={time}
            data-testid={getLabel(time)}
            onPress={() => {
              setTime(time)
              sendAnalyticsEvent(InterfaceEventName.ExploreTableFilterSelected, {
                filter_type: 'volume_time_period',
                filter_value: time,
              })
              toggleMenu(false)
            }}
          >
            {getLabel(time)} {t('common.volume').toLowerCase()}
            {time === activeTime && <Check color="$accent1" size="$icon.16" />}
          </InternalMenuItem>
        ))}
      </Dropdown>
    </Flex>
  )
}
