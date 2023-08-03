import { MOBILE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { TimePeriodLeaderboard } from 'graphql/utils/util'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

import { filterTimeAtom } from './state'

const FilterOption = styled.button<{ active: boolean; highlight?: boolean }>`
  height: 100%;
  color: ${({ theme, active }) => (active ? theme.accentActive : theme.textPrimary)};
  background-color: ${({ theme, active }) => (active ? theme.accentActive : theme.backgroundSurface)};
  margin: 0;
  padding: 6px 12px 6px 14px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  border: none;
  outline: ${({ theme, active, highlight }) => (active && highlight ? `1px solid ${theme.accentAction}` : 'none')};

  :hover {
    cursor: pointer;
    background-color: ${({ theme }) => theme.accentActiveSoft};
    color: ${({ theme }) => theme.accentActive};
  }

  :focus {
    background-color: ${({ theme, active }) => (active ? theme.accentActiveSoft : theme.backgroundInteractive)};
  }
`
const DISPLAYS: Record<TimePeriodLeaderboard, string> = {
  [TimePeriodLeaderboard.DAY]: 'All',
  [TimePeriodLeaderboard.WEEK]: '1W',
  [TimePeriodLeaderboard.MONTH]: '1M',
}

const ORDERED_TIMES: TimePeriodLeaderboard[] = [
  TimePeriodLeaderboard.DAY,
  TimePeriodLeaderboard.WEEK,
  TimePeriodLeaderboard.MONTH,
]

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 8px;
  color: ${({ theme }) => theme.textPrimary};
  border-radius: 8px;

  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`
const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 8px;
  justify-content: space-between;
  text-decoration: none;
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span`
  min-width: 240px;
  max-height: 300px;
  overflow: auto;
  background-color: ${({ theme }) => theme.backgroundSurface};
  box-shadow: ${({ theme }) => theme.deepShadow};
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: 100;
  left: 0px;

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    right: 0px;
    left: unset;
  }
`
const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    width: 72px;
  }
`
const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  width: 100%;
  vertical-align: middle;
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.accentActive : theme.textSecondary)};
`

export default function TimeSelector() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.TIME_SELECTOR)
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  return (
    <StyledMenu ref={node}>
      <FilterOption onClick={toggleMenu} aria-label="timeSelector" active={open} data-testid="time-selector">
        <StyledMenuContent>
          {DISPLAYS[activeTime]}
          <Chevron open={open}>
            {open ? (
              <ChevronUp width={20} height={15} viewBox="0 0 24 20" />
            ) : (
              <ChevronDown width={20} height={15} viewBox="0 0 24 20" />
            )}
          </Chevron>
        </StyledMenuContent>
      </FilterOption>
      {open && (
        <MenuTimeFlyout>
          {ORDERED_TIMES.map((time) => (
            <InternalLinkMenuItem
              key={DISPLAYS[time]}
              data-testid={DISPLAYS[time]}
              onClick={() => {
                setTime(time)
                toggleMenu()
              }}
            >
              <div>{DISPLAYS[time]}</div>
              {time === activeTime && <Check color={theme.accentAction} size={16} />}
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
