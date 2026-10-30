import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { ReactNode } from 'react'
// Switch stays on ui/src: already Tamagui-free (INFRA-3285 rebuild lane), no mycelium counterpart yet.
import { Switch } from 'ui/src'

interface SettingsToggleProps {
  title: string | ReactNode
  description?: string
  dataid?: string
  disabled?: boolean
  isActive: boolean
  toggle: () => void
  icon?: ReactNode
  py?: FlexCompatProps['py']
}

export function SettingsToggle({
  title,
  description,
  dataid,
  isActive,
  toggle,
  disabled,
  icon,
  py = '$padding12',
}: SettingsToggleProps) {
  return (
    <Flex row alignItems="center" justifyContent="space-between" py={py}>
      <Flex row gap="$gap12" alignItems="center" maxWidth="80%" $xl={{ maxWidth: '70%' }}>
        {icon}
        <Flex>
          <Text variant="subheading2" color="$neutral1">
            {title}
          </Text>
          {description && (
            <Text variant="body3" color="$neutral2">
              {description}
            </Text>
          )}
        </Flex>
      </Flex>
      <Switch testID={dataid} variant="branded" checked={isActive} onCheckedChange={toggle} disabled={disabled} />
    </Flex>
  )
}
