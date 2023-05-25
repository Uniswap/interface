import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { OpacityHoverState } from 'components/Common'
import Row from 'components/Row'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useReducer, useRef } from 'react'
import { Check, ChevronDown } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { Z_INDEX } from 'theme/zIndex'

const SwitcherAndDropdownWrapper = styled.div`
  position: relative;
  width: 92px;
`

const SwitcherWrapper = styled(Row)`
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  border-radius: 12px;
  width: 100%;
  justify-content: flex-end;
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
  background-color: ${({ theme }) => theme.backgroundInteractive};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding: 4px 0px;
  gap: 8px;
  position: absolute;
  top: 40px;
  z-index: ${Z_INDEX.dropdown}};
  left: 0px;
  width: 100%;
  
`

const DropdownContent = styled(Row)`
  gap: 4px;
  padding: 8px;
  width: 100%;
  justify-content: flex-end;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.backgroundOutline};
  }
`

const supportedTimePeriods: { [key in HistoryDuration]?: React.ReactNode } = {
  [HistoryDuration.Week]: <Trans>1 week</Trans>,
  [HistoryDuration.Month]: <Trans>1 month</Trans>,
  [HistoryDuration.Year]: <Trans>1 year</Trans>,
  [HistoryDuration.Max]: <Trans>All time</Trans>,
}

export const TimePeriodSwitcher = ({
  activeTimePeriod,
  setTimePeriod,
}: {
  activeTimePeriod: HistoryDuration
  setTimePeriod: React.Dispatch<React.SetStateAction<HistoryDuration>>
}) => {
  const theme = useTheme()
  const [isOpen, toggleIsOpen] = useReducer((isOpen) => !isOpen, false)
  const menuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(menuRef, () => {
    isOpen && toggleIsOpen()
  })

  if (!supportedTimePeriods[activeTimePeriod]) {
    return null
  }

  return (
    <SwitcherAndDropdownWrapper ref={menuRef} data-testid="activity-time-period-switcher">
      <SwitcherWrapper onClick={toggleIsOpen}>
        <ThemedText.LabelSmall lineHeight="16px" color="textPrimary">
          {supportedTimePeriods[activeTimePeriod]}
        </ThemedText.LabelSmall>
        <Chevron $isOpen={isOpen} />
      </SwitcherWrapper>
      {isOpen && (
        <TimeDropdownMenu>
          {Object.entries(supportedTimePeriods).map((timePeriod) => (
            <DropdownContent
              key={timePeriod[0]}
              onClick={() => {
                setTimePeriod(timePeriod[0] as HistoryDuration)
                toggleIsOpen()
              }}
            >
              <ThemedText.LabelSmall lineHeight="16px" color="textPrimary">
                {timePeriod[1]}
              </ThemedText.LabelSmall>
              <Check
                size="16px"
                color={theme.accentActive}
                opacity={activeTimePeriod === (timePeriod[0] as HistoryDuration) ? 1 : 0}
              />
            </DropdownContent>
          ))}
        </TimeDropdownMenu>
      )}
    </SwitcherAndDropdownWrapper>
  )
}
