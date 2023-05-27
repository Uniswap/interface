import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Dispatch, ReactNode, SetStateAction, useReducer, useRef } from 'react'
import { Check, ChevronDown } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const SwitcherAndDropdownWrapper = styled.div`
  position: relative;
`

const SwitcherWrapper = styled(Row)`
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  border-radius: 12px;
  width: 92px;
  justify-content: space-between;
  user-select: none;
  background: ${({ theme }) => theme.backgroundInteractive};
  ${OpacityHoverState}
`

const Chevron = styled(ChevronDown)<{ $isOpen: boolean }>`
  height: 16px;
  width: 16px;
  color: ${({ theme }) => theme.textSecondary};
  transform: ${({ $isOpen }) => ($isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.fast};
`

const TimeDropdownMenu = styled(Column)`
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding: 10px 8px;
  gap: 8px;
  position: absolute;
  top: 42px;
  z-index: ${Z_INDEX.dropdown}};
  right: 0px;
  width: 240px;
`

const DropdownContent = styled(Row)`
  gap: 4px;
  padding: 10px 8px;
  width: 100%;
  justify-content: space-between;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.stateOverlayHover};
  }
`

const supportedTimePeriods = [
  HistoryDuration.Week,
  HistoryDuration.Month,
  HistoryDuration.Year,
  HistoryDuration.Max,
] as const
export type SupportedTimePeriodsType = typeof supportedTimePeriods[number]

const supportedTimePeriodsData: Record<SupportedTimePeriodsType, ReactNode> = {
  [HistoryDuration.Week]: <Trans>1 week</Trans>,
  [HistoryDuration.Month]: <Trans>1 month</Trans>,
  [HistoryDuration.Year]: <Trans>1 year</Trans>,
  [HistoryDuration.Max]: <Trans>All time</Trans>,
}

export const TimePeriodSwitcher = ({
  activeTimePeriod,
  setTimePeriod,
}: {
  activeTimePeriod: SupportedTimePeriodsType
  setTimePeriod: Dispatch<SetStateAction<SupportedTimePeriodsType>>
}) => {
  const theme = useTheme()
  const [isOpen, toggleIsOpen] = useReducer((isOpen) => !isOpen, false)
  const menuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(menuRef, () => {
    isOpen && toggleIsOpen()
  })

  return (
    <SwitcherAndDropdownWrapper ref={menuRef}>
      <SwitcherWrapper onClick={toggleIsOpen} data-testid="activity-time-period-switcher">
        <ThemedText.LabelSmall lineHeight="16px" color="textPrimary">
          {supportedTimePeriodsData[activeTimePeriod]}
        </ThemedText.LabelSmall>
        <Chevron $isOpen={isOpen} />
      </SwitcherWrapper>
      {isOpen && (
        <TimeDropdownMenu data-testid="activity-time-period-switcher-dropdown">
          {supportedTimePeriods.map((timePeriod) => (
            <DropdownContent
              key={timePeriod}
              onClick={() => {
                setTimePeriod(timePeriod)
                toggleIsOpen()
              }}
            >
              <ThemedText.BodyPrimary lineHeight="24px">{supportedTimePeriodsData[timePeriod]}</ThemedText.BodyPrimary>
              <Check size="16px" color={theme.accentActive} opacity={activeTimePeriod === timePeriod ? 1 : 0} />
            </DropdownContent>
          ))}
        </TimeDropdownMenu>
      )}
    </SwitcherAndDropdownWrapper>
  )
}
