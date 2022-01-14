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
      dimBackground={true}
      hide={onCancel}
      visible={!!address}
      width={dimensions.fullWidth * 0.85}>
      <Identicon address={address || NULL_ADDRESS} size={50} />
      <Text mt="md" textAlign="center" variant="bodyLg">
        {t('Remove this account?')}
      </Text>
      <Text mt="md" textAlign="center" variant="bodyXs">
        {address}
      </Text>
      <CenterBox mt="md">
        <PrimaryButton label={t('Remove')} variant="paleOrange" width={150} onPress={onConfirm} />
        <TextButton mt="md" textVariant="body" onPress={onCancel}>
          {t('Cancel')}
        </TextButton>
      </CenterBox>
    </Modal>
  )
}
