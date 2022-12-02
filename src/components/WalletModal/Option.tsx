import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import React, { PropsWithChildren, ReactNode } from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components/macro'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

const InfoCard = styled.button<{ isActive?: boolean }>`
  background-color: ${({ theme }) => theme.backgroundModule};
  width: 100% !important;
  &:focus {
    background-color: ${({ theme }) => theme.hoverState};
  }
  border-color: ${({ theme, isActive }) => (isActive ? theme.accentActive : 'transparent')};
`

const CheckIcon = styled(Check)`
  ${flexColumnNoWrap};
  height: 20px;
  width: 20px;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.accentAction};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

const OptionCard = styled(InfoCard)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  padding: 1rem;
`

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  flex-direction: row;
  align-items: center;
`

const OptionCardClickable = styled(OptionCard)<{ active?: boolean; clickable?: boolean }>`
  margin-top: 0;
  border: ${({ active, theme }) => active && `1px solid ${theme.accentActive}`};
  &:hover {
    cursor: ${({ clickable }) => clickable && 'pointer'};
    background-color: ${({ theme }) => theme.hoverState};
    transition: ${({ theme }) => theme.transition.duration.slow};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`

const HeaderText = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.color === 'blue' ? ({ theme }) => theme.deprecated_primary1 : ({ theme }) => theme.deprecated_text1};
  font-size: 16px;
  font-weight: 600;
  padding: 0 8px;
`

const IconWrapper = styled.div<{ size?: number | null }>`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '24px')};
    width: ${({ size }) => (size ? size + 'px' : '24px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

type OptionProps = PropsWithChildren<{
  clickable?: boolean
  onClick: () => void
  header: ReactNode
  icon: string
  isActive?: boolean
}>
export default function Option({ clickable = true, onClick, header, icon, isActive = false, children }: OptionProps) {
  const content = (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={EventName.WALLET_SELECTED}
      properties={{ wallet_type: header }}
      element={ElementName.WALLET_TYPE_OPTION}
    >
      <OptionCardClickable
        onClick={onClick}
        clickable={clickable && !isActive}
        active={isActive}
        data-testid="wallet-modal-option"
      >
        <OptionCardLeft>
          <IconWrapper>
            <img src={icon} alt="Icon" />
          </IconWrapper>
          <HeaderText>{header}</HeaderText>
          {children}
        </OptionCardLeft>
        {isActive && <CheckIcon />}
      </OptionCardClickable>
    </TraceEvent>
  )

  return content
}
