import { useMemo } from 'react'
import { ScrollView } from 'react-native-gesture-handler'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { DomainContent } from 'wallet/src/components/dappRequests/SignTypedData/DomainContent'
import { MaybeExplorerLinkedAddress } from 'wallet/src/components/dappRequests/SignTypedData/MaybeExplorerLinkedAddress'
import { EIP712DomainType, EIP712Message } from 'wallet/src/components/dappRequests/types/EIP712Types'

interface StandardTypedDataContentProps {
  domain: EIP712DomainType
  message: EIP712Message
  maxHeight?: number
}

const SCROLL_VIEW_CONTENT_STYLE = {
  paddingHorizontal: spacing.spacing16,
  paddingBottom: spacing.spacing12,
}

/**
 * Content for standard EIP-712 typed data signatures
 * Shows domain information and structured message fields
 */
export function StandardTypedDataContent({
  domain,
  message,
  maxHeight = 200,
}: StandardTypedDataContentProps): JSX.Element {
  const { chainId: domainChainId } = domain
  const chainId = toSupportedChainId(domainChainId)

  const scrollViewStyle = useMemo(() => ({ maxHeight }), [maxHeight])

  function renderMessageContent(
    messageData: EIP712Message | EIP712Message[keyof EIP712Message],
    i = 1,
  ): Maybe<JSX.Element | JSX.Element[]> {
    if (messageData === null || messageData === undefined) {
      return (
        <Text color="$neutral1" variant="body4">
          {String(messageData)}
        </Text>
      )
    }
    if (typeof messageData === 'string' && isEVMAddressWithChecksum(messageData) && chainId) {
      const href = getExplorerLink({ chainId, data: messageData, type: ExplorerDataType.ADDRESS })
      return <MaybeExplorerLinkedAddress address={messageData} link={href} />
    }
    if (typeof messageData === 'string' || typeof messageData === 'number' || typeof messageData === 'boolean') {
      return (
        <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
          {messageData.toString()}
        </Text>
      )
    } else if (Array.isArray(messageData)) {
      return (
        <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
          {JSON.stringify(messageData)}
        </Text>
      )
    } else if (typeof messageData === 'object') {
      return Object.entries(messageData).map(([key, value], index) => (
        <Flex key={`${key}-${index}`} flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" flexShrink={0} fontWeight="bold" variant="body4">
            {key}
          </Text>
          <Flex flexBasis="0%" flexDirection="column" flexGrow={1} gap="$spacing4">
            {renderMessageContent(value, i + 1)}
          </Flex>
        </Flex>
      ))
    }

    return undefined
  }

  return (
    <Flex mb={-spacing.spacing12}>
      <ScrollView
        $platform-web={{ overflowY: 'auto' }}
        style={scrollViewStyle}
        contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE}
        showsVerticalScrollIndicator={true}
      >
        <DomainContent {...domain} />
        <Flex flexDirection="column" gap="$spacing6">
          {renderMessageContent(message)}
        </Flex>
      </ScrollView>
    </Flex>
  )
}
