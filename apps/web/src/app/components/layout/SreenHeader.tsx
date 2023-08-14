import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Icons, Text, XStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout'
import { iconSizes } from 'ui/src/theme/iconSizes'

export function ScreenHeader({
  onBackClick,
  title,
  rightColumn,
}: {
  title: JSX.Element | string
  onBackClick?: () => void
  rightColumn?: JSX.Element
}): JSX.Element {
  const { navigateBack } = useExtensionNavigation()

  return (
    <XStack alignItems="center" width="100%">
      <Button padding="$none" onPress={onBackClick ?? navigateBack}>
        <Icons.BackArrow color="$neutral2" height={iconSizes.icon24} width={iconSizes.icon24} />
      </Button>

      {/* When there's no right column, we adjust the margin to match the icon width. This is so that the title is centered on the screen. */}
      <Flex
        centered
        flex={1}
        marginRight={rightColumn ? '$none' : iconSizes.icon24}
        paddingVertical="$spacing8">
        <Text variant="bodyLarge">{title}</Text>
      </Flex>

      {rightColumn && <Flex>{rightColumn}</Flex>}
    </XStack>
  )
}
