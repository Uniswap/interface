import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { SettingsDropdown, SettingsDropdownProps } from 'src/app/features/settings/SettingsDropdown'
import { Flex, GeneratedIcon, Text, TouchableArea } from 'ui/src'

type SettingsItemWithDropdownProps = {
  Icon: GeneratedIcon
  title: string
  disableDropdown?: boolean
  onDisabledDropdownPress?: () => void
} & SettingsDropdownProps

export function SettingsItemWithDropdown(props: SettingsItemWithDropdownProps): JSX.Element {
  const { title, disableDropdown, Icon, onDisabledDropdownPress, ...dropdownProps } = props

  const dropdown = <SettingsDropdown disableDropdown={disableDropdown} {...dropdownProps} />

  return (
    <Flex row alignItems="center" px={SCREEN_ITEM_HORIZONTAL_PAD} py="$spacing4">
      <Flex fill row gap="$spacing12">
        <Icon color="$neutral2" size="$icon.24" />
        <Text color="$neutral1" variant="subheading2">
          {title}
        </Text>
      </Flex>
      {disableDropdown ? (
        <TouchableArea onPress={() => onDisabledDropdownPress?.()}>{dropdown}</TouchableArea>
      ) : (
        dropdown
      )}
    </Flex>
  )
}
