import { ButtonOutlined } from 'components/Button/buttons'
import { AutoRow } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'

const Button = styled(ButtonOutlined).attrs(() => ({
  padding: '6px',
  $borderRadius: '8px',
}))`
  color: ${({ theme }) => theme.neutral1};
  flex: 1;
`

interface PresetsButtonsProps {
  onSetFullRange: () => void
}

export default function PresetsButtons({ onSetFullRange }: PresetsButtonsProps) {
  return (
    <AutoRow gap="4px" width="auto">
      <Button data-testid="set-full-range" onClick={onSetFullRange}>
        <ThemedText.DeprecatedBody fontSize={12}>
          <Trans i18nKey="common.fullRange" />
        </ThemedText.DeprecatedBody>
      </Button>
    </AutoRow>
  )
}
