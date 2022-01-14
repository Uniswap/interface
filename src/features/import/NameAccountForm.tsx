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
        fontSize={20}
        mt="lg"
        placeholder={t('New account name')}
        value={newAccountName}
        onChangeText={setNewAccountName}
      />
      <PrimaryButton
        disabled={isLoading}
        label={t('Done')}
        mt="lg"
        width="100%"
        onPress={onPressDone}
      />
      <TextButton mt="lg" textColor="pink" textVariant="body" onPress={onSuccess}>
        {t('Skip')}
      </TextButton>
    </CenterBox>
  )
}
