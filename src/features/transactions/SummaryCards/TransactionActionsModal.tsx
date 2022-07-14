import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout/Flex'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { TransactionDetails } from 'src/features/transactions/types'

function renderOptionItem(label: string) {
  return () => (
    <>
      <Separator />
      <Text p="md" textAlign="center" variant="body">
        {label}
      </Text>
    </>
  )
}

interface TransactionActionModalProps {
  isVisible: boolean
  onExplore: () => void
  onClose: () => void
  showCancelButton?: boolean
  showRetryButton?: boolean
  transactionDetails?: TransactionDetails
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  isVisible,
  onExplore,
  onClose,
  showCancelButton,
}: TransactionActionModalProps) {
  const { t } = useTranslation()
  const [showConfirmView, setShowConfirmView] = useState(false)

  function handleClose() {
    setShowConfirmView(false)
    onClose()
  }

  const options = useMemo(() => {
    const transactionActionOptions = [
      {
        key: ElementName.EtherscanView,
        onPress: onExplore,
        render: renderOptionItem(t('View on Etherscan')),
      },
      {
        key: ElementName.Copy,
        onPress: () => {},
        render: renderOptionItem(t('Copy transaction ID')),
      },
      {
        key: ElementName.GetHelp,
        onPress: () => {},
        render: renderOptionItem(t('Get help')),
      },
    ]

    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: () => setShowConfirmView(true),
        render: renderOptionItem(t('Cancel transaction')),
      })
    }

    return transactionActionOptions
  }, [onExplore, t, showCancelButton])

  return showConfirmView ? (
    <BottomSheetModal isVisible={isVisible} name={ModalName.TransactionActions}>
      <CancelConfirmationView />
    </BottomSheetModal>
  ) : (
    <ActionSheetModal
      header={
        <Text color="textTertiary" p="md" variant="bodySmall">
          {t('Submitted on July 12, 2022')}
        </Text>
      }
      isVisible={isVisible}
      name={ModalName.TransactionActions}
      options={options}
      onClose={handleClose}
    />
  )
}

function CancelConfirmationView() {
  const { t } = useTranslation()

  return (
    <Flex centered flexGrow={1}>
      <Flex centered borderColor="textSecondary" borderRadius="lg" padding="sm">
        {/* //icon */}
      </Flex>
      <Text variant="mediumLabel">{t('Cancel this transaction?')}</Text>
      <Text color="textSecondary" variant="smallLabel">
        {t(
          'If you cancel this transaction before it’s processed by the network, you’ll pay a new network fee instead of the the original one.'
        )}
      </Text>
      <Flex centered bg="translucentBackground" borderRadius="xl" flexGrow={1} padding="md">
        <Flex row justifyContent="space-between">
          <Text variant="mediumLabel">{t('Network fee')}</Text>
        </Flex>
        <Separator />
        <Flex row justifyContent="space-between">
          <Text variant="mediumLabel">{t('Network fee')}</Text>
        </Flex>
      </Flex>
      <Flex row flexGrow={1}>
        <PrimaryButton label="Back" variant="transparent" />
        <PrimaryButton label="Confirm" />
      </Flex>
    </Flex>
  )
}
