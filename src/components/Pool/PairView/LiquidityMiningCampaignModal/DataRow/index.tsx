import React, { ReactNode } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { RowBetween } from '../../../../Row'

const TitleText = styled.span`
  font-size: 11px;
  font-weight: 600;
  line-height: 13px;
  letter-spacing: 0em;
  color: ${props => props.theme.text4};
  text-transform: uppercase;
`

interface DataRowProps {
  title: string
  value: ReactNode
}

export default function DataRow({ title, value }: DataRowProps) {
  return (
    <RowBetween height="16px" mb="4px">
      <TitleText>{title}</TitleText>
      <Text fontSize="12px" fontWeight="600" lineHeight="13px" color="text4">
        {value}
      </Text>
    </RowBetween>
  )
}
