import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ColorTokens, Flex, Separator, Text, isWeb } from 'ui/src'
import { ActionSheetModalContent, MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyId } from 'uniswap/src/types/currency'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { FORMAT_DATE_LONG, useFormattedDate } from 'wallet/src/features/language/localizedDayjs'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { BaseSwapTransactionInfo, TransactionDetails, TransactionType } from 'wallet/src/features/transactions/types'
import { openLegacyFiatOnRampServiceProviderLink, openOnRampSupportLink } from 'wallet/src/utils/linking'

function renderOptionItem(label: string, textColorOverride?: ColorTokens): () => JSX.Element {
  return function OptionItem(): JSX.Element {
    return (
      <>
        <Separator />
        <Text color={textColorOverride ?? '$neutral1'} p="$spacing16" textAlign="center" variant="body1">
          {label}
        </Text>
      </>
    )
  }
}

interface TransactionActionModalProps {
  onExplore: () => void
  onViewTokenDetails?: (currencyId: CurrencyId) => void
  onViewMoonpay?: () => void
  onClose: () => void
  onCancel: () => void
  msTimestampAdded: number
  showCancelButton?: boolean
  transactionDetails: TransactionDetails
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  msTimestampAdded,
  onCancel,
  onClose,
  onViewTokenDetails,
  onExplore,
  onViewMoonpay,
  showCancelButton,
  transactionDetails,
}: TransactionActionModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const dateString = useFormattedDate(dayjs(msTimestampAdded), FORMAT_DATE_LONG)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const inputCurrencyInfo = useCurrencyInfo((transactionDetails.typeInfo as BaseSwapTransactionInfo).inputCurrencyId)

  const outputCurrencyInfo = useCurrencyInfo((transactionDetails.typeInfo as BaseSwapTransactionInfo).outputCurrencyId)

  const options = useMemo(() => {
    const isSwapTransaction = transactionDetails.typeInfo.type === TransactionType.Swap

    const maybeViewSwapToken =
      onViewTokenDetails && isSwapTransaction && inputCurrencyInfo && outputCurrencyInfo
        ? [
            {
              key: inputCurrencyInfo.currencyId,
              onPress: () => onViewTokenDetails(inputCurrencyInfo.currencyId),
              render: renderOptionItem(
                t('transaction.action.view', {
                  tokenSymbol: inputCurrencyInfo?.currency.symbol,
                }),
              ),
            },
            {
              key: outputCurrencyInfo.currencyId,
              onPress: () => onViewTokenDetails(outputCurrencyInfo.currencyId),
              render: renderOptionItem(
                t('transaction.action.view', {
                  tokenSymbol: outputCurrencyInfo?.currency.symbol,
                }),
              ),
            },
          ]
        : []

    const maybeViewOnMoonpayOption = onViewMoonpay
      ? [
          {
            key: ElementName.MoonpayExplorerView,
            onPress: onViewMoonpay,
            render: renderOptionItem(t('transaction.action.viewMoonPay')),
          },
        ]
      : []

    const chainInfo = UNIVERSE_CHAIN_INFO[transactionDetails.chainId]

    const maybeViewOnEtherscanOption = transactionDetails.hash
      ? [
          {
            key: ElementName.EtherscanView,
            onPress: onExplore,
            render: renderOptionItem(
              t('transaction.action.viewEtherscan', {
                blockExplorerName: chainInfo.explorer.name,
              }),
            ),
          },
        ]
      : []

    const transactionId = getTransactionId(transactionDetails)

    const maybeCopyTransactionIdOption = transactionId
      ? [
          {
            key: ElementName.Copy,
            onPress: async (): Promise<void> => {
              await setClipboard(transactionId)
              dispatch(
                pushNotification({
                  type: AppNotificationType.Copied,
                  copyType: CopyNotificationType.TransactionId,
                }),
              )
              handleClose()
            },
            render: onViewMoonpay
              ? renderOptionItem(t('transaction.action.copyMoonPay'))
              : renderOptionItem(t('transaction.action.copy')),
          },
        ]
      : []

    const transactionActionOptions: MenuItemProp[] = [
      ...maybeViewSwapToken,
      ...maybeViewOnMoonpayOption,
      ...maybeViewOnEtherscanOption,
      ...maybeCopyTransactionIdOption,
      {
        key: ElementName.GetHelp,
        onPress: async (): Promise<void> => {
          await openSupportLink(transactionDetails)
          handleClose()
        },
        render: renderOptionItem(t('settings.action.help')),
      },
    ]
    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: onCancel,
        render: renderOptionItem(t('transaction.action.cancel.button'), '$statusCritical'),
      })
    }
    return transactionActionOptions
  }, [
    transactionDetails,
    inputCurrencyInfo,
    outputCurrencyInfo,
    onViewMoonpay,
    onViewTokenDetails,
    t,
    onExplore,
    showCancelButton,
    dispatch,
    handleClose,
    onCancel,
  ])

  return (
    <BottomSheetModal
      hideHandlebar
      backgroundColor="$transparent"
      name={ModalName.TransactionActions}
      onClose={handleClose}
      {...(isWeb && { alignment: 'top' })}
    >
      <Flex px="$spacing12">
        <ActionSheetModalContent
          header={
            <Text color="$neutral3" p="$spacing16" variant="body2">
              {t('transaction.date', { date: dateString })}
            </Text>
          }
          options={options}
          onClose={handleClose}
        />
      </Flex>
    </BottomSheetModal>
  )
}

export async function openSupportLink(transactionDetails: TransactionDetails): Promise<void> {
  const params = new URLSearchParams()
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.FiatPurchase:
      return openLegacyFiatOnRampServiceProviderLink(transactionDetails.typeInfo.serviceProvider ?? 'MOONPAY')
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return openOnRampSupportLink(transactionDetails.typeInfo.serviceProvider)
    default:
      params.append('tf_11041337007757', transactionDetails.ownerAddress ?? '') // Wallet Address
      params.append('tf_7005922218125', isWeb ? 'uniswap_extension_issue' : 'uw_ios_app') // Report Type Dropdown
      params.append('tf_13686083567501', 'uw_transaction_details_page_submission') // Issue type Dropdown
      params.append('tf_9807731675917', transactionDetails.hash ?? 'N/A') // Transaction id
      return openUri(uniswapUrls.helpRequestUrl + '?' + params.toString()).catch((e) =>
        logger.error(e, { tags: { file: 'TransactionActionsModal', function: 'getHelpLink' } }),
      )
  }
}

export function getTransactionId(transactionDetails: TransactionDetails): string | undefined {
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.FiatPurchase:
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return transactionDetails.typeInfo.id
    default:
      return transactionDetails.hash
  }
}
