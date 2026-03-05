import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { TimePeriod } from '~/appGraphql/data/util'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { getTimePeriodLabel, ORDERED_TIMES, SOLANA_ORDERED_TIMES } from '~/components/Explore/constants'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/pages/Explore/exploreTablesFilterStore'
import { useExploreParams } from '~/pages/Explore/redirects'
import { getChainIdFromChainUrlParam } from '~/utils/chainParams'

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
        menuLabel={`${getLabel(activeTime)} ${isLargeScreen ? t('common.volume').toLowerCase() : ''}`}
        dataTestId={TestID.TimeSelector}
        buttonStyle={{ height: 40 }}
        dropdownStyle={{ maxHeight: 300 }}
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
