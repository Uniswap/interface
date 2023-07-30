import Column from 'components/Column'
import Row from 'components/Row'
import Toggle from 'components/Toggle'
import styled from 'styled-components'
import { ThemedText } from 'theme'

const StyledColumn = styled(Column)`
  width: 100%;
`

interface SettingsToggleProps {
  title: string
  description?: string
  dataid?: string
  isActive: boolean
  toggle: () => void
}

export function SettingsToggle({ title, description, dataid, isActive, toggle }: SettingsToggleProps) {
  return (
    <Row align="center">
      <StyledColumn>
        <Row>
          <ThemedText.SubHeaderSmall color="textPrimary">{title}</ThemedText.SubHeaderSmall>
        </Row>
        {description && (
          <Row>
            <ThemedText.Caption color="textSecondary" lineHeight="16px">
              {description}
            </ThemedText.Caption>
          </Row>
        )}
      </StyledColumn>
      <Toggle id={dataid} isActive={isActive} toggle={toggle} />
    </Row>
  )
}
