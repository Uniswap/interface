import { Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import styled from 'styled-components'
import { ThemedText } from 'theme'

const TextWrapper = styled.div`
  border: 1px solid ${({ theme }) => theme.textPrimary};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export function V2Unsupported() {
  return (
    <AutoColumn gap="lg" justify="center">
      <AutoColumn gap="md" style={{ width: '100%' }}>
        <TextWrapper>
          <ThemedText.BodySecondary color="textSecondary" textAlign="center">
            <Trans>Uniswap V2 is not available on this network.</Trans>
          </ThemedText.BodySecondary>
        </TextWrapper>
      </AutoColumn>
    </AutoColumn>
  )
}
