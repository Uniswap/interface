import UI, { Flex } from 'ui/src'

export function DefaultAndNamed(): JSX.Element {
  return (
    <UI.Theme name="dark">
      <Flex row />
    </UI.Theme>
  )
}
