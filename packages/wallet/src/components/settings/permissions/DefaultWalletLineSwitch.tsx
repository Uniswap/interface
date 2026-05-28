import { Flex, Switch, Text } from 'ui/src'

type DefaultWalletLineSwitchProps = {
  description: string
  title: string
  isChecked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const DefaultWalletLineSwitch = ({
  description,
  title,
  isChecked,
  onCheckedChange,
}: DefaultWalletLineSwitchProps): JSX.Element => {
  return (
    <Flex row gap="$gap16">
      <Flex shrink>
        <Text color="$neutral1" variant="subheading2">
          {title}
        </Text>
        <Text color="$neutral2" variant="body3">
          {description}
        </Text>
      </Flex>
      <Switch checked={isChecked} variant="branded" onCheckedChange={onCheckedChange} />
    </Flex>
  )
}
