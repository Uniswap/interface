import dayjs from 'dayjs'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModalContent, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { TransactionDetails } from 'src/features/transactions/types'
import { Theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'
import { openUri } from 'src/utils/linking'

function renderOptionItem(label: string, textColorOverride?: keyof Theme['colors']) {
  return () => (
    <>
      <Separator />
      <Text
        color={textColorOverride ?? 'textPrimary'}
        p="md"
        textAlign="center"
        variant="bodyLarge">
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
  onCancel: () => void
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
  onCancel,
  msTimestampAdded,
  showCancelButton,
}: TransactionActionModalProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const dateString = dayjs(msTimestampAdded).format('MMMM D, YYYY')

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

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
          openUri(uniswapUrls.helpUrl, true)
          handleClose()
        },
        render: renderOptionItem(t('Get help')),
      },
    ]
    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: onCancel,
        render: renderOptionItem(t('Cancel transaction'), 'accentCritical'),
      })
    }
    return transactionActionOptions
  }, [onExplore, t, showCancelButton, hash, dispatch, handleClose, onCancel])

  return (
    <BottomSheetModal
      backgroundColor="accentCritical"
      hideHandlebar={true}
      isVisible={isVisible}
      name={ModalName.TransactionActions}
      onClose={handleClose}>
      <Flex pb="lg" px="sm">
        <ActionSheetModalContent
          header={
            <Text color="textTertiary" p="md" variant="bodySmall">
              {t('Submitted on') + ' ' + dateString}
            </Text>
          }
          options={options}
          onClose={handleClose}
        />
      </Flex>
    </BottomSheetModal>
  )
}
