import Column from 'components/Column'
import Row from 'components/Row'
import Toggle from 'components/Toggle'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const StyledColumn = styled(Column)`
  width: 100%;
  margin-right: 10px;
`

interface SettingsToggleProps {
  title: ReactNode
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
      <Toggle id={dataid} isActive={isActive} toggle={toggle} />
    </Row>
  )
}
