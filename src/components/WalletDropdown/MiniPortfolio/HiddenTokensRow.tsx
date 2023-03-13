import { t } from '@lingui/macro'
import Row from 'components/Row'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const ExpandIcon = styled(ChevronDown)<{ $expanded: boolean }>`
  color: ${({ theme }) => theme.textSecondary};

  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform ${({ theme }) => theme.transition.duration.medium};
`

const ToggleButton = styled(Row)`
  background-color: ${({ theme }) => theme.backgroundInteractive};
  border-radius: 12px;
  padding: 4px 8px 4px 12px;
  height: 100%;
  width: fit-content;
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`

export function HiddenTokensRow({
  numHidden,
  isExpanded,
  onPress,
}: {
  numHidden: number
  isExpanded: boolean
  onPress: () => void
}): JSX.Element {
  return (
    <Row align="center" justify="space-between" padding="16px">
      <ThemedText.SubHeader color="textSecondary" variant="subheadSmall">
        {t`Hidden (${numHidden})`}
      </ThemedText.SubHeader>
      <ToggleButton align="center" onClick={onPress}>
        <ThemedText.LabelSmall color="textSecondary" variant="buttonLabelSmall">
          {isExpanded ? t`Hide` : t`Show`}
        </ThemedText.LabelSmall>
        <ExpandIcon $expanded={isExpanded} />
      </ToggleButton>
    </Row>
  )
}
