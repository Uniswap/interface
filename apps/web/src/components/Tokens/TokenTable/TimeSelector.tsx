import { Trans } from '@lingui/macro'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { TimePeriod } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { useReducer } from 'react'
import { Check } from 'react-feather'
import { css, useTheme } from 'styled-components'

import { useScreenSize } from 'hooks/useScreenSize'
import { SMALL_MEDIA_BREAKPOINT } from '../constants'
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

const StyledMenuFlyout = css<{ isInfoExplorePageEnabled: boolean }>`
  max-height: 300px;
  left: 0px;

  ${({ isInfoExplorePageEnabled }) =>
    !isInfoExplorePageEnabled &&
    css`
      @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
        left: unset;
        right: 0px;
      }
    `}
`
// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const theme = useTheme()
  const [isMenuOpen, toggleMenu] = useReducer((s) => !s, false)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  const screenSize = useScreenSize()
  const isLargeScreen = screenSize['lg']

  return (
    <div>
      <DropdownSelector
        isOpen={isMenuOpen}
        toggleOpen={toggleMenu}
        menuLabel={
          isInfoExplorePageEnabled ? (
            <>
              {DISPLAYS[activeTime]} {isLargeScreen && <Trans>volume</Trans>}
            </>
          ) : (
            <>{DISPLAYS[activeTime]}</>
          )
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
                {isInfoExplorePageEnabled ? (
                  <div>
                    {DISPLAYS[time]} <Trans>volume</Trans>
                  </div>
                ) : (
                  <div>{DISPLAYS[time]}</div>
                )}
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
