import React from 'react'
import styled, { css } from 'styled-components'
import Radio from '../../components/Radio'
import { TYPE } from '../../theme'
import { Td } from '../../components/Table'

interface BridgeItemProps {
  label: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  fee: number
  gas: number
  time: string
  value: string
}

const Tr = styled.tr`
  position: relative;

  td:last-child {
    text-align: right;
  }
`

const StyledRadio = styled(Radio)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
`

const BridgeName = styled.p<{ isActive: boolean }>`
  margin: 0;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.text3};

  ${({ isActive }) =>
    isActive &&
    css`
      color: ${({ theme }) => theme.text1};
    `}
`

export const BridgeOption = ({ checked, onChange, fee, gas, time, label, value }: BridgeItemProps) => (
  <Tr>
    <Td isActive={checked}>
      <StyledRadio checked={checked} label="" value={value} name="bridge" onChange={onChange} />
      <BridgeName isActive={checked}>{label}</BridgeName>
    </Td>
    <Td isActive={checked}>
      <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
        {fee}%
      </TYPE.main>
    </Td>
    <Td isActive={checked}>
      <TYPE.main color="text4" fontSize="10px" lineHeight="12px">
        {gas}$
      </TYPE.main>
    </Td>
    <Td isActive={checked}>
      <TYPE.subHeader color="white" fontSize="12px" fontWeight="600">
        {time}
      </TYPE.subHeader>
    </Td>
  </Tr>
)
