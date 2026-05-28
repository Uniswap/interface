import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { Flex, GeneratedIcon, Switch, Text } from 'ui/src'

export function SettingsToggleRow({
  Icon,
  title,
  checked,
  disabled,
  onCheckedChange,
}: {
  title: string
  Icon: GeneratedIcon
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}): JSX.Element {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="$spacing16"
      justifyContent="space-between"
      px={SCREEN_ITEM_HORIZONTAL_PAD}
      py="$spacing4"
    >
      <Flex row gap="$spacing12">
        <Icon color="$neutral2" size="$icon.24" />
        <Text>{title}</Text>
      </Flex>
      <Switch checked={checked} variant="branded" disabled={disabled} onCheckedChange={onCheckedChange} />
    </Flex>
  )
}
