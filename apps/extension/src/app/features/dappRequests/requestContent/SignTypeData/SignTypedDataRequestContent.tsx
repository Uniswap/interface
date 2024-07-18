import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { DomainContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/DomainContent'
import { MaybeExplorerLinkedAddress } from 'src/app/features/dappRequests/requestContent/SignTypeData/MaybeExplorerLinkedAddress'
import { Permit2RequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/Permit2/Permit2RequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { EIP712Message, isEIP712TypedData } from 'src/app/features/dappRequests/types/EIP712Types'
import { isPermit2 } from 'src/app/features/dappRequests/types/Permit2Types'
import { Flex, Text } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { isAddress } from 'utilities/src/addresses'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

interface SignTypedDataRequestProps {
  dappRequest: SignTypedDataRequest
}

export function SignTypedDataRequestContent({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()

  const parsedTypedData = JSON.parse(dappRequest.typedData)

  if (!isEIP712TypedData(parsedTypedData)) {
    return (
      <DappRequestContent
        showNetworkCost
        confirmText={t('common.button.sign')}
        title={t('dapp.request.signature.header')}
      >
        <Flex gap="$spacing12" p="$spacing16">
          <Text>{t('dapp.request.signature.error.712-spec-compliance')}</Text>
          <Flex
            $platform-web={{ overflowY: 'auto' }}
            backgroundColor="$surface2"
            borderColor="$surface3"
            borderRadius="$rounded16"
            borderWidth={1}
            flexDirection="column"
            gap="$spacing4"
            maxHeight={200}
            p="$spacing12"
            position="relative"
          >
            {dappRequest.typedData}
          </Flex>
        </Flex>
      </DappRequestContent>
    )
  }

  if (isPermit2(parsedTypedData)) {
    return <Permit2RequestContent dappRequest={dappRequest} />
  }

  const { name, version, chainId: domainChainId, verifyingContract, salt } = parsedTypedData?.domain || {}

  // todo(EXT-883): remove this when we start rejecting unsupported chain signTypedData requests
  const chainId = toSupportedChainId(domainChainId)
  const renderMessageContent = (
    message: EIP712Message | EIP712Message[keyof EIP712Message],
    i = 1,
  ): Maybe<JSX.Element | JSX.Element[]> => {
    if (typeof message === 'string' && isAddress(message) && chainId) {
      const href = getExplorerLink(chainId, message, ExplorerDataType.ADDRESS)
      return <MaybeExplorerLinkedAddress address={message} link={href} />
    }
    if (typeof message === 'string' || typeof message === 'number' || typeof message === 'boolean') {
      return (
        <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
          {message.toString()}
        </Text>
      )
    } else if (typeof message === 'object') {
      return Object.entries(message).map(([key, value], index) => (
        <Flex key={`${key}-${index}`} flexDirection="row" gap="$spacing8">
          <Text color="$neutral2" flexShrink={0} fontWeight="bold" variant="body4">
            {key}
          </Text>
          <Flex flexBasis="0%" flexDirection="column" flexGrow={1} flexWrap="wrap" gap="$spacing4">
            {renderMessageContent(value, i + 1)}
          </Flex>
        </Flex>
      ))
    }
  }

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
    >
      <Flex
        $platform-web={{ overflowY: 'auto' }}
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth={1}
        flexDirection="column"
        gap="$spacing4"
        maxHeight={200}
        p="$spacing16"
      >
        <DomainContent
          chainId={domainChainId}
          name={name}
          salt={salt}
          verifyingContract={verifyingContract}
          version={version}
        />
        {renderMessageContent(parsedTypedData.message)}
      </Flex>
    </DappRequestContent>
  )
}
