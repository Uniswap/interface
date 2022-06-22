import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useRef } from 'react'
import React, { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css } from 'styled-components/macro'

const TIME_DISPLAYS: { [key: string]: string } = {
  hour: '1H',
  day: '1D',
  week: '1W',
  month: '1M',
  year: '1Y',
}

const enum TimeOption {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Year = 'year',
}
const TIMES = [TimeOption.Hour, TimeOption.Day, TimeOption.Week, TimeOption.Month, TimeOption.Year]

export enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

const InternalLinkMenuItem = styled(InternalMenuItem)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem;
  justify-content: space-between;
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  min-width: 150px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border: 1px solid ${({ theme }) => theme.bg0};
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 3rem;
  z-index: 100;

  ${({ flyoutAlignment = FlyoutAlignment.RIGHT }) =>
    flyoutAlignment === FlyoutAlignment.RIGHT
      ? css`
          right: 0rem;
        `
      : css`
          left: 0rem;
        `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    bottom: unset;
    right: 0;
    left: unset;
  `};
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 44px;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg0};
  padding: 6px 12px 6px 12px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 400;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
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
`

const StyledMenuContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
  width: 100%;
  vertical-align: middle;
  color: ${({ theme }) => theme.text1};
`

const Chevron = styled.span`
  color: ${({ theme }) => theme.text2};
`

// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.TIME_SELECTOR)
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeTime, setTime] = useState(TimeOption.Day)

  return (
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggleMenu} aria-label={`timeSelector`}>
        <StyledMenuContent>
          {TIME_DISPLAYS[activeTime]}
          <Chevron>
            {open ? <ChevronUp size={15} viewBox="0 0 24 20" /> : <ChevronDown size={15} viewBox="0 0 24 20" />}
          </Chevron>
        </StyledMenuContent>
      </StyledMenuButton>
      {/* handles the actual flyout of the menu*/}
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
              {time === activeTime && <Check opacity={0.6} size={16} />}
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
