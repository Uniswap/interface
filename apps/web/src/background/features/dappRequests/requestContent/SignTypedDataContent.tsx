import { SignTypedDataRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { Flex, Text } from 'ui/src'
import { EthTypedMessage } from 'wallet/src/features/wallet/signing/types'

export const SignTypedDataDetails = ({
  chainId,
  request,
}: {
  chainId: number
  request: DappRequestStoreItem
}): JSX.Element => {
  const rawTypedData = (request.dappRequest as SignTypedDataRequest).typedData
  const typedData: EthTypedMessage = JSON.parse(rawTypedData)

  return (
    <Flex fill bg="$surface2" borderRadius="$rounded16">
      <Flex shrink gap="$spacing16" m="$none" overflow="scroll" p="$spacing16">
        {getParsedObjectDisplay(chainId, typedData.message)}
      </Flex>
    </Flex>
  )
}

const MAX_TYPED_DATA_PARSE_DEPTH = 3
const getParsedObjectDisplay = (
  chainId: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
  depth = 0
): JSX.Element => {
  if (depth === MAX_TYPED_DATA_PARSE_DEPTH + 1) {
    return <Text variant="monospace">...</Text>
  }

  return (
    <Flex gap="$spacing4">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        // obj is a json object, check if childValue is an array:
        if (typeof childValue === 'object') {
          return (
            <Flex key={objKey} gap="$spacing8">
              <Text
                alignItems="flex-start"
                color="$neutral2"
                ellipse={true}
                fontSize={14}
                fontWeight="300"
                variant="monospace">
                {objKey}
              </Text>
              {getParsedObjectDisplay(chainId, childValue, depth + 1)}
            </Flex>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <Flex
              key={objKey}
              fill
              row
              alignItems="center"
              gap="$spacing8"
              py="$spacing4"
              width="100%">
              <Text color="$neutral2" fontSize={14} fontWeight="300" variant="monospace">
                {objKey}
              </Text>
              <Text fontSize={14} fontWeight="300">
                {childValue}
              </Text>
            </Flex>
          )
        }

        return null
      })}
    </Flex>
  )
}
