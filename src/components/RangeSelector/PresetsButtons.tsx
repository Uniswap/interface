import { Trans } from '@lingui/macro'
import { sendEvent } from 'components/analytics'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import React from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  $borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.deprecated_text1};
  flex: 1;
`

export default function PresetsButtons({ setFullRange }: { setFullRange: () => void }) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button
        onClick={() => {
          setFullRange()
          sendEvent({
            category: 'Liquidity',
            action: 'Full Range Clicked',
          })
        }}
      >
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Full Range</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
    </AutoRow>
  )
}
