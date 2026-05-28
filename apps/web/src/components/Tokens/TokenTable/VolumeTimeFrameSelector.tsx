/* eslint-disable import/no-unused-modules */
import { RingChartTimePeriod, RingTimePeriod, TimePeriod } from 'appGraphql/data/util'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { filterRingTimeAtom, filterTimeAtom } from 'components/Tokens/state'
import { useAtom } from 'jotai'
import { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, useMedia } from 'ui/src'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export enum TimePeriodDisplay {
  HOUR = '1H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
}

enum RingTimePeriodDisplay {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  // YEAR = '1Y',
}

export enum RingChartTimePeriodDisplay {
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1M',
  YEAR = '1Y',
}

export const DISPLAYS: Record<TimePeriod, TimePeriodDisplay> = {
  [TimePeriod.HOUR]: TimePeriodDisplay.HOUR,
  [TimePeriod.DAY]: TimePeriodDisplay.DAY,
  [TimePeriod.WEEK]: TimePeriodDisplay.WEEK,
  [TimePeriod.MONTH]: TimePeriodDisplay.MONTH,
  [TimePeriod.YEAR]: TimePeriodDisplay.YEAR,
}

const RING_DISPLAYS: Record<RingTimePeriod, RingTimePeriodDisplay> = {
  [RingTimePeriod.DAY]: RingTimePeriodDisplay.DAY,
  [RingTimePeriod.WEEK]: RingTimePeriodDisplay.WEEK,
  [RingTimePeriod.MONTH]: RingTimePeriodDisplay.MONTH,
  // [RingTimePeriod.YEAR]: RingTimePeriodDisplay.YEAR,
}

export const RING_CHART_DISPLAYS: Record<RingChartTimePeriod, RingChartTimePeriodDisplay> = {
  [RingChartTimePeriod.DAY]: RingChartTimePeriodDisplay.DAY,
  [RingChartTimePeriod.WEEK]: RingChartTimePeriodDisplay.WEEK,
  [RingChartTimePeriod.MONTH]: RingChartTimePeriodDisplay.MONTH,
  [RingChartTimePeriod.YEAR]: RingChartTimePeriodDisplay.YEAR,
}

// eslint-disable-next-line consistent-return
export function getTimePeriodFromDisplay(display: TimePeriodDisplay): TimePeriod {
  switch (display) {
    case TimePeriodDisplay.HOUR:
      return TimePeriod.HOUR
    case TimePeriodDisplay.DAY:
      return TimePeriod.DAY
    case TimePeriodDisplay.WEEK:
      return TimePeriod.WEEK
    case TimePeriodDisplay.MONTH:
      return TimePeriod.MONTH
    case TimePeriodDisplay.YEAR:
      return TimePeriod.YEAR
  }
}

// eslint-disable-next-line consistent-return
export function getRingTimePeriodFromDisplay(display: RingChartTimePeriodDisplay): RingChartTimePeriod {
  switch (display) {
    case RingChartTimePeriodDisplay.DAY:
      return RingChartTimePeriod.DAY
    case RingChartTimePeriodDisplay.WEEK:
      return RingChartTimePeriod.WEEK
    case RingChartTimePeriodDisplay.MONTH:
      return RingChartTimePeriod.MONTH
    case RingChartTimePeriodDisplay.YEAR:
      return RingChartTimePeriod.YEAR
  }
}

export const ORDERED_TIMES: TimePeriod[] = [
  TimePeriod.HOUR,
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.YEAR,
]

const RING_ORDERED_TIMES: RingTimePeriod[] = [
  RingTimePeriod.DAY,
  RingTimePeriod.WEEK,
  RingTimePeriod.MONTH,
  // RingTimePeriod.YEAR,
]

export const RING_CHART_ORDERED_TIMES: RingChartTimePeriod[] = [
  RingChartTimePeriod.DAY,
  RingChartTimePeriod.WEEK,
  RingChartTimePeriod.MONTH,
  RingChartTimePeriod.YEAR,
]

// TODO: change this to reflect data pipeline
export default function VolumeTimeFrameSelector() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useState(false)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  const media = useMedia()
  const isLargeScreen = !media.xl

  return (
    <Flex>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={`${DISPLAYS[activeTime]} ${isLargeScreen ? t('common.volume').toLowerCase() : ''}`}
        dataTestId={TestID.TimeSelector}
        buttonStyle={{ height: 40 }}
        dropdownStyle={{ maxHeight: 300 }}
        adaptToSheet
        allowFlip
        alignRight={!media.lg}
      >
        {ORDERED_TIMES.map((time) => (
          <InternalMenuItem
            key={DISPLAYS[time]}
            data-testid={DISPLAYS[time]}
            onPress={() => {
              setTime(time)
              toggleMenu(false)
            }}
          >
            <Flex>
              {DISPLAYS[time]} {t('common.volume').toLowerCase()}
            </Flex>
            {time === activeTime && <Check color={theme.accent1} size={16} />}
          </InternalMenuItem>
        ))}
      </DropdownSelector>
    </Flex>
  )
}

export function RingVolumeTimeFrameSelector() {
  const { t } = useTranslation()
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useState(false)
  const [activeTime, setTime] = useAtom(filterRingTimeAtom)

  const media = useMedia()
  const isLargeScreen = !media.xl

  return (
    <Flex>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={`${RING_DISPLAYS[activeTime]} ${isLargeScreen ? t('common.volume').toLowerCase() : ''}`}
        dataTestId={TestID.TimeSelector}
        buttonStyle={{ height: 40 }}
        dropdownStyle={{ maxHeight: 300 }}
        adaptToSheet
        allowFlip
        alignRight={!media.lg}
      >
        {RING_ORDERED_TIMES.map((time) => (
          <InternalMenuItem
            key={RING_DISPLAYS[time]}
            data-testid={RING_DISPLAYS[time]}
            onPress={() => {
              setTime(time)
              toggleMenu(false)
            }}
          >
            <Flex>
              {RING_DISPLAYS[time]} {t('common.volume').toLowerCase()}
            </Flex>
            {time === activeTime && <Check color={theme.accent1} size={16} />}
          </InternalMenuItem>
        ))}
      </DropdownSelector>
    </Flex>
  )
}
