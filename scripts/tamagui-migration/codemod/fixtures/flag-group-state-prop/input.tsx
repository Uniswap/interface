import { Flex } from 'ui/src'

export function HoverReveal(): JSX.Element {
  return (
    <Flex group="item">
      <Flex $group-item-hover={{ opacity: 1 }} opacity={0} />
    </Flex>
  )
}
