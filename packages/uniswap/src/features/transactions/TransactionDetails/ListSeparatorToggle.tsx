import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AnglesMaximize } from 'ui/src/components/icons/AnglesMaximize'
import { AnglesMinimize } from 'ui/src/components/icons/AnglesMinimize'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

export function ListSeparatorToggle({
  onPress,
  isOpen,
  openText,
  closedText,
}: {
  onPress: (() => void) | null | undefined
  isOpen?: boolean
  openText: string
  closedText: string
}): JSX.Element {
  return (
    <TouchableArea activeOpacity={1} testID={TestID.ListSeparatorToggle} onPress={onPress}>
      <Flex group row alignItems="center" mb="$spacing16" py="$spacing8">
        <Flex centered grow row gap="$spacing16">
          <Separator />
          <Flex centered row gap="$gap4" pl="$spacing4">
            <Text $group-hover={{ color: '$neutral2Hovered' }} color="$neutral2" variant="body3">
              {isOpen ? openText : closedText}
            </Text>
            {isOpen ? (
              <AnglesMinimize color="$neutral2" size="$icon.16" />
            ) : (
              <AnglesMaximize color="$neutral2" size="$icon.16" />
            )}
          </Flex>
          <Separator />
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
