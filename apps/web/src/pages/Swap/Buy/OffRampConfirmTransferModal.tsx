import { useMutation } from '@tanstack/react-query'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { useAccount } from 'hooks/useAccount'
import { useSendCallback } from 'hooks/useSendCallback'
import { GasSpeed, useTransactionGasFee } from 'hooks/useTransactionGasFee'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import { updateFiatOnRampTransaction } from 'state/fiatOnRampTransactions/reducer'
import { FiatOnRampTransactionStatus } from 'state/fiatOnRampTransactions/types'
import { statusToTransactionInfoStatus } from 'state/fiatOnRampTransactions/utils'
import { useAppDispatch } from 'state/hooks'
import { Button, Flex, Image, Text, useIsDarkMode } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { NetworkFeeWarning } from 'uniswap/src/components/gas/NetworkFeeWarning'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useFiatOnRampAggregatorOffRampTransferDetailsQuery } from 'uniswap/src/features/fiatOnRamp/api'
import {
  FORTransaction,
  OffRampTransferDetailsRequest,
  OffRampTransferDetailsResponse,
} from 'uniswap/src/features/fiatOnRamp/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FiatOffRampEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { useCreateTransferTransaction } from 'utils/transfer'

const ProviderDetails = ({ details }: { details: OffRampTransferDetailsResponse }) => {
  const { logos } = details
  const isDarkMode = useIsDarkMode()
  const logo = isDarkMode ? logos.darkLogo : logos.lightLogo

  return (
    <Flex row justifyContent="space-between">
      <Flex gap="$gap4">
        <Text variant="heading2" color="$neutral1">
          {details.provider}
        </Text>
        <Text variant="body3" color="$neutral2">
          {shortenAddress({ address: details.depositWalletAddress })}
        </Text>
      </Flex>
      <Flex justifyContent="center">
        <Flex borderRadius="$roundedFull" overflow="hidden">
          <Image source={{ uri: logo }} height={40} width={40} />
        </Flex>
      </Flex>
    </Flex>
  )
}

const TransferDetails = ({
  details,
  currencyInfo,
  transaction,
}: {
  details: OffRampTransferDetailsResponse
  currencyInfo: CurrencyInfo
  transaction: FORTransaction
}) => {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  return (
    <Flex row justifyContent="space-between">
      <Flex gap="$gap4">
        <Text variant="heading2" color="$neutral1">
          {formatNumberOrString({ value: details.baseCurrencyAmount, type: NumberType.TokenNonTx })}{' '}
          {details.baseCurrencyCode}
        </Text>
        <Text variant="body3" color="$neutral2">
          {convertFiatAmountFormatted(transaction.destinationAmount, NumberType.FiatTokenPrice)}
        </Text>
      </Flex>
      <Flex justifyContent="center">
        <CurrencyLogo currency={currencyInfo.currency} />
      </Flex>
    </Flex>
  )
}

