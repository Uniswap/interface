import React from 'react'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { TYPE } from 'theme'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.text1};
  flex: 1;
  background-color: ${({ theme }) => theme.bg2};
`

interface PresetsButtonProps {
  feeAmount: FeeAmount | undefined
  setRange: (numTicks: number) => void
  setFullRange: () => void
}

const RANGE_TO_TICK_MULTIPLIER = 100

const RANGES = {
  [FeeAmount.LOW]: [0.05, 0.1, 0.2],
  [FeeAmount.MEDIUM]: [1, 10, 50],
  [FeeAmount.HIGH]: [2, 10, 80],
}

const PresetButton = ({ label, setRange }: { label: number; setRange: (numTicks: number) => void }) => (
  <Button onClick={() => setRange(label * RANGE_TO_TICK_MULTIPLIER)}>
    <TYPE.body fontSize={12}>
      <Trans>+/- {label}%</Trans>
    </TYPE.body>
  </Button>
)

export default function PresetsButtons({ feeAmount, setRange, setFullRange }: PresetsButtonProps) {
  feeAmount = feeAmount ?? FeeAmount.LOW

  return (
    <AutoRow gap="4px" width="auto">
      <PresetButton label={RANGES[feeAmount][0]} setRange={setRange} />
      <PresetButton label={RANGES[feeAmount][1]} setRange={setRange} />
      <PresetButton label={RANGES[feeAmount][2]} setRange={setRange} />
      <Button onClick={() => setFullRange()}>
        <TYPE.body fontSize={12}>
          <Trans>Full Range</Trans>
        </TYPE.body>
      </Button>
    </AutoRow>
  )
}
