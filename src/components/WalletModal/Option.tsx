import React from 'react'
import styled from 'styled-components'
import { ExternalLink } from '../../theme'

const InfoCard = styled.button<{ active?: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.bg7 : theme.bg10)};
  outline: none;
  border: none;
  border-radius: 8px;
  text-transform: uppercase;
  &:nth-child(2n) {
    margin-right: 0;
  }
  padding: 0 !important;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin: 0 0 8px 0;
  `};
`

const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: row;
  align-items: center;
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
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'not-allowed')};
  transition: all 0.2s;
  &:hover {
    background-color: ${({ theme }) => theme.bg7};

    > div:first-child {
      background-color: ${({ theme }) => theme.bg8};
    }
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${props => (props.color === 'blue' ? ({ theme }) => theme.primary : ({ theme }) => theme.text)};
  font-size: 14px;
  font-weight: 500;
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.text};
  margin-top: 10px;
  font-size: 12px;
`

const IconWrapper = styled.div<{ size?: number | null; active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  padding: 15px 21px;
  background-color: ${({ theme, active }) => (active ? theme.bg8 : theme.bg9)};
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  transition: all 0.2s;

  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '30px')};
    width: ${({ size }) => (size ? size + 'px' : '30px')};
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
  subheader = null,
  icon,
  active = false,
  id
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: null | (() => void)
  color: string
  header: React.ReactNode
  subheader: React.ReactNode | null
  icon: string
  active?: boolean
  id: string
}) {
  const content = (
    <OptionCardClickable
      id={id}
      onClick={onClick}
      clickable={clickable && !active}
      active={active}
      disabled={clickable === false}
    >
      <IconWrapper size={size} active={active}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText color={color}>{header}</HeaderText>
        {subheader && <SubHeader>{subheader}</SubHeader>}
      </OptionCardLeft>
    </OptionCardClickable>
  )
  if (link) {
    return <StyledLink href={link}>{content}</StyledLink>
  }

  return content
}
