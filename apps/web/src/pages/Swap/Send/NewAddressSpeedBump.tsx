import { UserIcon } from 'components/Icons/UserIcon'
import { SendModalProps } from 'pages/Swap/Send/SendReviewModal'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecipientData } from 'state/send/hooks'
import { useSendContext } from 'state/send/SendContext'
import { Flex, Text, useSporeColors } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
          {recipientData?.unitag && <Unitag size={18} />}
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
  const colors = useSporeColors()
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
      icon={<UserIcon fill={colors.neutral2.val} width={28} height={28} />}
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
