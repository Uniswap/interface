import React from 'react'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { TYPE } from 'theme'
import styled from 'styled-components/macro'
import { Trans } from '@lingui/macro'
import { FeeAmount } from '@uniswap/v3-sdk'
import ReactGA from 'react-ga'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '4px',
  borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.text1};
  flex: 1;
  background-color: ${({ theme }) => theme.bg2};
`

const RANGES = {
  [FeeAmount.LOW]: [
    { label: '2000x', ticks: 5 },
    { label: '1500x', ticks: 10 },
    { label: '1000x', ticks: 20 },
  ],
  [FeeAmount.MEDIUM]: [
    { label: '500x', ticks: 100 },
    { label: '100x', ticks: 953 },
    { label: '50x', ticks: 4055 },
  ],
  [FeeAmount.HIGH]: [
    { label: '350x', ticks: 198 },
    { label: '100x', ticks: 953 },
    { label: '5x', ticks: 5878 },
  ],
}

interface PresetsButtonProps {
  feeAmount: FeeAmount | undefined
  setRange: (numTicks: number) => void
  setFullRange: () => void
}

const PresetButton = ({
  values: { label, ticks },
  setRange,
}: {
  values: {
    label: string
    ticks: number
  }
  setRange: (numTicks: number) => void
}) => (
  <Button
    onClick={() => {
      setRange(ticks)
      ReactGA.event({
        category: 'Liquidity',
        action: 'Preset clicked',
        label: label,
      })
    }}
  >
    <TYPE.body fontSize={12}>
      <Trans>{label}</Trans>
    </TYPE.body>
  </Button>
)

export default function PresetsButtons({ feeAmount, setRange, setFullRange }: PresetsButtonProps) {
  feeAmount = feeAmount ?? FeeAmount.LOW

  return (
    <AutoRow gap="4px" width="auto">
      <PresetButton values={RANGES[feeAmount][0]} setRange={setRange} />
      <PresetButton values={RANGES[feeAmount][1]} setRange={setRange} />
      <PresetButton values={RANGES[feeAmount][2]} setRange={setRange} />
      <Button onClick={() => setFullRange()}>
        <TYPE.body fontSize={12}>1x</TYPE.body>
      </Button>
    </AutoRow>
  )
}
