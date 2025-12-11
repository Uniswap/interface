import { AutoColumn } from 'components/deprecated/Column'
import { deprecatedStyled } from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'

const TextWrapper = deprecatedStyled.div`
  border: 1px solid ${({ theme }) => theme.neutral3};
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
          <ThemedText.BodySecondary color="neutral2" textAlign="center">
            <Trans i18nKey="v2.notAvailable" />
          </ThemedText.BodySecondary>
        </TextWrapper>
      </AutoColumn>
    </AutoColumn>
  )
}
