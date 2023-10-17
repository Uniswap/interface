import { Trans } from '@lingui/macro'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { TimePeriod } from 'graphql/data/util'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useAtom } from 'jotai'
import { useRef } from 'react'
import { Check, ChevronDown, ChevronUp } from 'react-feather'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled, { css, useTheme } from 'styled-components'

import { MOBILE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT } from '../constants'
import { filterTimeAtom } from '../state'
import FilterOption from './FilterOption'

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

const InternalMenuItem = styled.div`
  flex: 1;
  padding: 8px;
  color: ${({ theme }) => theme.neutral1};
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
    background-color: ${({ theme }) => theme.surface3};
    text-decoration: none;
  }
`
const MenuTimeFlyout = styled.span<{ isInfoExplorePageEnabled: boolean }>`
  min-width: ${({ isInfoExplorePageEnabled }) => (isInfoExplorePageEnabled ? '150px' : '240px')};
  max-height: 300px;
  overflow: auto;
  background-color: ${({ theme }) => theme.surface1};
  box-shadow: ${({ theme }) => theme.deprecated_deepShadow};
  border: 0.5px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 48px;
  z-index: 100;
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
const StyledMenu = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;

  ${({ isInfoExplorePageEnabled }) =>
    !isInfoExplorePageEnabled &&
    css`
      @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
        width: 72px;
      }
    `}
`
const StyledMenuContent = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: none;
  width: 100%;
  vertical-align: middle;
  ${({ isInfoExplorePageEnabled }) => isInfoExplorePageEnabled && 'white-space: nowrap;'}
`
const Chevron = styled.span<{ open: boolean }>`
  padding-top: 1px;
  color: ${({ open, theme }) => (open ? theme.neutral1 : theme.neutral2)};
`

// TODO: change this to reflect data pipeline
export default function TimeSelector() {
  const theme = useTheme()
  const node = useRef<HTMLDivElement | null>(null)
  const open = useModalIsOpen(ApplicationModal.TIME_SELECTOR)
  const toggleMenu = useToggleModal(ApplicationModal.TIME_SELECTOR)
  useOnClickOutside(node, open ? toggleMenu : undefined)
  const [activeTime, setTime] = useAtom(filterTimeAtom)

  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  return (
    <StyledMenu ref={node} isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
      <FilterOption onClick={toggleMenu} aria-label="timeSelector" active={open} data-testid="time-selector">
        <StyledMenuContent isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
          {isInfoExplorePageEnabled ? (
            <>
              {DISPLAYS[activeTime]} <Trans>volume</Trans>
            </>
          ) : (
            DISPLAYS[activeTime]
          )}
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
        <MenuTimeFlyout isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
          {ORDERED_TIMES.map((time) => (
            <InternalLinkMenuItem
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
            </InternalLinkMenuItem>
          ))}
        </MenuTimeFlyout>
      )}
    </StyledMenu>
  )
}
