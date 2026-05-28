import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, GeneratedIcon, Separator, Text, isWeb } from 'ui/src'
import { ActionSheetModalContent, MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { FORMAT_DATE_LONG, useFormattedDate } from 'uniswap/src/features/language/localizedDayjs'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'

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

export interface TransactionActionItem {
  key: string
  label: string
  icon: GeneratedIcon
  onPress: () => Promise<void> | void
}

interface TransactionActionModalProps {
  onClose: () => void
  onCancel: () => void
  msTimestampAdded: number
  showCancelButton?: boolean
  menuItems: TransactionActionItem[]
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  msTimestampAdded,
  onCancel,
  onClose,
  showCancelButton,
  menuItems,
}: TransactionActionModalProps): JSX.Element {
  const { t } = useTranslation()

  const dateString = useFormattedDate(dayjs(msTimestampAdded), FORMAT_DATE_LONG)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const options = useMemo(() => {
    const transactionActionOptions: MenuItemProp[] = menuItems.map((item) => ({
      key: item.label,
      onPress: async (): Promise<void> => {
        await item.onPress()
        handleClose()
      },
      render: renderOptionItem(item.label),
    }))

    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: onCancel,
        render: renderOptionItem(t('transaction.action.cancel.button'), '$statusCritical'),
      })
    }

    return transactionActionOptions
  }, [menuItems, showCancelButton, onCancel, t, handleClose])

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
