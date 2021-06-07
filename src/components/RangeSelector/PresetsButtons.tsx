import React from 'react'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { TYPE } from 'theme'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.text1};
  flex: 1;
  background-color: ${({ theme }) => theme.bg2};
`

interface PresetsButtonProps {
  setRange: (numTicks: number) => void
}

export default function PresetsButtons({ setRange }: PresetsButtonProps) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button onClick={() => setRange(1)}>
        <TYPE.body fontSize={12}>
          <Trans>+/- 0.1%</Trans>
        </TYPE.body>
      </Button>
      <Button onClick={() => setRange(5)}>
        <TYPE.body fontSize={12}>
          <Trans>+/- 5%</Trans>
        </TYPE.body>
      </Button>
      <Button onClick={() => setRange(10)}>
        <TYPE.body fontSize={12}>
          <Trans>+/- 10%</Trans>
        </TYPE.body>
      </Button>
      <Button>
        <TYPE.body fontSize={12}>
          <Trans>Full Range</Trans>
        </TYPE.body>
      </Button>
    </AutoRow>
  )
}
