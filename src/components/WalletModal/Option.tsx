import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import React from 'react'
import styled from 'styled-components/macro'

import { ExternalLink } from '../../theme'

const InfoCard = styled.button<{ isActive?: boolean }>`
  background-color: ${({ theme, isActive }) => (isActive ? theme.deprecated_bg3 : theme.deprecated_bg2)};
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
  width: 100% !important;
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.deprecated_primary1};
  }
  border-color: ${({ theme, isActive }) => (isActive ? 'transparent' : theme.deprecated_bg3)};
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
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard as any)<{ clickable?: boolean }>`
  margin-top: 0;
  &:hover {
    cursor: ${({ clickable }) => (clickable ? 'pointer' : '')};
    border: ${({ clickable, theme }) => (clickable ? `1px solid ${theme.deprecated_primary1}` : ``)};
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`

const GreenCircle = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;

  &:first-child {
    height: 8px;
    width: 8px;
    margin-right: 8px;
    background-color: ${({ theme }) => theme.deprecated_green1};
    border-radius: 50%;
  }
`

const CircleWrapper = styled.div`
  color: ${({ theme }) => theme.deprecated_green1};
  display: flex;
  justify-content: center;
  align-items: center;
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${(props) =>
    props.color === 'blue' ? ({ theme }) => theme.deprecated_primary1 : ({ theme }) => theme.deprecated_text1};
  font-size: 1rem;
  font-weight: 500;
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.deprecated_text1};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '24px')};
    width: ${({ size }) => (size ? size + 'px' : '24px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
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
      events={[Event.onClick]}
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
            {isActive ? (
              <CircleWrapper>
                <GreenCircle>
                  <div />
                </GreenCircle>
              </CircleWrapper>
            ) : (
              ''
            )}
            {header}
          </HeaderText>
          {subheader && <SubHeader>{subheader}</SubHeader>}
        </OptionCardLeft>
        <IconWrapper size={size}>
          <img src={icon} alt={'Icon'} />
        </IconWrapper>
      </OptionCardClickable>
    </TraceEvent>
  )
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>
  }

  return content
}
