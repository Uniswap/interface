import { Dialog } from 'components/Dialog/Dialog'
import { UserIcon } from 'components/Icons/UserIcon'
import Identicon, { IdenticonType, useIdenticonType } from 'components/Identicon'
import { SendModalProps } from 'pages/Swap/Send/SendReviewModal'
import { useTranslation } from 'react-i18next'
import { useSendContext } from 'state/send/SendContext'
import type { RecipientData } from 'state/send/hooks'
import { Flex, Text, useSporeColors } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'

const RecipientDisplay = ({
  recipientData,
  identiconType,
}: {
  recipientData?: RecipientData
  identiconType?: IdenticonType
}) => {
  const ensOrUnitag = recipientData?.ensName ?? recipientData?.unitag

  if (ensOrUnitag) {
    return (
      <Flex centered gap="$gap4">
        <Flex row centered gap="$gap4">
          {(identiconType === IdenticonType.ENS_AVATAR || identiconType === IdenticonType.UNITAG_PROFILE_PICTURE) && (
            <Identicon data-testid="speedbump-identicon" size={16} account={recipientData?.address ?? ''} />
          )}
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
  const identiconType = useIdenticonType(recipientData?.address)

  return (
    <Dialog
      isVisible={isOpen}
      icon={<UserIcon fill={colors.neutral2.val} width={28} height={28} />}
      title={t('speedBump.newAddress.warning.title')}
      description={t('speedBump.newAddress.warning.description')}
      body={
        <Flex
          centered
          borderWidth="$spacing1"
          borderColor="$surface3"
          borderRadius="$rounded20"
          py="$padding20"
          width="100%"
        >
          <RecipientDisplay recipientData={recipientData} identiconType={identiconType} />
        </Flex>
      }
      onCancel={onDismiss}
      buttonsConfig={{
        left: {
          title: t('common.button.cancel'),
          onClick: onDismiss,
        },
        right: {
          title: t('common.button.continue'),
          onClick: onConfirm,
        },
      }}
    />
  )
}
