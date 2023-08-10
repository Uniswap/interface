import { SignTypedDataRequest } from 'src/background/features/dappRequests/dappRequestTypes'
import { AddressFooter } from 'src/background/features/dappRequests/requestContent/AddressFooter'
import { DappRequestStoreItem } from 'src/background/features/dappRequests/slice'
import { Text, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { EthTypedMessage } from 'wallet/src/features/wallet/signing/types'

export const SignTypedDataDetails = ({
  activeAccount,
  chainId,
  request,
}: {
  activeAccount: Account
  chainId: number
  request: DappRequestStoreItem
}): JSX.Element => {
  const rawTypedData = (request.dappRequest as SignTypedDataRequest).typedData
  const typedData: EthTypedMessage = JSON.parse(rawTypedData)

  return (
    <YStack backgroundColor="$scrim" borderRadius="$rounded16" flex={1}>
      <YStack flexShrink={1} gap="$spacing16" margin="$none" overflow="scroll" padding="$spacing16">
        {getParsedObjectDisplay(chainId, typedData.message)}
      </YStack>
      <Flex>
        <AddressFooter account={activeAccount} />
      </Flex>
    </YStack>
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
    <YStack gap="$spacing4">
      {Object.keys(obj).map((objKey) => {
        const childValue = obj[objKey]

        // obj is a json object, check if childValue is an array:
        if (typeof childValue === 'object') {
          return (
            <YStack key={objKey} gap="$spacing8">
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
            </YStack>
          )
        }

        if (typeof childValue === 'string') {
          return (
            <XStack
              key={objKey}
              alignItems="center"
              flex={1}
              gap="$spacing8"
              paddingVertical="$spacing4"
              width="100%">
              <Text color="$neutral2" fontSize={14} fontWeight="300" variant="monospace">
                {objKey}
              </Text>
              <Text fontSize={14} fontWeight="300">
                {childValue}
              </Text>
            </XStack>
          )
        }

        return null
      })}
    </YStack>
  )
}
