import { Flex, styled, Text, type TextProps, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'

export const HookTileContainer = styled(TouchableArea, {
  flex: 1,
  p: '$spacing16',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
})

export function HookTile({
  selected,
  title,
  titleVariant = 'buttonLabel3',
  description,
  descriptionVariant = 'body4',
  onPress,
}: {
  selected: boolean
  title: string
  titleVariant?: TextProps['variant']
  description: string
  descriptionVariant?: TextProps['variant']
  onPress: () => void
}) {
  return (
    <HookTileContainer onPress={onPress} background={selected ? '$surface3' : '$surface1'}>
      <Flex row gap="$spacing8" justifyContent="space-between" alignItems="center">
        <Text variant={titleVariant}>{title}</Text>
        {selected && <CheckCircleFilled size="$icon.16" />}
      </Flex>
      <Text variant={descriptionVariant} color="$neutral2">
        {description}
      </Text>
    </HookTileContainer>
  )
}
