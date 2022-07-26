import dayjs from 'dayjs'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModalContent, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { cancelTransaction } from 'src/features/transactions/slice'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import { TransactionDetails } from 'src/features/transactions/types'
import { Theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'
import { openUri } from 'src/utils/linking'

function renderOptionItem(label: string, textColorOverride?: keyof Theme['colors']) {
  return () => (
    <>
      <Separator />
      <Text color={textColorOverride ?? 'textPrimary'} p="md" textAlign="center" variant="body">
        {label}
      </Text>
    </>
  )
}

interface TransactionActionModalProps {
  hash: string
  isVisible: boolean
  onExplore: () => void
  onClose: () => void
  msTimestampAdded: number
  showCancelButton?: boolean
  transactionDetails?: TransactionDetails
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  hash,
  isVisible,
  onExplore,
  onClose,
  msTimestampAdded,
  showCancelButton,
  transactionDetails,
}: TransactionActionModalProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [showConfirmView, setShowConfirmView] = useState(false)

  const dateString = dayjs(msTimestampAdded).format('MMM DD, YYYY')

  const handleClose = useCallback(() => {
    setShowConfirmView(false)
    onClose()
  }, [onClose])

  function handleCancel() {
    if (transactionDetails) {
      dispatch(
        cancelTransaction({
          chainId: transactionDetails.chainId,
          id: transactionDetails.id,
          address: transactionDetails.from,
        })
      )
      onClose()
    }
  }

  const options = useMemo(() => {
    const transactionActionOptions: MenuItemProp[] = [
      {
        key: ElementName.EtherscanView,
        onPress: onExplore,
        render: renderOptionItem(t('View on Etherscan')),
      },
      {
        key: ElementName.Copy,
        onPress: () => {
          setClipboard(hash)
          dispatch(pushNotification({ type: AppNotificationType.Copied }))
          handleClose()
        },
        render: renderOptionItem(t('Copy transaction ID')),
      },
      {
        key: ElementName.GetHelp,
        onPress: () => {
          openUri(
            `mailto:support@uniswap.org?subject=Help with Uniswap Wallet transaction&body=Transaction ID: ${hash}\n\nPlease tell us how we can help you with this transaction:`
          )
          handleClose()
        },
        render: renderOptionItem(t('Get help')),
      },
    ]
    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: () => setShowConfirmView(true),
        render: renderOptionItem(t('Cancel transaction'), 'accentFailure'),
      })
    }
    return transactionActionOptions
  }, [onExplore, t, showCancelButton, handleClose, dispatch, hash])

  return (
    <BottomSheetDetachedModal
      backgroundColor="transparent"
      hideHandlebar={!showConfirmView}
      isVisible={isVisible}
      name={ModalName.TransactionActions}
      onClose={handleClose}>
      {showConfirmView && transactionDetails ? (
        <CancelConfirmationView
          transactionDetails={transactionDetails}
          onBack={() => setShowConfirmView(false)}
          onCancel={handleCancel}
        />
      ) : (
        <ActionSheetModalContent
          header={
            <Text color="textTertiary" p="md" variant="bodySmall">
              {t('Submitted on') + ' ' + dateString}
            </Text>
          }
          options={options}
          onClose={handleClose}
        />
      )}
    </BottomSheetDetachedModal>
  )
}
