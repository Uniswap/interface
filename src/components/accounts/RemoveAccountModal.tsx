import React from 'react'
import { useTranslation } from 'react-i18next'
import { Identicon } from 'src/components/accounts/Identicon'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { NULL_ADDRESS } from 'src/constants/accounts'
import { dimensions } from 'src/styles/sizing'

interface RemoveAccountModalProps {
  address: Address | null
  onCancel: () => void
  onConfirm: () => void
}

export function RemoveAccountModal({ address, onCancel, onConfirm }: RemoveAccountModalProps) {
  const { t } = useTranslation()
  return (
    <Modal
      visible={!!address}
      width={dimensions.fullWidth * 0.85}
      dimBackground={true}
      hide={onCancel}>
      <Identicon address={address || NULL_ADDRESS} size={50} />
      <Text variant="bodyLg" textAlign="center" mt="md">
        {t('Remove this account?')}
      </Text>
      <Text variant="bodyXs" textAlign="center" mt="md">
        {address}
      </Text>
      <CenterBox mt="md">
        <PrimaryButton variant="paleOrange" label={t('Remove')} onPress={onConfirm} width={150} />
        <TextButton onPress={onCancel} textVariant="body" mt="md">
          {t('Cancel')}
        </TextButton>
      </CenterBox>
    </Modal>
  )
}
