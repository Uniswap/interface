import React from 'react'
import styled from 'styled-components'
import { transparentize } from 'polished'
import { Link } from '../../theme'

const InfoCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundColor};
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.placeholderGray};
  border-radius: 20px;
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.95, theme.shadowColor)};
`

const OptionCard = styled(InfoCard)`
  display: grid;
  grid-template-columns: 1fr 48px;
  margin-top: 2rem;
  padding: 1rem;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    height: 40px;
    grid-template-columns: 1fr 40px;
    padding: 0.6rem 1rem;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  height: 100%;
  justify-content: center;
`

const OptionCardClickable = styled(OptionCard)`
  margin-top: 0;
  margin-bottom: 1rem;
  &:hover {
    cursor: pointer;
    border: 1px solid ${({ theme }) => theme.malibuBlue};
  }
`

const HeaderText = styled.div`
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.royalBlue : props.color)};
  font-size: 1rem;
  font-weight: 500;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 12px;
  `};
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.textColor};
  margin-top: 10px;
  font-size: 12px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    font-size: 10px;
  `};
`

const IconWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

export default function Option({ link = null, size = null, onClick = null, color, header, subheader = null, icon }) {
  const content = (
    <OptionCardClickable onClick={onClick}>
      <OptionCardLeft>
        <HeaderText color={color}>{header}</HeaderText>
        {subheader && <SubHeader>{subheader}</SubHeader>}
      </OptionCardLeft>
      <IconWrapper size={size}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
    </OptionCardClickable>
  )
  if (link) {
    return <Link href={link}>{content}</Link>
  }

  return content
}
