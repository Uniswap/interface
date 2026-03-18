import { Flex, Text } from 'ui/src'

const SHADOW_OFFSET = { width: 0, height: 7 }
const MAC_OS_COMMAND_SYMBOL = '⌘'
const KEY_HEIGHT = 70

enum State {
  KeyUp = 0,
  KeyDown = 1,
  Highlighted = 2,
}

export interface KeyboardKeyProps {
  title: string
  px: React.ComponentProps<typeof Flex>['px']
  fontSize: React.ComponentProps<typeof Text>['fontSize']
  state: State
}

export function KeyboardKey({ title, px, fontSize, state }: KeyboardKeyProps): JSX.Element {
  return (
    <Flex
      alignItems="center"
      backgroundColor="$surface1"
      borderColor={state === State.KeyUp ? '$surface3' : '$accent2Hovered'}
      borderRadius="$rounded20"
      borderWidth="$spacing2"
      height={KEY_HEIGHT}
      justifyContent="center"
      px={px}
      shadowColor={state === State.KeyUp ? '$neutral3' : '$accent1Hovered'}
      shadowOffset={state === State.KeyDown ? undefined : SHADOW_OFFSET}
      shadowRadius={state === State.KeyDown ? '$spacing16' : undefined}
      top={state === State.KeyDown ? SHADOW_OFFSET.height : undefined}
    >
      <Text color={state === State.KeyUp ? '$neutral2' : '$accent1'} fontSize={fontSize}>
        {title === 'Meta' ? MAC_OS_COMMAND_SYMBOL : title}
      </Text>
    </Flex>
  )
}
