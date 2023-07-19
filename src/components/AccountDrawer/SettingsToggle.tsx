import Row from 'components/Row'
import Toggle from 'components/Toggle'
import { ThemedText } from 'theme'

interface SettingsToggleProps {
  title: string
  isActive: boolean
  toggle: () => void
}

// eslint-disable-next-line import/no-unused-modules
export function SettingsToggle({ title, isActive, toggle }: SettingsToggleProps) {
  return (
    <Row align="center">
      <Row width="50%">
        <ThemedText.SubHeaderSmall color="primary">{title}</ThemedText.SubHeaderSmall>
      </Row>
      <Row width="50%" justify="flex-end">
        <Toggle isActive={isActive} toggle={toggle} />
      </Row>
    </Row>
  )
}
