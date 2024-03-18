import { Trans } from '@lingui/macro'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { TimePeriod } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { useReducer } from 'react'
import { Check } from 'react-feather'
import { css, useTheme } from 'styled-components'

import { useScreenSize } from 'hooks/useScreenSize'
import { filterTimeAtom } from '../state'

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

const StyledMenuFlyout = css`
  max-height: 300px;
  left: 0px;
`
// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useReducer((s) => !s, false)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  const screenSize = useScreenSize()
  const isLargeScreen = screenSize['lg']

  return (
    <div>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={
          <>
            {DISPLAYS[activeTime]} {isLargeScreen && <Trans>volume</Trans>}
          </>
        }
        internalMenuItems={
          <>
            {ORDERED_TIMES.map((time) => (
              <InternalMenuItem
                key={DISPLAYS[time]}
                data-testid={DISPLAYS[time]}
                onClick={() => {
                  setTime(time)
                  toggleMenu()
                }}
              >
                <div>
                  {DISPLAYS[time]} <Trans>volume</Trans>
                </div>
                {time === activeTime && <Check color={theme.accent1} size={16} />}
              </InternalMenuItem>
            ))}
          </>
        }
        dataTestId="time-selector"
        buttonCss={css`
          height: 40px;
        `}
        menuFlyoutCss={StyledMenuFlyout}
      />
    </div>
  )
}
