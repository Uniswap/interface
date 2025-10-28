import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { ActionCanNotBeCompletedContent } from 'src/app/features/dappRequests/requestContent/ActionCanNotBeCompleted/ActionCanNotBeCompletedContent'
import { UniswapXSwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { DomainContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/DomainContent'
import { MaybeExplorerLinkedAddress } from 'src/app/features/dappRequests/requestContent/SignTypeData/MaybeExplorerLinkedAddress'
import { NonStandardTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/NonStandardTypedDataRequestContent'
import { Permit2RequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/Permit2/Permit2RequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { EIP712Message, isEIP712TypedData } from 'src/app/features/dappRequests/types/EIP712Types'
import { isPermit2, isUniswapXSwapRequest } from 'src/app/features/dappRequests/types/Permit2Types'
import { Flex, Text } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'

interface SignTypedDataRequestProps {
  dappRequest: SignTypedDataRequest
}

export function SignTypedDataRequestContent({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  return (
    <ErrorBoundary
      fallback={<NonStandardTypedDataRequestContent dappRequest={dappRequest} />}
      onError={(error) => {
        if (error) {
          logger.error(error, {
            tags: { file: 'SignTypedDataRequestContent', function: 'ErrorBoundary' },
            extra: {
              typedData: dappRequest.typedData,
              address: dappRequest.address,
            },
          })
        }
      }}
    >
      <SignTypedDataRequestContentInner dappRequest={dappRequest} />
    </ErrorBoundary>
  )
}

function SignTypedDataRequestContentInner({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const enablePermitMismatchUx = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  const parsedTypedData = JSON.parse(dappRequest.typedData)

  if (!isEIP712TypedData(parsedTypedData)) {
    return <NonStandardTypedDataRequestContent dappRequest={dappRequest} />
  }

  const { name, version, chainId: domainChainId, verifyingContract, salt } = parsedTypedData.domain || {}
  const chainId = toSupportedChainId(domainChainId)

  const hasMismatch = chainId ? getHasMismatch(chainId) : false
  if (enablePermitMismatchUx && hasMismatch) {
    return <ActionCanNotBeCompletedContent />
  }

  if (isUniswapXSwapRequest(parsedTypedData)) {
    return <UniswapXSwapRequestContent typedData={parsedTypedData} />
  }

  if (isPermit2(parsedTypedData)) {
    return <Permit2RequestContent dappRequest={dappRequest} />
  }

  // todo(EXT-883): remove this when we start rejecting unsupported chain signTypedData requests
  const renderMessageContent = (
    message: EIP712Message | EIP712Message[keyof EIP712Message],
    i = 1,
  ): Maybe<JSX.Element | JSX.Element[]> => {
    if (message === null || message === undefined) {
      return (
        <Text color="$neutral1" variant="body4">
          {String(message)}
        </Text>
      )
    }
    if (typeof message === 'string' && isEVMAddressWithChecksum(message) && chainId) {
      const href = getExplorerLink({ chainId, data: message, type: ExplorerDataType.ADDRESS })
      return <MaybeExplorerLinkedAddress address={message} link={href} />
    }
    if (typeof message === 'string' || typeof message === 'number' || typeof message === 'boolean') {
      return (
        <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
          {message.toString()}
        </Text>
      )
    } else if (Array.isArray(message)) {
      return (
        <Text $platform-web={{ overflowWrap: 'anywhere' }} color="$neutral1" variant="body4">
          {JSON.stringify(message)}
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

    return undefined
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
        borderWidth="$spacing1"
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
