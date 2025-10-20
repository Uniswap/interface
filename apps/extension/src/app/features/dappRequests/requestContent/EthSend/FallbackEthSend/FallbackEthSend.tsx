import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { DappRequestContent } from 'src/app/features/dappRequests/DappRequestContent'
import { useDappRequestQueueContext } from 'src/app/features/dappRequests/DappRequestQueueContext'
import { isNonZeroBigNumber } from 'src/app/features/dappRequests/requestContent/EthSend/Swap/utils'
import { SendTransactionRequest } from 'src/app/features/dappRequests/types/DappRequestTypes'
import { Anchor, Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedCopySheets, ExternalLink } from 'ui/src/components/icons'
import { ContentRow } from 'uniswap/src/components/transactions/requests/ContentRow'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { useCopyToClipboard } from 'wallet/src/components/copy/useCopyToClipboard'
import {
  SpendingDetails,
  SpendingEthDetails,
} from 'wallet/src/features/transactions/TransactionRequest/SpendingDetails'
import { useNoYoloParser } from 'wallet/src/utils/useNoYoloParser'
import { useTransactionCurrencies } from 'wallet/src/utils/useTransactionCurrencies'

interface FallbackEthSendRequestProps {
  transactionGasFeeResult: GasFeeResult
  dappRequest: SendTransactionRequest
  onCancel: () => Promise<void>
  onConfirm: () => Promise<void>
}

// Minimum valid calldata is '0x' + 4 bytes (8 hex chars) for the function selector
const MIN_CALLDATA_LENGTH = 10

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
  const recipientLink =
    chainId && toAddress ? getExplorerLink({ chainId, data: toAddress, type: ExplorerDataType.ADDRESS }) : ''
  const contractFunction = dappRequest.transaction.type
  const calldata = dappRequest.transaction.data ?? ''

  const copyToClipboard = useCopyToClipboard()

  const copyCalldata = useCallback(
    () =>
      copyToClipboard({
        textToCopy: calldata,
        copyType: CopyNotificationType.Calldata,
      }),
    [calldata, copyToClipboard],
  )
  const { parsedTransactionData } = useNoYoloParser(dappRequest.transaction, chainId)
  const transactionCurrencies = useTransactionCurrencies({ chainId, to: toAddress, parsedTransactionData })
  const showSpendingEthDetails = isNonZeroBigNumber(sending) && chainId

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
        borderWidth="$spacing1"
        gap="$spacing12"
        p="$spacing16"
        width="100%"
      >
        {showSpendingEthDetails && <SpendingEthDetails chainId={chainId} value={sending} />}
        {transactionCurrencies.map((currencyInfo, i) => (
          <SpendingDetails
            key={currencyInfo.currencyId}
            currencyInfo={currencyInfo}
            showLabel={i === 0}
            tokenCount={transactionCurrencies.length}
          />
        ))}
        {toAddress && (
          <ContentRow label={t('common.text.contract')}>
            <Anchor href={recipientLink} rel="noopener noreferrer" target="_blank" textDecorationLine="none">
              <Flex row alignItems="center" gap="$spacing8">
                <Text color="$neutral1" variant="body4">
                  {shortenAddress({ address: toAddress })}
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
            borderWidth="$spacing1"
            color="$neutral1"
            px="$spacing8"
            py="$spacing2"
            variant="body4"
          >
            {parsedTransactionData?.name || contractFunction || t('common.text.unknown')}
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
                {calldata.length > MIN_CALLDATA_LENGTH ? ellipseMiddle({ str: calldata }) : calldata}
              </Text>
              <AnimatedCopySheets color="$neutral3" size="$icon.16" />
            </TouchableArea>
          </ContentRow>
        )}
      </Flex>
    </DappRequestContent>
  )
}
