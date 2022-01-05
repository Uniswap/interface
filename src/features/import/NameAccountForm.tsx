import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { Identicon } from 'src/components/accounts/Identicon'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import {
  EditAccountAction,
  editAccountActions,
  editAccountSagaName,
} from 'src/features/wallet/editAccountSaga'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

interface Props {
  address: Address
  onSuccess: () => void
}

export function NameAccountForm({ address, onSuccess }: Props) {
  const [newAccountName, setNewAccountName] = useState('')

  const dispatch = useAppDispatch()

  const onPressDone = () => {
    if (newAccountName) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address,
          newName: newAccountName,
        })
      )
    }
    onSuccess()
  }

  const { status } = useSagaStatus(editAccountSagaName, onSuccess)
  const isLoading = status === SagaStatus.Started

  const { t } = useTranslation()
  return (
    <CenterBox mt="md">
      <Identicon address={address} size={50} />
      <TextInput
        value={newAccountName}
        onChangeText={setNewAccountName}
        mt="lg"
        placeholder={t('New account name')}
        fontSize={20}
      />
      <PrimaryButton
        label={t('Done')}
        onPress={onPressDone}
        disabled={isLoading}
        mt="lg"
        width="100%"
      />
      <TextButton onPress={onSuccess} textVariant="body" textColor="pink" mt="lg">
        {t('Skip')}
      </TextButton>
    </CenterBox>
  )
}
