import { Flex, Text, TouchableArea, type TouchableAreaProps } from '@universe/mycelium'

/** Where a row renders its category pill: at the right edge (before any right element) or beside the name. */
export type CategoryTagPlacement = 'right' | 'title'

const PILL_FRAME_PROPS = {
  row: true,
  alignItems: 'center',
  alignSelf: 'center',
  flexShrink: 0,
  px: '$spacing6',
  py: '$spacing2',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  borderRadius: '$roundedFull',
} as const

export function CategoryTagPill({
  label,
  onPress,
  testID,
}: {
  label: string
  /** When set the pill is pressable, with a hover state; otherwise it is a static badge. */
  onPress?: TouchableAreaProps['onPress']
  testID?: string
}): JSX.Element {
  const text = (
    <Text color="$neutral2" variant="body4" numberOfLines={1}>
      {label}
    </Text>
  )

  if (!onPress) {
    return (
      <Flex {...PILL_FRAME_PROPS} testID={testID}>
        {text}
      </Flex>
    )
  }

  return (
    <TouchableArea
      {...PILL_FRAME_PROPS}
      hoverStyle={{ backgroundColor: '$surface2', borderColor: '$surface3Hovered' }}
      testID={testID}
      onPress={onPress}
    >
      {text}
    </TouchableArea>
  )
}
