import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex, GeneratedIcon, IconProps, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function ScreenHeader({
  onBackClick,
  title,
  rightColumn,
  Icon = BackArrow,
}: {
  title?: JSX.Element | string
  onBackClick?: () => void
  rightColumn?: JSX.Element
  Icon?: GeneratedIcon | ((props: IconProps) => JSX.Element)
}): JSX.Element {
  const { navigateBack } = useExtensionNavigation()

  return (
    <Flex row alignItems="center" px="$spacing8" py="$spacing4" width="100%">
      <TouchableArea onPress={onBackClick ?? navigateBack}>
        <Icon color="$neutral2" size="$icon.24" />
      </TouchableArea>

      {/* When there's no right column, we adjust the margin to match the icon width. This is so that the title is centered on the screen. */}
      <Flex centered fill mr={rightColumn ? '$none' : iconSizes.icon24} py="$spacing8">
        {/* // Render empty string if no title to account for Text element added padding for consistent size*/}
        <Text variant="subheading1">{title ?? ' '}</Text>
      </Flex>

      {rightColumn && <Flex>{rightColumn}</Flex>}
    </Flex>
  )
}
