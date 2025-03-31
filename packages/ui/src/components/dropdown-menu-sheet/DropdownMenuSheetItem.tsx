import { useCallback } from 'react'
import { I18nManager } from 'react-native'
import { Spacer } from 'tamagui'
import { CheckCircleFilled } from 'ui/src/components/icons'
import { Flex, FlexProps } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import { TouchableArea } from 'ui/src/components/touchable'

type Id = string

type DropdownMenuSheetItemProps = {
  id: Id
  label: string
  icon?: React.ReactNode
  isSelected: boolean
  onPress: (id: Id) => void
}

// Designated by Design Spec
// https://www.notion.so/uniswaplabs/Dropdown-Selector-91299ddf1ba94e2d8f0168350d2dc923?pvs=4
export const MAX_WIDTH = 250

export const DropdownMenuSheetItem = ({
  label,
  icon,
  isSelected,
  onPress,
  id,
}: DropdownMenuSheetItemProps): JSX.Element => {
  const handlePress = useCallback(() => onPress(id), [id, onPress])

  const flexDirection: FlexProps['flexDirection'] = I18nManager.isRTL ? 'row-reverse' : 'row'

  return (
    <TouchableArea
      flexGrow={1}
      py="$spacing12"
      px="$spacing16"
      gap="$spacing8"
      flexDirection={flexDirection}
      justifyContent="space-between"
      alignItems="center"
      maxWidth={MAX_WIDTH}
      backgroundColor="$background"
      onPress={handlePress}
    >
      <Flex shrink flexDirection={flexDirection} alignItems="center">
        {icon && <Flex flexShrink={0}>{icon}</Flex>}
        {icon && <Spacer size="$spacing8" />}
        <Text flexShrink={1} numberOfLines={1} ellipsizeMode="tail" variant="buttonLabel2">
          {label}
        </Text>
      </Flex>
      <Flex flexShrink={0}>{isSelected ? <CheckCircleFilled size="$icon.20" /> : <Spacer size="$spacing20" />}</Flex>
    </TouchableArea>
  )
}
