import { Flex } from 'ui/src'

export function FadeIn({ visible }: { visible: boolean }): JSX.Element {
  return <Flex animation="quick" opacity={visible ? 1 : 0} />
}
