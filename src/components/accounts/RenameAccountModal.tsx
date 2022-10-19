import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Modal } from 'src/components/modals/Modal'
import { Unicon } from 'src/components/unicons/Unicon'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { dimensions } from 'src/styles/sizing'

interface RenameAccountModalProps {
  address: Address | null
  onCancel: () => void
  onConfirm: (newName: string) => void
}

export function RenameAccountModal({ address, onCancel, onConfirm }: RenameAccountModalProps) {
  const [newAccountName, setNewAccountName] = useState('')

  const onPressCancel = () => {
    onCancel()
    setNewAccountName('')
  }

  const onPressConfirm = () => {
    onConfirm(newAccountName)
    setNewAccountName('')
  }

  const { t } = useTranslation()
  return (
    <Modal
      dimBackground={true}
      hide={onPressCancel}
      visible={!!address}
      width={dimensions.fullWidth * 0.85}>
      <CenterBox mt="md">
        <Unicon address={address || NATIVE_ADDRESS} size={50} />
        <TextInput
          fontSize={20}
          mt="md"
          placeholder={t('New account name')}
          value={newAccountName}
          onChangeText={setNewAccountName}
        />
        <PrimaryButton
          label={t('Done')}
          mt="md"
          variant="palePink"
          width={150}
          onPress={onPressConfirm}
        />
        <TextButton mt="lg" textColor="white" textVariant="bodyLarge" onPress={onPressCancel}>
          {t('Cancel')}
        </TextButton>
      </CenterBox>
    </Modal>
  )
}
