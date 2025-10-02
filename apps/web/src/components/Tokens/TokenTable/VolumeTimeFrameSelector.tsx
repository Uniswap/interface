import { TimePeriod } from 'appGraphql/data/util'
import { Dropdown, InternalMenuItem } from 'components/Dropdowns/Dropdown'
import { filterTimeAtom } from 'components/Tokens/state'
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

export const DISPLAYS: Record<TimePeriod, TimePeriodDisplay> = {
  [TimePeriod.HOUR]: TimePeriodDisplay.HOUR,
  [TimePeriod.DAY]: TimePeriodDisplay.DAY,
  [TimePeriod.WEEK]: TimePeriodDisplay.WEEK,
  [TimePeriod.MONTH]: TimePeriodDisplay.MONTH,
  [TimePeriod.YEAR]: TimePeriodDisplay.YEAR,
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

export const ORDERED_TIMES: TimePeriod[] = [
  TimePeriod.HOUR,
  TimePeriod.DAY,
  TimePeriod.WEEK,
  TimePeriod.MONTH,
  TimePeriod.YEAR,
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
      <Dropdown
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
      </Dropdown>
    </Flex>
  )
}