export const OffRampConfirmTransferModal = ({
  isOpen,
  onClose,
  request,
}: {
  isOpen: boolean
  onClose: () => void
  request: OffRampTransferDetailsRequest
}) => {
  const account = useAccount()
  const { formatNumberOrString } = useLocalizationContext()
  const { provider } = useWeb3React()
  const dispatch = useAppDispatch()

  const [searchParams] = useSearchParams()
  const externalTransactionId = searchParams.get('externalTransactionId')

  const { t } = useTranslation()
  const transactions = useFiatOnRampTransactions()

  const {
    data: offRampTransferDetails,
    isLoading: offRampTransferDetailsLoading,
    error: offRampTransferDetailsError,
  } = useFiatOnRampAggregatorOffRampTransferDetailsQuery(request)

  const transaction = useMemo(
    () => (externalTransactionId ? transactions[externalTransactionId] : null),
    [transactions, externalTransactionId],
  )

  const hasError = useMemo(
    () => !transaction || !!offRampTransferDetailsError,
    [offRampTransferDetailsError, transaction],
  )

  const chainId = useSupportedChainId(
    offRampTransferDetails?.chainId ? Number(offRampTransferDetails.chainId) : undefined,
  )

  const currencyId = useMemo(() => {
    if (!offRampTransferDetails || !chainId) {
      return undefined
    }

    return buildCurrencyId(chainId, offRampTransferDetails.tokenAddress)
  }, [chainId, offRampTransferDetails])

  const currencyInfo = useCurrencyInfo(currencyId)

  const transferInfo = useMemo(() => {
    if (!offRampTransferDetails || !currencyInfo || !chainId) {
      return undefined
    }

    return {
      provider,
      account: account.address,
      chainId,
      currencyAmount: CurrencyAmount.fromRawAmount(
        currencyInfo.currency,
        offRampTransferDetails.baseCurrencyAmount * 10 ** currencyInfo.currency.decimals,
      ),
      toAddress: offRampTransferDetails.depositWalletAddress,
    }
  }, [offRampTransferDetails, currencyInfo, chainId, provider, account.address])

  const transferTransaction = useCreateTransferTransaction(transferInfo) ?? undefined
  const gasFee = useTransactionGasFee(transferTransaction, GasSpeed.Normal)
  const { value: gasFeeUSD, isLoading: gasFeeUSDIsLoading } = useUSDValueOfGasFee(chainId, gasFee.value)

  const analyticsProperties = useMemo(
    () => ({
      cryptoCurrency: offRampTransferDetails?.baseCurrencyCode ?? '',
      currencyAmount: offRampTransferDetails?.baseCurrencyAmount ?? 0,
      serviceProvider: offRampTransferDetails?.provider ?? '',
      chainId: offRampTransferDetails?.chainId ?? '',
      externalTransactionId: transaction?.externalSessionId ?? '',
    }),
    [offRampTransferDetails, transaction],
  )

  useEffect(() => {
    if (!transaction?.original) {
      return
    }

    // Prevent transfers against invalid offramp transactions
    if (
      [FiatOnRampTransactionStatus.FAILED, FiatOnRampTransactionStatus.COMPLETE].includes(
        statusToTransactionInfoStatus(transaction.original.status),
      )
    ) {
      onClose()
    }
  }, [transaction, onClose])

  const sendCallback = useSendCallback({
    currencyAmount: transferInfo?.currencyAmount,
    recipient: transferInfo?.toAddress,
    transactionRequest: transferTransaction,
    gasFee,
  })

  const { mutate: _handleSend, isPending: isSending } = useMutation({
    mutationFn: sendCallback,
    onSuccess: () => {
      if (!transaction?.original || !currencyId) {
        return
      }

      // Update local transaction from initiated to pending to start polling (See fiatOnRampTransactions/updater.ts)
      dispatch(
        updateFiatOnRampTransaction({
          ...transaction,
          status: FiatOnRampTransactionStatus.PENDING,
        }),
      )

      // This will be closed via updater.ts once there's a final status
      popupRegistry.addPopup(
        { type: PopupType.FORTransaction, transaction: transaction.original, currencyId },
        `forTransaction-${transaction.externalSessionId}`,
        Infinity,
      )

      sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampFundsSent, analyticsProperties)

      onClose()
    },
  })

  const handleSend = useCallback(() => {
    sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampWidgetCompleted, analyticsProperties)
    _handleSend()
  }, [_handleSend, analyticsProperties])

  if (offRampTransferDetailsLoading) {
    return null
  }

  if (hasError) {
    return (
      <Dialog
        isOpen
        onClose={onClose}
        title={t('fiatOffRamp.error.populateSend.title')}
        subtext={t('fiatOffRamp.error.populateSend.description')}
        icon={<AlertTriangleFilled color="$statusCritical" size="$icon.24" />}
        hasIconBackground
        primaryButtonText={t('common.close')}
        primaryButtonOnClick={onClose}
        primaryButtonVariant="default"
        modalName={ModalName.FiatOffRampConfirmTransferError}
      />
    )
  }

  return (
    <Modal name={ModalName.FiatOffRampConfirmTransfer} isModalOpen={isOpen} onClose={onClose} padding="$none">
      <Flex p="$spacing8" pt="$spacing12" gap="$gap24">
        <Flex px="$padding12" gap="$gap12">
          <GetHelpHeader
            title={
              <Text variant="subheading2" color="$neutral2">
                {t('common.youreSelling')}
              </Text>
            }
            link={uniswapUrls.helpArticleUrls.fiatOffRampHelp}
            closeModal={onClose}
          />
          <Flex py="$gap12" gap="$gap16">
            {offRampTransferDetails && currencyInfo && transaction?.original && (
              <TransferDetails
                currencyInfo={currencyInfo}
                details={offRampTransferDetails}
                transaction={transaction.original}
              />
            )}
            <ArrowDown size="$icon.20" color="$neutral3" />
            {offRampTransferDetails && <ProviderDetails details={offRampTransferDetails} />}
          </Flex>
          <Flex borderBottomWidth={1} borderColor="$surface3" mt="$padding12" mb="$spacing16" />
          <Flex row justifyContent="space-between">
            <Flex row alignItems="center" gap="$gap4">
              <Text variant="body3" color="$neutral2">
                {t('common.networkCost')}
              </Text>
              {chainId && <NetworkFeeWarning chainId={chainId} placement="top" />}
            </Flex>
            <Text variant="body3" color="$neutral2" loading={gasFeeUSDIsLoading}>
              {formatNumberOrString({
                value: gasFeeUSD ? Number(gasFeeUSD) : undefined,
                type: NumberType.FiatGasPrice,
              })}
            </Text>
          </Flex>
        </Flex>
        <Flex row>
          <Button variant="branded" emphasis="primary" onPress={handleSend} loading={isSending} isDisabled={isSending}>
            {t('common.confirmTransfer')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
