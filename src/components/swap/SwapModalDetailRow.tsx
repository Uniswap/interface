import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { Label } from './SwapModalHeaderAmount'

const Value = styled.span<{ color?: string }>`
  color: ${({ color, theme }) => color ?? theme.textPrimary};
  text-align: end;
  max-width: 45%;
  overflow-wrap: break-word;
`

interface DetailProps {
  label: ReactNode
  value: ReactNode
  color?: string
  labelTooltipText?: string
}

export function SwapModalDetailRow({ label, value, color, labelTooltipText }: DetailProps) {
  return (
    <ThemedText.BodySmall>
      <Row align="flex-start" justify="space-between">
        {labelTooltipText ? (
          <MouseoverTooltip text={labelTooltipText}>
            <Label cursor="help">{label}</Label>
          </MouseoverTooltip>
        ) : (
          <Label>{label}</Label>
        )}
        <Value color={color}>{value}</Value>
      </Row>
    </ThemedText.BodySmall>
  )
}
