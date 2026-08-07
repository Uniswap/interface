import { Flex, styled } from 'ui/src'

const Card = styled(Flex, {
  borderRadius: '$rounded16',
  padding: '$spacing16',
})

export function CardBox(): JSX.Element {
  return <Card />
}
