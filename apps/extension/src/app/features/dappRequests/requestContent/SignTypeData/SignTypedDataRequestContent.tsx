import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { ActionCanNotBeCompletedContent } from 'src/app/features/dappRequests/requestContent/ActionCanNotBeCompleted/ActionCanNotBeCompletedContent'
import { UniswapXSwapRequestContent } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/SwapRequestContent'
import { NonStandardTypedDataRequestContent } from 'src/app/features/dappRequests/requestContent/SignTypeData/NonStandardTypedDataRequestContent'
import { SignTypedDataRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Flex } from 'ui/src'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
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
  const blockaidTransactionScanning = useFeatureFlag(FeatureFlags.BlockaidTransactionScanning)

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
      {blockaidTransactionScanning ? (
        <SignTypedDataRequestContentWithScanning dappRequest={dappRequest} />
      ) : (
        <SignTypedDataRequestContentLegacy dappRequest={dappRequest} />
      )}
    </ErrorBoundary>
  )
}

/**
 * Implementation with Blockaid scanning
 */
function SignTypedDataRequestContentWithScanning({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl, currentAccount } = useDappRequestQueueContext()
  const { value: confirmedRisk, setValue: setConfirmedRisk } = useBooleanState(false)
  const enablePermitMismatchUx = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  // Initialize with null to indicate scan hasn't completed yet
  const [riskLevel, setRiskLevel] = useState<TransactionRiskLevel | null>(null)

  const parsedTypedData = JSON.parse(dappRequest.typedData)
  const { chainId: domainChainId } = parsedTypedData.domain || {}
  const chainId = toSupportedChainId(domainChainId)

  const hasMismatch = chainId ? getHasMismatch(chainId) : false
  if (enablePermitMismatchUx && hasMismatch) {
    return <ActionCanNotBeCompletedContent />
  }

  if (!chainId) {
    // chainId is required for Blockaid scanning
    return <SignTypedDataRequestContentLegacy dappRequest={dappRequest} />
  }

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
 * Legacy implementation (existing behavior when feature flag is off)
 */
function SignTypedDataRequestContentLegacy({ dappRequest }: SignTypedDataRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const enablePermitMismatchUx = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const getHasMismatch = useHasAccountMismatchCallback()

  const parsedTypedData = JSON.parse(dappRequest.typedData)

  if (!isEIP712TypedData(parsedTypedData)) {
    return <NonStandardTypedDataRequestContent dappRequest={dappRequest} />
  }

  const { chainId: domainChainId } = parsedTypedData.domain || {}
  const chainId = toSupportedChainId(domainChainId)

  const hasMismatch = chainId ? getHasMismatch(chainId) : false
  if (enablePermitMismatchUx && hasMismatch) {
    return <ActionCanNotBeCompletedContent />
  }

  if (isUniswapXSwapRequest(parsedTypedData)) {
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
