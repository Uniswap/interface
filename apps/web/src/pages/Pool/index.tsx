import Positions from 'pages/Pool/Positions'
import TopPools from 'pages/Pool/TopPools'
import { Flex } from 'ui/src'

export default function Pool() {
  return (
    <Flex row maxWidth="$xxl" width="100%" gap={60} mt="$spacing48" mx="$spacing40">
      <Flex grow>
        <Positions />
      </Flex>
      <Flex width={360}>
        <TopPools />
      </Flex>
    </Flex>
  )
}
