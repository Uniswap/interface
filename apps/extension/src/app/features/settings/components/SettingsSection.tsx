import { SCREEN_ITEM_HORIZONTAL_PAD } from 'src/app/constants'
import { Flex, Text } from 'ui/src'

export function SettingsSection({
  title,
  children,
}: {
  title: string
  children: JSX.Element | JSX.Element[]
}): JSX.Element {
  return (
    <Flex gap="$spacing8">
      <Text color="$neutral2" px={SCREEN_ITEM_HORIZONTAL_PAD} variant="subheading2">
        {title}
      </Text>
      {children}
    </Flex>
  )
}
