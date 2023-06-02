import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Input, Text, YStack, ZStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SettingsWalletEditNicknameScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack } = useExtensionNavigation()
  const activeAccount = useActiveAccountWithThrow() // TODO: pass in address through navigation since this doesn't have to be active account at all times
  const ensName = 'thomasthachil.eth' // TODO: Add ENS lookup logic
  const nickname = ensName || activeAccount.name

  const [nicknameField, setNicknameField] = useState<string>('')
  const [showNicknamePlaceholder, setShowNicknamePlaceholder] = useState(true)

  const handleNicknameUpdate = (): void => {
    // TODO: Dispatch update nickname action
    navigateBack()
  }

  return (
    <YStack backgroundColor="$background0" flexGrow={1} padding="$spacing12">
      <BackButtonHeader headerText={t('Edit nickname')} />
      <YStack flexGrow={1} justifyContent="space-between" padding="$spacing12">
        <YStack gap="$spacing24" justifyContent="center">
          <ZStack>
            <Input
              backgroundColor="$background1"
              borderRadius="$rounded20"
              fontSize={20}
              fontWeight="400"
              justifyContent="center"
              minHeight={80}
              textAlign="center"
              onBlur={(): void => setShowNicknamePlaceholder(true)}
              onChangeText={(value: string): void => setNicknameField(value)}
              onFocus={(): void => setShowNicknamePlaceholder(false)}
            />
            {showNicknamePlaceholder && nicknameField === '' ? (
              <Text
                minHeight={80}
                paddingVertical={28}
                pointerEvents="box-none"
                textAlign="center"
                variant="subheadLarge">
                {nickname}
              </Text>
            ) : null}
          </ZStack>
          <Text textAlign="center" variant="bodySmall">
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
