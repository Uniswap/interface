import { ElementName, Event, EventName } from 'analytics/constants'
import { TraceEvent } from 'analytics/TraceEvent'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import React from 'react'
import { Check } from 'react-feather'
import styled from 'styled-components/macro'

import { ExternalLink } from '../../theme'

const InfoCard = styled.button<{ isActive?: boolean; redesignFlag?: boolean }>`
  background-color: ${({ theme, isActive, redesignFlag }) =>
    redesignFlag ? theme.backgroundInteractive : isActive ? theme.deprecated_bg3 : theme.deprecated_bg2};
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
  width: 100% !important;
  &:focus {
    box-shadow: ${({ theme, redesignFlag }) => !redesignFlag && `0 0 0 1px ${theme.deprecated_primary1}`};
    background-color: ${({ theme, redesignFlag }) => redesignFlag && theme.hoverState};
  }
  border-color: ${({ theme, isActive, redesignFlag }) =>
    redesignFlag ? (isActive ? theme.accentActive : 'transparent') : isActive ? 'transparent' : theme.deprecated_bg3};
`

const CheckIcon = styled(Check)`
  ${({ theme }) => theme.flexColumnNoWrap};
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
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard as any)<{
  active?: boolean
  clickable?: boolean
  redesignFlag?: boolean
}>`
  margin-top: 0;
  border: ${({ active, theme }) => active && `1px solid ${theme.accentActive}`};
  &:hover {
    cursor: ${({ clickable }) => clickable && 'pointer'};
    background-color: ${({ theme, redesignFlag }) => redesignFlag && theme.hoverState};
    border: ${({ clickable, redesignFlag, theme }) =>
      clickable && !redesignFlag && `1px solid ${theme.deprecated_primary1}`};
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

const HeaderText = styled.div<{ redesignFlag?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
  color: ${(props) =>
    props.color === 'blue' ? ({ theme }) => theme.deprecated_primary1 : ({ theme }) => theme.deprecated_text1};
  font-size: ${({ redesignFlag }) => (redesignFlag ? '16px' : '1rem')};
  font-weight: ${({ redesignFlag }) => (redesignFlag ? '600' : '500')};
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.deprecated_text1};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapperDeprecated = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
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

const IconWrapper = styled.div<{ size?: number | null }>`
  ${({ theme }) => theme.flexColumnNoWrap};
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
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled

  const content = (
    <TraceEvent
      events={[Event.onClick]}
      name={EventName.WALLET_SELECTED}
      properties={{ wallet_type: header }}
      element={ElementName.WALLET_TYPE_OPTION}
    >
      {redesignFlagEnabled ? (
        <OptionCardClickable
          id={id}
          onClick={onClick}
          clickable={clickable && !isActive}
          active={isActive}
          redesignFlag={true}
          data-testid="wallet-modal-option"
        >
          <OptionCardLeft>
            <HeaderText color={color} redesignFlag={true}>
              <IconWrapper size={size}>
                <img src={icon} alt={'Icon'} />
              </IconWrapper>
              {header}
            </HeaderText>
            {subheader && <SubHeader>{subheader}</SubHeader>}
          </OptionCardLeft>
          {isActive && <CheckIcon />}
        </OptionCardClickable>
      ) : (
        <OptionCardClickable
          id={id}
          onClick={onClick}
          clickable={clickable && !isActive}
          active={isActive}
          redesignFlag={false}
          data-testid="wallet-modal-option"
        >
          <OptionCardLeft>
            <HeaderText color={color} redesignFlag={false}>
              {isActive && (
                <CircleWrapper>
                  <GreenCircle>
                    <div />
                  </GreenCircle>
                </CircleWrapper>
              )}
              {header}
            </HeaderText>
            {subheader && <SubHeader>{subheader}</SubHeader>}
          </OptionCardLeft>
          <IconWrapperDeprecated size={size}>
            <img src={icon} alt={'Icon'} />
          </IconWrapperDeprecated>
        </OptionCardClickable>
      )}
    </TraceEvent>
  )
  if (link) {
    return <ExternalLink href={link}>{content}</ExternalLink>
  }

  return content
}
