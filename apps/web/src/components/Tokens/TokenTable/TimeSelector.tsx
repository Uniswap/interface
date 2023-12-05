import { Trans } from '@lingui/macro'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { TimePeriod } from 'graphql/data/util'
import { useAtom } from 'jotai'
import { Check } from 'react-feather'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { css, useTheme } from 'styled-components'

import { SMALL_MEDIA_BREAKPOINT } from '../constants'
import { filterTimeAtom } from '../state'

export const DISPLAYS: Record<TimePeriod, string> = {
  [TimePeriod.HOUR]: '1H',
  [TimePeriod.DAY]: '1D',
  [TimePeriod.WEEK]: '1W',
  [TimePeriod.MONTH]: '1M',
  [TimePeriod.YEAR]: '1Y',
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
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  return (
    <DropdownSelector
      modal={ApplicationModal.TIME_SELECTOR}
      menuLabel={
        isInfoExplorePageEnabled ? (
          <>
            {DISPLAYS[activeTime]} <Trans>volume</Trans>
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
      menuFlyoutCss={StyledMenuFlyout}
    />
  )
}
