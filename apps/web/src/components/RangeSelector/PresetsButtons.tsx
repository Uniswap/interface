import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '6px',
  $borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.neutral1};
  flex: 1;
  width: fit-content;
`

interface PresetsButtonsProps {
  onSetFullRange: () => void
  onSetSafeRange: () => void
  onSetCommonRange: () => void
  onSetExpertRange: () => void
}

export default function PresetsButtons({
  onSetFullRange,
  onSetSafeRange,
  onSetCommonRange,
  onSetExpertRange,
}: PresetsButtonsProps) {
  return (
    <AutoRow gap="4px" width="70%">
      <Button data-testid="set-full-range" onClick={onSetFullRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Full</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
      <Button data-testid="set-full-range" onClick={onSetSafeRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Safe</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
      <Button data-testid="set-full-range" onClick={onSetCommonRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Common</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
      <Button data-testid="set-full-range" onClick={onSetExpertRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Expert</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
    </AutoRow>
  )
}
