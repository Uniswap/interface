import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ColorTokens, Flex, Separator, Text, isWeb } from 'ui/src'
import { ActionSheetModalContent, MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORMAT_DATE_LONG, useFormattedDate } from 'uniswap/src/features/language/localizedDayjs'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { openFORSupportLink } from 'wallet/src/utils/linking'

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
  showCancelButton,
  transactionDetails,
}: TransactionActionModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const dateString = useFormattedDate(dayjs(msTimestampAdded), FORMAT_DATE_LONG)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const options = useMemo(() => {
    const transactionId = getTransactionId(transactionDetails)

    const onRampProviderName =
      transactionDetails.typeInfo.type === TransactionType.OnRampPurchase ||
      transactionDetails.typeInfo.type === TransactionType.OnRampTransfer ||
      transactionDetails.typeInfo.type === TransactionType.OffRampSale
        ? transactionDetails.typeInfo.serviceProvider?.name
        : undefined

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
            render: onRampProviderName
              ? renderOptionItem(
                  t('transaction.action.copyProvider', {
                    providerName: onRampProviderName,
                  }),
                )
              : renderOptionItem(t('transaction.action.copy')),
          },
        ]
      : []

    const transactionActionOptions: MenuItemProp[] = [
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
  }, [transactionDetails, t, showCancelButton, dispatch, handleClose, onCancel])

  return (
    <Modal
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
    </Modal>
  )
}

export async function openSupportLink(transactionDetails: TransactionDetails): Promise<void> {
  const params = new URLSearchParams()
  switch (transactionDetails.typeInfo.type) {
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
    case TransactionType.OffRampSale:
      return openFORSupportLink(transactionDetails.typeInfo.serviceProvider)
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
    case TransactionType.OnRampPurchase:
    case TransactionType.OnRampTransfer:
      return transactionDetails.typeInfo.id
    case TransactionType.OffRampSale:
      return transactionDetails.typeInfo.providerTransactionId
    default:
      return transactionDetails.hash
  }
}
