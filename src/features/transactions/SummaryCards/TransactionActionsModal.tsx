import { ComponentProps, default as React, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Separator } from 'src/components/layout/Separator'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'

const spacerProps: ComponentProps<typeof Box> = {
  borderBottomColor: 'backgroundOutline',
  borderBottomWidth: 1,
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  isVisible,
  onExplore,
  onClose,
  showCancelButton = false,
}: {
  isVisible: boolean
  onExplore: () => void
  onClose: () => void
  showCancelButton?: boolean
  showRetryButton?: boolean
}) {
  const theme = useAppTheme()
  const [showConfirmView, setShowConfirmView] = useState(false)

  return (
    <BottomSheetModal
      backgroundColor="transparent"
      isVisible={isVisible}
      name={ModalName.TransactionActions}
      onClose={onClose}>
      {showConfirmView ? (
        <CancelConfirmationView />
      ) : (
        <Flex centered p="sm" pb="xl">
          <Flex centered gap="none" spacerProps={spacerProps} width="100%">
            <PrimaryButton
              borderBottomLeftRadius="none"
              borderBottomRightRadius="none"
              label="View on Etherscan"
              py="md"
              style={{ backgroundColor: theme.colors.backgroundSurface }}
              width="100%"
              onPress={onExplore}
            />
            {showCancelButton && (
              <PrimaryButton
                borderTopLeftRadius="none"
                borderTopRightRadius="none"
                label="Cancel transaction"
                py="md"
                style={{ backgroundColor: theme.colors.backgroundSurface }}
                textColor="accentFailure"
                width="100%"
                onPress={() => setShowConfirmView(true)}
              />
            )}
          </Flex>
          <PrimaryButton
            borderRadius="md"
            label="Cancel"
            py="md"
            style={{ backgroundColor: theme.colors.backgroundAction }}
            width="100%"
            onPress={onClose}
          />
        </Flex>
      )}
    </BottomSheetModal>
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
