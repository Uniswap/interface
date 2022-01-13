import React from 'react'
import styled from 'styled-components'
import { ExternalLink } from '../../theme'

const IconWrapper = styled.div<{ size?: number | null }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  padding: 15px 21px;
  background-color: ${({ theme }) => theme.bg9};
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

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.text};
  font-size: 14px;
  font-weight: 500;
`

const OptionCardClickable = styled.button<{ active?: boolean; clickable?: boolean }>`
  outline: none;
  border: none;
  border-radius: 8px;
  text-transform: uppercase;
  &:nth-child(2n) {
    margin-right: 0;
  }
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 2rem;
  margin-top: 0;
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'not-allowed')};
  transition: all 0.2s;
  background-color: ${({ theme }) => theme.bg10};

  ${({ active }) => (active ? '&' : ':hover')} {
    background-color: ${({ theme }) => theme.bg7};
    & ${HeaderText} {
      color: ${({ theme }) => theme.darkText} !important;
    }
    > ${IconWrapper} {
      background-color: ${({ theme }) => theme.bg8};
    }
  }
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin: 0 0 8px 0;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
`

const SubHeader = styled.div`
  color: ${({ theme }) => theme.text};
  margin-top: 10px;
  font-size: 12px;
`

export default function Option({
  link = null,
  clickable = true,
  size,
  onClick = undefined,
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
  onClick?: undefined | (() => void)
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
      <IconWrapper size={size}>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{header}</HeaderText>
        {subheader && <SubHeader>{subheader}</SubHeader>}
      </OptionCardLeft>
    </OptionCardClickable>
  )
  if (link) {
    return <StyledLink href={link}>{content}</StyledLink>
  }

  return content
}
