import { Flex, useSporeColors } from 'ui/src'

export function ColoredBox(): JSX.Element {
  const colors = useSporeColors()
  return <Flex backgroundColor={colors.surface2.val} />
}
