import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ActionCanNotBeCompletedContent } from 'src/app/features/dappRequests/requestContent/ActionCanNotBeCompleted/ActionCanNotBeCompletedContent'
import { PermissionedSwapBlockedContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/PermissionedSwapBlockedContent'
import { UniswapXSwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { useUniswapXSwapPermissionedBlock } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/useSwapRequestPermissionedBlock'
import { NonStandardTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/NonStandardTypedDataRequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedDappChainId } from 'uniswap/src/features/chains/utils'
import { useHasAccountMismatchCallback } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { logger } from 'utilities/src/logger/logger'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { DappSignTypedDataContent } from 'wallet/src/components/dappRequests/DappSignTypedDataContent'
import { Permit2Content } from 'wallet/src/components/dappRequests/SignTypedData/Permit2Content'
import { StandardTypedDataContent } from 'wallet/src/components/dappRequests/SignTypedData/StandardTypedDataContent'
import { isEIP712TypedData } from 'wallet/src/components/dappRequests/types/EIP712Types'
import { isPermit2, isUniswapXSwapRequest } from 'wallet/src/components/dappRequests/types/Permit2Types'
import { ErrorBoundary } from 'wallet/src/components/ErrorBoundary/ErrorBoundary'
import { TransactionRiskLevel } from 'wallet/src/features/dappRequests/types'
import { shouldDisableConfirm } from 'wallet/src/features/dappRequests/utils/riskUtils'

interface SignTypedDataRequestProps {
  dappRequest: SignTypedDataRequest
}

export function SignTypedDataRequestContent({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  return (
    <UniswapXSwapPermissionedGate dappRequest={dappRequest}>
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
    </UniswapXSwapPermissionedGate>
  )
}

/**
 * Refuses a UniswapX swap of a permissioned token when the signing wallet is not allowlisted,
 * at the PRIMARY path. The Blockaid typed-data scan UI (SignTypedDataRequestContentInner) has a
 * sign button and no permissioned awareness; UniswapXSwapRequestContent (which carries the block)
 * only renders in the no-chainId/Blockaid-failure fallback. Parses defensively because this runs
 * outside the ErrorBoundary; a non-UniswapX or malformed payload falls through to children.
 */
function UniswapXSwapPermissionedGate({
  dappRequest,
  children,
}: {
  dappRequest: SignTypedDataRequest
  children: JSX.Element
}): JSX.Element {
  const { currentAccount } = useDappRequestQueueContext()
  const authorizedChainId = useAuthorizedChainId()

  const typedData = useMemo(() => {
    if (!authorizedChainId) {
      return undefined
    }

    try {
      const parsed = JSON.parse(dappRequest.typedData)
      return isUniswapXSwapRequest(parsed, authorizedChainId) ? parsed : undefined
    } catch {
      return undefined
    }
  }, [dappRequest.typedData, authorizedChainId])

  const permissionedBlock = useUniswapXSwapPermissionedBlock({ typedData, walletAddress: currentAccount.address })

  if (permissionedBlock.isBlocked) {
    // No onCancel: mirror UniswapXSwapRequestContent, which relies on the dapp-request queue's
    // default cancel handler.
    return (
      <PermissionedSwapBlockedContent
        blockedSymbol={permissionedBlock.blockedSymbol}
        kycUrl={permissionedBlock.kycUrl}
      />
    )
  }

  return children
}

function SignTypedDataRequestContentInner({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const authorizedChainId = useAuthorizedChainId()
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  const enablePermitMismatchUx = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const parsedTypedData = JSON.parse(dappRequest.typedData)
  const domainChainId = toSupportedDappChainId(parsedTypedData.domain?.chainId)

  const hasMismatch = authorizedChainId ? getHasMismatch(authorizedChainId) : false
  if (enablePermitMismatchUx && hasMismatch) {
    return <ActionCanNotBeCompletedContent />
  }

  // No authorized chain, or a payload that disagrees with it, means something is wrong: intake
  // and confirm both reject a mismatched domain chain. Show the raw domain rather than a preview.
  if (!authorizedChainId || domainChainId !== authorizedChainId) {
    return <SignTypedDataRequestContentFallback dappRequest={dappRequest} />
  }

  const chainId = authorizedChainId

  // Extension SignTypedData requests default to v4 method (modern standard)
  const method = 'eth_signTypedData_v4'

  // For eth_signTypedData_v4, params are [account, typedData]
  const params = [currentAccount.address, dappRequest.typedData]

  const disableConfirm = shouldDisableConfirm({ riskLevel, confirmedRisk })

  return (
    <DappRequestContent
      confirmText={t('common.button.sign')}
      title={t('dapp.request.signature.header')}
      showAddressFooter={false}
      disableConfirm={disableConfirm}
      isCriticalRisk={riskLevel === TransactionRiskLevel.Critical}
    >
      <DappSignTypedDataContent
        chainId={chainId}
        account={currentAccount.address}
        method={method}
        params={params}
        dappUrl={dappUrl}
        confirmedRisk={confirmedRisk}
        onConfirmRisk={setConfirmedRisk}
        onRiskLevelChange={setRiskLevel}
        typedData={dappRequest.typedData}
      />
    </DappRequestContent>
  )
}

/**
 * Chain the request was authorized on, captured at queue time. The snapshot rather than
 * `useDappLastChainId`, which an auto-confirmed wallet_switchEthereumChain can move mid-prompt.
 */
function useAuthorizedChainId(): UniverseChainId | undefined {
  const { request } = useDappRequestQueueContext()
  return request?.dappInfo?.lastChainId
}

/**
 * Fallback for when chainId is not available (required for Blockaid scanning)
 */
function SignTypedDataRequestContentFallback({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const authorizedChainId = useAuthorizedChainId()
  const enablePermitMismatchUx = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  const parsedTypedData = JSON.parse(dappRequest.typedData)

  if (!isEIP712TypedData(parsedTypedData)) {
    return <NonStandardTypedDataRequestContent dappRequest={dappRequest} />
  }

  const hasMismatch = authorizedChainId ? getHasMismatch(authorizedChainId) : false
  if (enablePermitMismatchUx && hasMismatch) {
    return <ActionCanNotBeCompletedContent />
  }

  if (authorizedChainId && isUniswapXSwapRequest(parsedTypedData, authorizedChainId)) {
    return <UniswapXSwapRequestContent typedData={parsedTypedData} />
  }

  const isPermit2Request = isPermit2(parsedTypedData)

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.sign')}
      title={isPermit2Request ? t('dapp.request.permit2.header') : t('dapp.request.signature.header')}
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
        py="$spacing16"
      >
        {isPermit2Request ? (
          <Permit2Content typedData={dappRequest.typedData} />
        ) : (
          <StandardTypedDataContent domain={parsedTypedData.domain || {}} message={parsedTypedData.message} />
        )}
      </Flex>
    </DappRequestContent>
  )
}
