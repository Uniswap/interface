import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useExploreSectionTitleProps } from 'src/components/explore/ExploreSections/useExploreSectionTitleProps'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

/**
 * Standardized Explore section header: subheading1 title with an optional trailing chevron when
 * the section links out, and an optional right-aligned element (e.g. the Top tokens sort button).
 */
export function ExploreSectionHeader({
  title,
  onPress,
  rightElement,
}: {
  title: string
  onPress?: () => void
  rightElement?: JSX.Element
}): JSX.Element {
  const titleProps = useExploreSectionTitleProps()
  const titleContent = (
    <Flex row alignItems="center" gap="$spacing8">
      <Text {...titleProps}>{title}</Text>
      {onPress && <RotatableChevron color="$neutral2" direction="end" size="$icon.20" />}
    </Flex>
  )

  return (
    <Flex row alignItems="center" justifyContent="space-between" px="$spacing16">
      {onPress ? <TouchableArea onPress={onPress}>{titleContent}</TouchableArea> : titleContent}
      {rightElement}
    </Flex>
  )
}
