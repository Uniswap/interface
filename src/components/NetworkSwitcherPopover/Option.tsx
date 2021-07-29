import React from 'react'
import styled from 'styled-components'
import { AutoRow } from '../Row'
import Badge from '../Badge'

const InfoCard = styled.button<{ active?: boolean }>`
  background-color: transparent;
  outline: none;
  border: none;
  border-radius: 8px;
  width: 100% !important;
`

const OptionCard = styled(InfoCard as any)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const OptionCardClickable = styled(OptionCard as any)<{ clickable?: boolean }>`
  cursor: ${({ clickable, disabled }) => (clickable && !disabled ? 'pointer' : 'not-allowed')};
  transition: border 0.3s ease;
  color: white;
  opacity: ${({ disabled }) => (disabled ? '0.5' : '1')};
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  margin-left: 16px;
`

const Icon = styled.img`
  width: 24px;
  border-radius: 50%;
`

const BadgeWrapper = styled.div`
  background-color: ${({ theme }) => theme.bg1And2};
  border-radius: 10%;
  margin-left: 8px;
`

export default function Option({
  clickable = true,
  onClick,
  header,
  logoSrc,
  active = false,
  disabled = false
}: {
  clickable?: boolean
  onClick?: any
  header: React.ReactNode
  logoSrc?: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <OptionCardClickable onClick={onClick} clickable={clickable && !active} disabled={disabled} active={active}>
      <OptionCardLeft>
        <AutoRow>
          {logoSrc && <Icon src={logoSrc} alt={'Icon'} />}
          <HeaderText>{header}</HeaderText>
          <BadgeWrapper>{disabled ? <Badge label="COMING SOON" /> : ''}</BadgeWrapper>
        </AutoRow>
      </OptionCardLeft>
    </OptionCardClickable>
  )
}
