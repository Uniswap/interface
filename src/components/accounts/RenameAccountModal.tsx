import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Identicon } from 'src/components/accounts/Identicon'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Modal } from 'src/components/modals/Modal'
import { NULL_ADDRESS } from 'src/constants/accounts'
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
      visible={!!address}
      width={dimensions.fullWidth * 0.85}
      dimBackground={true}
      hide={onPressCancel}>
      <Identicon address={address || NULL_ADDRESS} size={50} />
      <TextInput
        value={newAccountName}
        onChangeText={setNewAccountName}
        mt="md"
        placeholder={t('New account name')}
        fontSize={20}
      />
      <CenterBox mt="md">
        {/* TODO use pill button */}
        <TextButton onPress={onPressConfirm} textVariant="body">
          {t('Done')}
        </TextButton>
        <TextButton onPress={onPressCancel} textVariant="body" textColor="blue" mt="lg">
          {t('Cancel')}
        </TextButton>
      </CenterBox>
    </Modal>
  )
}
