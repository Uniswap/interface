import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInputError } from 'src/app/features/onboarding/OnboardingInputError'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import { useAppDispatch } from 'src/background/store'
import { Input, Stack, Text, XStack, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { inputStyles } from 'ui/src/components/input/utils'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'

export function NameWallet({ nextPath }: { nextPath: string }): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [walletNamingErrorString, setWalletNamingErrorString] = useState<string | undefined>(
    undefined
  )
  const { walletName, setWalletName, pendingAddress } = useOnboardingContext()

  const onSubmit = (): void => {
    if (walletName !== '' && pendingAddress) {
      dispatch(
        editAccountActions.trigger({
          type: EditAccountAction.Rename,
          address: pendingAddress,
          newName: walletName,
        })
      )
      navigate(nextPath)
    } else {
      setWalletNamingErrorString('Please enter a name for this wallet')
    }
  }

  return (
    <Stack alignItems="center" gap="$spacing36" minWidth={ONBOARDING_CONTENT_WIDTH}>
      <YStack alignItems="center" gap="$spacing8">
        <UniconWithLockIcon address={pendingAddress ?? ''} />
        <Text variant="headlineMedium">Give your wallet a name</Text>
        <Text variant="subheadSmall">This nickname is only visible to you</Text>
      </YStack>
      <YStack alignItems="center" gap="$spacing8" width="100%">
        <Input
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderRadius="$rounded12"
          borderWidth={1}
          focusStyle={inputStyles.inputFocus}
          height="auto"
          hoverStyle={inputStyles.inputHover}
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          placeholder="Wallet 1"
          placeholderTextColor="$textTertiary"
          width="100%"
          onChange={(): void => {
            setWalletNamingErrorString(undefined)
          }}
          onChangeText={(text): void => {
            setWalletName(text)
          }}
          onSubmitEditing={onSubmit}
        />
        {walletNamingErrorString && <OnboardingInputError error={walletNamingErrorString} />}
      </YStack>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button flexGrow={1} theme="primary" onPress={onSubmit}>
          Next
        </Button>
      </XStack>
    </Stack>
  )
}
