import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Person } from 'ui/src/components/icons/Person'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { RecipientData } from '~/features/Swap/state/send/hooks'
import { useSendContext } from '~/features/Swap/state/send/SendContext'
import { SendModalProps } from '~/pages/Swap/Send/SendReviewModal'

const RecipientDisplay = ({ recipientData }: { recipientData?: RecipientData }) => {
  const ensOrUnitag = recipientData?.unitag ?? recipientData?.ensName

  if (ensOrUnitag) {
    return (
      <Flex centered gap="$gap4">
        <Flex row centered gap="$gap4">
          <AccountIcon
            data-testid="speedbump-account-icon"
            size={16}
            address={recipientData?.address}
            marginRight="$spacing2"
          />
          <Text variant="body2">{ensOrUnitag}</Text>
          {recipientData?.unitag && (
            <Flex pt="$spacing2">
              <Unitag size={18} />
            </Flex>
          )}
        </Flex>
        <Text color="$neutral2" variant="body4">
          {recipientData?.address}
        </Text>
      </Flex>
    )
  }

  return (
    <Text variant="body3" $sm={{ variant: 'body4' }}>
      {recipientData?.address}
    </Text>
  )
}
export const NewAddressSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()
  const {
    derivedSendInfo: { recipientData },
  } = useSendContext()

  const primaryButton = useMemo(
    () => ({
      text: t('common.button.continue'),
      onPress: onConfirm,
      variant: 'default' as const,
      emphasis: 'primary' as const,
    }),
    [t, onConfirm],
  )

  const secondaryButton = useMemo(
    () => ({
      text: t('common.button.close'),
      onPress: onDismiss,
      variant: 'default' as const,
      emphasis: 'secondary' as const,
    }),
    [t, onDismiss],
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onDismiss}
      icon={<Person color="$neutral2" size="$icon.28" />}
      iconBackgroundColor="$surface3"
      title={t('speedBump.newAddress.warning.title')}
      subtext={t('speedBump.newAddress.warning.description')}
      modalName={ModalName.NewAddressSpeedBump}
      primaryButton={primaryButton}
      secondaryButton={secondaryButton}
      displayHelpCTA
    >
      <RecipientDisplay recipientData={recipientData} />
    </Dialog>
  )
}
