import React from 'react'
import styled from 'styled-components'
import TriangleIcon from '../../assets/svg/triangle.svg'
import { NetworkOptions } from '../../components/NetworkSwitcher'
import { RowBetween } from '../../components/Row'
import { TagSuccess } from '../../components/Tag'

const Section = styled.button<{ disabled: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 12px 19px 15px;
  background: ${({ theme }) => theme.bg1And2};
  border-radius: 12px;
  border: none;
  text-align: left;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  height: 100%;
`

const SmallLabel = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 9px;
  line-height: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.purple2};
`

const Row = styled(RowBetween)`
  align-items: flex-start;
  margin-bottom: 12px;
  min-height: 33px;
`

const IconWrapper = styled(RowBetween)`
  max-width: 33px;

  img {
    height: 33px;
  }
`

const AssetName = styled.p<{ disabled: boolean }>`
  position: relative;
  display: inline-block;
  padding-right: 20px;
  margin: 5px 0 0;
  font-weight: 600;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text2};

  ${({ disabled }) =>
    !disabled &&
    `
  &::after {
    content: '';
    position: absolute;
    top: 4px;
    right: 0;
    width: 10px;
    height: 10px;
    background: url(${TriangleIcon}) center no-repeat;
    background-size: contain;
  }
  `}
`

interface AssetSelectorProps {
  label: string
  onClick: () => void
  disabled?: boolean
  networkOption: Partial<NetworkOptions>
}

export const AssetSelector = ({ label, onClick, disabled = false, networkOption }: AssetSelectorProps) => {
  const { preset, active } = networkOption
  const name = preset ? preset.name : ''
  return (
    <Section disabled={disabled} onClick={disabled ? undefined : onClick}>
      <Row>
        <IconWrapper>
          <img src={preset?.logoSrc} alt={`${preset?.name} logo`} />
        </IconWrapper>
        {active && <TagSuccess>Connected</TagSuccess>}
      </Row>
      <SmallLabel>{label}</SmallLabel>
      <AssetName disabled={disabled}>{name}</AssetName>
    </Section>
  )
}
