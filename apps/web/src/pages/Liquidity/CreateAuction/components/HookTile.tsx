import { Flex, Text, type TextCompatProps as TextProps, TouchableArea } from '@universe/mycelium'
import { CheckCircleFilled } from '@universe/mycelium/icons/CheckCircleFilled'
import { styled, type StyledComponent } from '@universe/mycelium/styled'

const HOOK_TILE_VARIANTS = {} as const

// Empty variants table + explicit annotation: the inferred styled() type isn't
// portable under declaration emit (TS2883).
export const HookTileContainer: StyledComponent<typeof TouchableArea, typeof HOOK_TILE_VARIANTS> = styled(
  TouchableArea,
  {
    variants: HOOK_TILE_VARIANTS,
    base: 'flex-1 p-4 gap-2 rounded-12 border border-surface3',
  },
)

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
  description?: string
  descriptionVariant?: TextProps['variant']
  onPress: () => void
}) {
  return (
    <HookTileContainer
      onPress={onPress}
      backgroundColor={selected ? '$surface3' : '$surface1'}
      $md={{ p: '$spacing12' }}
    >
      <Flex row gap="$spacing8" justifyContent="space-between" alignItems="center">
        <Text variant={titleVariant}>{title}</Text>
        {selected && <CheckCircleFilled size="$icon.16" />}
      </Flex>
      {description && (
        <Text variant={descriptionVariant} color="$neutral2">
          {description}
        </Text>
      )}
    </HookTileContainer>
  )
}
