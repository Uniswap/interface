import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { TimePeriod } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { useTheme } from 'styled-components/macro'

import { MOBILE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT } from '../constants'
import { filterTimeAtom } from '../state'

export const TIME_DISPLAYS: { [key: string]: string } = {
  hour: '1H',
  day: '1D',
  week: '1W',
  month: '1M',
  year: '1Y',
}

const TIMES = [TimePeriod.hour, TimePeriod.day, TimePeriod.week, TimePeriod.month, TimePeriod.year]

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
  box-shadow: ${({ theme }) => theme.flyoutDropShadow};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
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

const StyledMenuButton = styled.button<{ open: boolean }>`
  width: 100%;
  height: 100%;
  border: none;
  color: ${({ theme, open }) => (open ? theme.blue200 : theme.textPrimary)};
  margin: 0;
  background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundInteractive)};
  padding: 6px 12px 6px 12px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundModule)};
  }
  :focus {
    background-color: ${({ theme, open }) => (open ? theme.accentActionSoft : theme.backgroundInteractive)};
  }
  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
  width: 80px;

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    width: 72px;
  }
`

const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  width: 100%;
  vertical-align: middle;
`

const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.blue200 : theme.textSecondary)};
`

// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.TIME_SELECTOR)
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  return (
    <StyledMenu ref={node}>
      <StyledMenuButton onClick={toggleMenu} aria-label={`timeSelector`} open={open}>
        <StyledMenuContent>
          {TIME_DISPLAYS[activeTime]}
          <Chevron open={open}>
            {open ? <ChevronUp size={15} viewBox="0 0 24 20" /> : <ChevronDown size={15} viewBox="0 0 24 20" />}
          </Chevron>
        </StyledMenuContent>
      </StyledMenuButton>
      {open && (
        <MenuTimeFlyout>
          {TIMES.map((time) => (
            <InternalLinkMenuItem
              key={time}
              onClick={() => {
                setTime(time)
                toggleMenu()
              }}
            >
              <div>{TIME_DISPLAYS[time]}</div>
              {time === activeTime && <Check color={theme.accentAction} size={16} />}
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
