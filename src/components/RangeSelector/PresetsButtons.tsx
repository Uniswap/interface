import { Trans } from '@lingui/macro'
import { ButtonOutlined } from 'components/Button'
import { AutoRow } from 'components/Row'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '8px',
  $borderRadius: '8px',


}))`
  color: ${({ theme }) => theme.textPrimary};
  flex: 1;
  border-color: ${({ theme }) => theme.backgroundInteractive};

`

interface PresetsButtonsProps {
  onSetFullRange: () => void
}

export  function PresetsButtons({ onSetFullRange }: PresetsButtonsProps) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button onClick={onSetFullRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Recommended Range</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
    </AutoRow>
  )
}
export function PresetsButtonsFull({ onSetFullRange }: PresetsButtonsProps) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button onClick={onSetFullRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans>Full Range</Trans>
        </ThemedText.DeprecatedBody>
      </Button>
    </AutoRow>
  )
}