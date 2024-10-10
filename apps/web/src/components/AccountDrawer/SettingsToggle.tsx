import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ThemedText } from 'theme/components'
import { Switch } from 'ui/src'

const StyledColumn = styled(Column)`
  width: 100%;
  margin-right: 10px;
`

interface SettingsToggleProps {
  title: ReactNode
  description?: string
  dataid?: string
  disabled?: boolean
  isActive: boolean
  toggle: () => void
}

export function SettingsToggle({ title, description, dataid, isActive, toggle, disabled }: SettingsToggleProps) {
  return (
    <Row align="center">
      <StyledColumn>
        <Row>
          <ThemedText.SubHeaderSmall color="neutral1">{title}</ThemedText.SubHeaderSmall>
        </Row>
        {description && (
          <Row>
            <ThemedText.BodySmall color="neutral2" lineHeight="16px">
              {description}
            </ThemedText.BodySmall>
          </Row>
        )}
      </StyledColumn>
      <Switch testID={dataid} variant="branded" checked={isActive} onCheckedChange={toggle} disabled={disabled} />
    </Row>
  )
}
