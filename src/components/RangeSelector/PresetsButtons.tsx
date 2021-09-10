import React from 'react'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { TYPE } from 'theme'
import styled from 'styled-components/macro'
import { Trans } from '@lingui/macro'
import ReactGA from 'react-ga'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  $borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.text1};
  flex: 1;
`

export default function PresetsButtons({ setFullRange }: { setFullRange: () => void }) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button
        onClick={() => {
          setFullRange()
          ReactGA.event({
            category: 'Liquidity',
            action: 'Full Range Clicked',
          })
        }}
      >
        <TYPE.body fontSize={12}>
          <Trans>Full Range</Trans>
        </TYPE.body>
      </Button>
    </AutoRow>
  )
}
