import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { TextInput } from 'src/components/input/TextInput'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Unicon } from 'src/components/unicons/Unicon'
import {
  EditAccountAction,
  editAccountActions,
  editAccountSagaName,
} from 'src/features/wallet/editAccountSaga'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'
import { ElementName, SectionName } from '../telemetry/constants'
import { Trace } from '../telemetry/Trace'

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
    <Trace section={SectionName.NameAccountForm}>
      <CenterBox mt="md">
        <Unicon address={address} size={50} />
        <TextInput
          fontSize={20}
          mt="lg"
          placeholder={t('New account name')}
          testID="import_account_form/input"
          value={newAccountName}
          onChangeText={setNewAccountName}
        />
        <PrimaryButton
          disabled={isLoading}
          label={t('Done')}
          mt="lg"
          name={ElementName.Submit}
          testID={ElementName.Submit}
          width="100%"
          onPress={onPressDone}
        />
        <TextButton mt="lg" textColor="accentAction" textVariant="bodyLarge" onPress={onSuccess}>
          {t('Skip')}
        </TextButton>
      </CenterBox>
    </Trace>
  )
}
