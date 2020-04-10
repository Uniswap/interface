import React from 'react'
import styled from 'styled-components'
import { Link } from '../../theme'

const InfoCard = styled.button`
  background-color: ${({ theme, active }) => (active ? theme.activeGray : theme.backgroundColor)};
  padding: 1rem;
  outline: none;
  border: 1px solid;
  border-radius: 12px;
  width: 100% !important;
  : 0 4px 8px 0 ${({ theme, clickable }) => (clickable ? theme.shadowColor : 'none')};
  &:focus {
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.blue5};
  }
  border-color: ${({ theme, active }) => (active ? 'transparent' : theme.placeholderGray)};
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
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard)`
  margin-top: 0;
  &:hover {
    cursor: ${({ clickable }) => (clickable ? 'pointer' : '')};
    border: ${({ clickable, theme }) => (clickable ? `1px solid ${theme.colors.blue5}` : ``)};
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
    <<<<<<<headbackground-color: ${({ theme }) => theme.colors.green2};
    =======background-color: ${({ theme }) => theme.connectedGreen};
    >>>>>>>uniswap-frontend/betaborder-radius: 50%;
  }
`

const CircleWrapper = styled.div`
  <<<<<<<headcolor: ${({ theme }) => theme.colors.green2};
  =======color: ${({ theme }) => theme.connectedGreen};
  >>>>>>>uniswap-frontend/betadisplay: flex;
  justify-content: center;
  align-items: center;
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  <<<<<<<headcolor: ${props =>
    props.color === 'blue' ? ({ theme }) => theme.colors.blue5 : ({ theme }) => theme.textColor};
  =======color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : ({ theme }) => theme.textColor)};
  >>>>>>>uniswap-frontend/betafont-size: 1rem;
  font-weight: 500;
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.textColor};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapper = styled.div`
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
  size = null,
  onClick = null,
  color,
  header,
  subheader = null,
  icon,
  active = false
}) {
  const content = (
    <OptionCardClickable onClick={onClick} clickable={clickable && !active} active={active}>
      <OptionCardLeft>
        <HeaderText color={color}>
          {' '}
          {active ? (
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
      <IconWrapper size={size} active={active}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
    </OptionCardClickable>
  )
  if (link) {
    return <Link href={link}>{content}</Link>
  }

  return content
}
