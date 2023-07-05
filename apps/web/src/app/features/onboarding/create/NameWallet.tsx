import { useMemo, useState } from 'react'
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
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive, setAccountsNonPending } from 'wallet/src/features/wallet/slice'

export function NameWallet({ nextPath }: { nextPath: string }): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const [walletNamingErrorString, setWalletNamingErrorString] = useState<string | undefined>(
    undefined
  )
  const { walletName, setWalletName, pendingAddress } = useOnboardingContext()

  // Reference pending accounts to avoid any lag in saga import.
  const pendingAccount = Object.values(usePendingAccounts())?.[0]

  const defaultName: string = useMemo(() => {
    if (!pendingAccount || pendingAccount.type === AccountType.Readonly) {
      return ''
    }

    const derivationIndex = pendingAccount.derivationIndex
    return pendingAccount.name || `Wallet ${derivationIndex + 1}`
  }, [pendingAccount])

  const onSubmit = (): void => {
    if (!pendingAddress) {
      return
    }

    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address: pendingAddress,
        newName: walletName || defaultName,
      })
    )
    dispatch(setAccountsNonPending([pendingAddress]))
    // webext-redux's dispatch returns a promise. We don't currently
    // type dispatch: () => Promise, so we wrap in `resolve` here.
    Promise.resolve(dispatch(setAccountAsActive(pendingAddress))).then(() => {
      navigate(nextPath)
    })
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
          value={walletName || defaultName}
          width="100%"
          onChange={(): void => {
            setWalletNamingErrorString(undefined)
          }}
          onChangeText={setWalletName}
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
