import { Text, XStack, YStack } from 'ui/src'
import { Unicon } from 'ui/src/components/Unicon'
import { RequestDisplayDetails } from 'wallet/src/features/dappRequests/DappRequestContent'
import { SignTypedDataRequest } from 'wallet/src/features/dappRequests/dappRequestTypes'
import { Account } from 'wallet/src/features/wallet/types'

export const SignTypedDataDetails = ({
  activeAccount,
  chainId,
  request,
}: {
  activeAccount: Account
  chainId: number
  request: RequestDisplayDetails
}): JSX.Element => {
  const rawTypedData = (request.request.dappRequest as SignTypedDataRequest)
    .typedData
  const typedData = JSON.parse(rawTypedData)

  return (
    <YStack flex={1} overflow="scroll" width="100%">
      <YStack
        backgroundColor="$backgroundScrim"
        borderTopLeftRadius="$rounded16"
        borderTopRightRadius="$rounded16"
        gap="$spacing16"
        margin="$none"
        paddingHorizontal="$spacing16"
        paddingVertical="$spacing12">
        {getParsedObjectDisplay(chainId, typedData.message)}
      </YStack>
      <YStack
        backgroundColor="$backgroundScrim"
        borderBottomLeftRadius="$rounded16"
        borderBottomRightRadius="$rounded16">
        <XStack
          borderTopColor="$background"
          borderTopWidth="$spacing1"
          justifyContent="space-between"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing16">
          <XStack gap="$spacing8">
            <Unicon address={activeAccount.address} />
            <Text variant="subheadSmall">
              {activeAccount.name === undefined ? 'Wallet' : activeAccount.name}
            </Text>
          </XStack>
          <Text
            color="$textSecondary"
            overflow="hidden"
            textAlign="right"
            textOverflow="ellipsis"
            variant="bodySmall">
            {/* TODO: Use util to format address */}
            {activeAccount.address.substring(0, 4)}...
            {activeAccount.address.substring(
              activeAccount.address.length - 4,
              activeAccount.address.length
            )}
          </Text>
        </XStack>
      </YStack>
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

        if (typeof childValue === 'object') {
          return (
            <YStack key={objKey} gap="$spacing4">
              <Text
                color="textTertiary"
                marginLeft={depth * 5}
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
              alignItems="flex-start"
              gap="$spacing8"
              marginLeft={depth * 5}>
              <Text
                color="textTertiary"
                paddingVertical="$spacing4"
                variant="monospace">
                {objKey}
              </Text>
              <YStack flexShrink={1}>
                {/* // TODO: Add address type validation */}
                {/* {getValidAddress(childValue, true) ? (
                  <AddressButton
                    address={childValue}
                    chainId={chainId}
                    textVariant="monospace"
                  />
                ) : ( */}
                <Text paddingVertical="$spacing4" variant="monospace">
                  {childValue}
                </Text>
                {/* )} */}
              </YStack>
            </XStack>
          )
        }

        return null
      })}
    </YStack>
  )
}
