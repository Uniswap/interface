import { BigNumber } from 'ethers'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { useCopyToClipboard } from 'src/app/hooks/useOnCopyToClipboard'
import { Anchor, Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedCopySheets, ExternalLink } from 'ui/src/components/icons'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { CopyNotificationType } from 'wallet/src/features/notifications/types'
import { ContentRow } from 'wallet/src/features/transactions/TransactionRequest/ContentRow'
import { SpendingDetails } from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'
import { ExplorerDataType, getExplorerLink } from 'wallet/src/utils/linking'

interface FallbackEthSendRequestProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: SendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: () => Promise<void>
}

export function FallbackEthSendRequestContent({
  dappRequest,
  transactionGasFeeResult,
  onCancel,
  onConfirm,
}: FallbackEthSendRequestProps): JSX.Element | null {
  const { t } = useTranslation()
  const { dappUrl } = useDappRequestQueueContext()
  const activeChain = useDappLastChainId(dappUrl)

  const { value: sending, to: toAddress, chainId: transactionChainId } = dappRequest.transaction
  const chainId = transactionChainId || activeChain
  const recipientLink = chainId && toAddress ? getExplorerLink(chainId, toAddress, ExplorerDataType.ADDRESS) : ''
  const contractFunction = dappRequest.transaction.type
  const calldata = dappRequest.transaction.data

  const copyToClipboard = useCopyToClipboard()

  const copyCalldata = useCallback(
    () =>
      copyToClipboard({
        textToCopy: calldata,
        copyType: CopyNotificationType.Calldata,
      }),
    [calldata, copyToClipboard],
  )

  return (
    <DappRequestContent
      showNetworkCost
      confirmText={t('common.button.confirm')}
      title={t('dapp.request.base.title')}
      transactionGasFeeResult={transactionGasFeeResult}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      <Flex
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderRadius="$rounded16"
        borderWidth={1}
        gap="$spacing12"
        p="$spacing16"
        width="100%"
      >
        {sending && !BigNumber.from(sending).eq(0) && chainId && <SpendingDetails chainId={chainId} value={sending} />}
        {toAddress && (
          <ContentRow label={t('common.text.recipient')}>
            <Anchor href={recipientLink} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
              <Flex row alignItems="center" gap="$spacing8">
                <Text color="$neutral1" variant="body4">
                  {shortenAddress(toAddress)}
                </Text>
                <ExternalLink color="$neutral3" size="$icon.16" />
              </Flex>
            </Anchor>
          </ContentRow>
        )}
        <ContentRow label={t('dapp.request.fallback.function.label')}>
          <Text
            borderColor="$surface3"
            borderRadius="$rounded8"
            borderWidth={1}
            color="$neutral1"
            // fontFamily="SF Mono"
            px="$spacing8"
            py="$spacing2"
            // variant="monospace"
            variant="body4"
          >
            {contractFunction || t('common.text.unknown')}
          </Text>
        </ContentRow>
        {calldata && (
          <ContentRow label={t('dapp.request.fallback.calldata.label')}>
            <TouchableArea
              alignItems="center"
              cursor="pointer"
              display="flex"
              flexDirection="row"
              gap="$spacing8"
              onPress={copyCalldata}
            >
              <Text color="$neutral1" variant="body4">
                {ellipseMiddle(calldata)}
              </Text>
              <AnimatedCopySheets color="$neutral3" size="$icon.16" />
            </TouchableArea>
          </ContentRow>
        )}
      </Flex>
    </DappRequestContent>
  )
}
