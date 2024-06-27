import { DISPLAYS, ORDERED_TIMES } from 'components/Tokens/TokenTable/TimeSelector'
import { TimePeriod } from 'graphql/data/util'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import styled from 'styled-components'

import { MEDIUM_MEDIA_BREAKPOINT } from '../Tokens/constants'

export const refitChartContentAtom = atom<(() => void) | undefined>(undefined)
const DEFAULT_TIME_SELECTOR_OPTIONS = ORDERED_TIMES.map((time: TimePeriod) => ({ time, display: DISPLAYS[time] }))

const TimeOptionsWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`

const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  gap: 4px;
  border-radius: 16px;
  height: 40px;
  padding: 4px;
  width: fit-content;

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: 100%;
    justify-content: space-between;
    border: none;
  }
`
const TimeButton = styled.button<{ active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, active }) => (active ? theme.surface3 : 'transparent')};
  font-weight: 535;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 12px;
  line-height: 16px;
  border: none;
  cursor: pointer;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  :hover {
    ${({ active, theme }) => !active && `opacity: ${theme.opacity.hover};`}
  }
`

interface TimePeriodSelectorOption {
  time: TimePeriod // Value to be selected/stored, used as default display value
  display: string // Value to be displayed
}

export default function TimePeriodSelector({
  options = DEFAULT_TIME_SELECTOR_OPTIONS,
  timePeriod,
  onChangeTimePeriod,
  className,
}: {
  options?: TimePeriodSelectorOption[]
  timePeriod: TimePeriod
  onChangeTimePeriod: (t: TimePeriod) => void
  className?: string
}) {
  const refitChartContent = useAtomValue(refitChartContentAtom)

  return (
    <TimeOptionsWrapper>
      <TimeOptionsContainer className={className}>
        {options.map(({ time, display }) => (
          <TimeButton
            key={display}
            active={timePeriod === time}
            onClick={() => {
              if (timePeriod === time) {
                refitChartContent?.()
              } else {
                onChangeTimePeriod(time)
              }
            }}
          >
            {display}
          </TimeButton>
        ))}
      </TimeOptionsContainer>
    </TimeOptionsWrapper>
  )
}
