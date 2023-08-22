import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { Input } from 'src/app/components/Input'
import { ScreenHeader } from 'src/app/components/layout/SreenHeader'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { useAppDispatch } from 'src/background/store'
import { Button, Text, YStack } from 'ui/src'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

export function SettingsWalletEditNicknameScreen(): JSX.Element {
  const { address } = useParams()
  if (!address) throw new Error('Address not found in route params')

  return <EditNicknameScreenContent address={address} />
}

function EditNicknameScreenContent({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { navigateBack } = useExtensionNavigation()

  const nickname = useDisplayName(address)?.name

  const [nicknameField, setNicknameField] = useState<string>('')
  const [showNicknamePlaceholder, setShowNicknamePlaceholder] = useState(true)

  const handleNicknameUpdate = async (): Promise<void> => {
    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address,
        newName: nicknameField,
      })
    )
    navigateBack()
  }

  return (
    <YStack backgroundColor="$surface1" flexGrow={1} gap="$spacing12">
      <ScreenHeader title={t('Edit nickname')} />
      <YStack flex={1} justifyContent="space-between" padding="$spacing12">
        <YStack flex={1} gap="$spacing24">
          <Input
            centered
            large
            onBlur={(): void => setShowNicknamePlaceholder(true)}
            onChangeText={(value: string): void => setNicknameField(value)}
            onFocus={(): void => setShowNicknamePlaceholder(false)}
          />
          {showNicknamePlaceholder && nicknameField === '' ? (
            <Text
              left={0}
              paddingVertical={28}
              pointerEvents="box-none"
              position="absolute"
              right={0}
              textAlign="center"
              top={0}
              variant="subheadLarge">
              {nickname}
            </Text>
          ) : null}
          <Text color="$neutral3" textAlign="center" variant="bodySmall">
            {t('This nickname is only visible to you.')}
          </Text>
        </YStack>

        <Button theme="secondary" onPress={handleNicknameUpdate}>
          {t('Save')}
        </Button>
      </YStack>
    </YStack>
  )
}
