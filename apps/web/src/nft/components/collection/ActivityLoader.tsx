import { HeaderRow } from 'nft/components/collection/ActivityHeaderRow'
import { Flex, Shine } from 'ui/src'

const LoadingSquare = () => {
  return (
    <Shine>
      <Flex width={60} height={60} borderRadius="$rounded8" />
    </Shine>
  )
}

const LoadingSliver = () => {
  return (
    <Shine>
      <Flex height={16} width={108} borderRadius="$rounded8" />
    </Shine>
  )
}

const ActivityLoadingRow = () => {
  return (
    <Flex gap="$gap4" row width="100%" justifyContent="space-between" alignItems="center">
      <Flex row gap="$gap16" alignItems="center">
        <LoadingSquare />
        <LoadingSliver />
      </Flex>
      <Flex row alignItems="center">
        <LoadingSliver />
      </Flex>
      <Flex row alignItems="center" $md={{ display: 'none' }}>
        <LoadingSliver />
      </Flex>
      <Flex row $md={{ display: 'none' }}>
        <LoadingSliver />
      </Flex>
    </Flex>
  )
}

export const ActivityPageLoader = ({ rowCount }: { rowCount: number }) => {
  return (
    <Flex gap="$gap12">
      {[...Array(rowCount)].map((_, index) => (
        <ActivityLoadingRow key={index} />
      ))}
    </Flex>
  )
}

export const ActivityLoader = () => {
  return (
    <Flex mt="$spacing36">
      <HeaderRow />
      <ActivityPageLoader rowCount={10} />
    </Flex>
  )
}
