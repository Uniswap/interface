import { MaybeExplorerLinkedAddress } from 'src/app/features/dappRequests/requestContent/SignTypeData/MaybeExplorerLinkedAddress'
import { EIP712DomainType } from 'src/app/features/dappRequests/types/EIP712Types'
import { Flex, Text } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'

export const DomainContent = ({
  chainId: domainChainId,
  name,
  version,
  verifyingContract,
  salt,
}: EIP712DomainType): JSX.Element => {
  const chainId = toSupportedChainId(domainChainId)
  const verifyingContractLink =
    chainId && verifyingContract ? getExplorerLink(chainId, verifyingContract, ExplorerDataType.ADDRESS) : undefined
  return (
    <>
      {name && (
        <Flex flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" variant="body4">
            name
          </Text>
          <Text color="$neutral1" variant="body4">
            {name}
          </Text>
        </Flex>
      )}
      {Boolean(chainId) && (
        <Flex flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" variant="body4">
            chainId
          </Text>
          <Text color="$neutral1" variant="body4">
            {chainId}
          </Text>
        </Flex>
      )}
      {verifyingContract && (
        <Flex flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" variant="body4">
            verifying contract
          </Text>
          <MaybeExplorerLinkedAddress address={verifyingContract} link={verifyingContractLink} />
        </Flex>
      )}
      {version && (
        <Flex flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" fontWeight="bold" variant="body4">
            version
          </Text>
          <Text color="$neutral1" variant="body4">
            {version}
          </Text>
        </Flex>
      )}
      {salt && (
        <Flex flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" fontWeight="bold" variant="body4">
            salt
          </Text>
          <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
            {salt}
          </Text>
        </Flex>
      )}
    </>
  )
}
