import { Flex, Switch, Text } from 'ui/src'

interface SettingsToggleProps {
  title: string
  description?: string
  dataid?: string
  disabled?: boolean
  isActive: boolean
  toggle: () => void
}

export function SettingsToggle({ title, description, dataid, isActive, toggle, disabled }: SettingsToggleProps) {
  return (
    <Flex row alignItems="center" justifyContent="space-between" py="$padding12">
      <Flex maxWidth="80%" $xl={{ maxWidth: '70%' }}>
        <Text variant="body3" color="neutral1">
          {title}
        </Text>
        {description && (
          <Text variant="body3" color="neutral2">
            {description}
          </Text>
        )}
      </Flex>
      <Switch testID={dataid} variant="branded" checked={isActive} onCheckedChange={toggle} disabled={disabled} />
    </Flex>
  )
}
