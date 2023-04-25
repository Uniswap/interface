import Row from 'components/Row'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Label } from './SwapModalHeaderAmount'

const Value = styled.span<{ color?: string }>`
  color: ${({ color, theme }) => color ?? theme.textPrimary};
  text-align: end;
`

const DetailValue = styled(Value)`
  max-width: 45%;
  overflow-wrap: break-word;
`

interface DetailProps {
  label: string | ReactNode
  value: string | ReactNode
  color?: string
}

export function SwapModalDetailRow({ label, value, color }: DetailProps) {
  return (
    <ThemedText.BodySmall>
      <Row align="flex-start" justify="space-between">
        <Label>{label}</Label>
        <DetailValue color={color}>{value}</DetailValue>
      </Row>
    </ThemedText.BodySmall>
  )
}
