import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import React from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components/macro'
import { flexColumnNoWrap, flexRowNoWrap } from 'theme/styles'

import { ExternalLink } from '../../theme'

const InfoCard = styled.button<{ isActive?: boolean }>`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
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

const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 2rem;
  padding: 1rem;
`

const OptionCardLeft = styled.div`
  ${flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard as any)<{
  active?: boolean
  clickable?: boolean
}>`
  margin-top: 0;
  border: ${({ active, theme }) => active && `1px solid ${theme.accentActive}`};
  &:hover {
    cursor: ${({ clickable }) => clickable && 'pointer'};
    background-color: ${({ theme }) => theme.hoverState};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`

const HeaderText = styled.div`
  ${flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.accentAction : ({ theme }) => theme.textPrimary)};
  font-size: 16px;
  font-weight: 600;
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapper = styled.div<{ size?: number | null }>`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  padding-right: 12px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '28px')};
    width: ${({ size }) => (size ? size + 'px' : '28px')};
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    align-items: flex-end;
  `};
`

export default function Option({
  link = null,
  clickable = true,
  size,
  onClick = null,
  color,
  header,
  subheader,
  icon,
  isActive = false,
  id,
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: null | (() => void)
  color: string
  header: React.ReactNode
  subheader?: React.ReactNode
  icon: string
  isActive?: boolean
  id: string
}) {
  const content = (
    <TraceEvent
      events={[BrowserEvent.onClick]}
      name={EventName.WALLET_SELECTED}
      properties={{ wallet_type: header }}
      element={ElementName.WALLET_TYPE_OPTION}
    >
      <OptionCardClickable
        id={id}
        onClick={onClick}
        clickable={clickable && !isActive}
        active={isActive}
        data-testid="wallet-modal-option"
      >
        <OptionCardLeft>
          <HeaderText color={color}>
            <IconWrapper size={size}>
              <img src={icon} alt="Icon" />
            </IconWrapper>
            {header}
          </HeaderText>
          {subheader && <SubHeader>{subheader}</SubHeader>}
        </OptionCardLeft>
        {isActive && <CheckIcon />}
      </OptionCardClickable>
    </TraceEvent>
  )
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>
  }

  return content
}
