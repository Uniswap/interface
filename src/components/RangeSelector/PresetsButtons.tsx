import { Trans } from '@lingui/macro'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import React from 'react'
import ReactGA from 'react-ga4'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

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
        <ThemedText.Body fontSize={12}>
          <Trans>Full Range</Trans>
        </ThemedText.Body>
      </Button>
    </AutoRow>
  )
}
