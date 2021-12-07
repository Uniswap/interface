import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Identicon } from 'src/components/accounts/Identicon'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
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
      <CenterBox mt="md">
        <Identicon address={address || NULL_ADDRESS} size={50} />
        <TextInput
          value={newAccountName}
          onChangeText={setNewAccountName}
          mt="md"
          placeholder={t('New account name')}
          fontSize={20}
        />
        <PrimaryButton
          variant="palePink"
          label={t('Done')}
          onPress={onPressConfirm}
          mt="md"
          width={150}
        />
        <TextButton onPress={onPressCancel} textVariant="body" textColor="pink" mt="lg">
          {t('Cancel')}
        </TextButton>
      </CenterBox>
    </Modal>
  )
}
