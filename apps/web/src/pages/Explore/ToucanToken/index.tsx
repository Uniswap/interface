import { useParams } from 'react-router'
import { Flex } from 'ui/src'

export default function ToucanToken() {
  const { id } = useParams<{ id: string }>()
  return <Flex>ToucanToken: {id}</Flex>
}
