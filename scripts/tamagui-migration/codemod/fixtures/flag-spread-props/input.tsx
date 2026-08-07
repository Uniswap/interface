import { Flex } from 'ui/src'

export function PassthroughRow(props: Record<string, unknown>): JSX.Element {
  return <Flex row {...props} />
}
