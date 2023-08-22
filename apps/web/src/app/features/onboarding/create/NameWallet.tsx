import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from 'src/app/components/Input'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import { useAppDispatch } from 'src/background/store'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { setAccountAsActive, setAccountsNonPending } from 'wallet/src/features/wallet/slice'

export function NameWallet({ previousPath }: { previousPath: string }): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

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

  const onSubmit = async (): Promise<void> => {
    if (!pendingAddress) {
      return
    }

    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address: pendingAddress,
        newName: walletName || defaultName,
      })
    )

    await dispatch(setAccountsNonPending([pendingAddress]))
    await dispatch(setAccountAsActive(pendingAddress))
  }

  return (
    <OnboardingScreen
      Icon={<UniconWithLockIcon address={pendingAddress ?? ''} />}
      nextButtonEnabled={walletName !== ''}
      nextButtonText="Finish"
      subtitle="This nickname is only visible to you"
      title="Give your wallet a name"
      onBack={(): void =>
        navigate(previousPath, {
          replace: true,
        })
      }
      onSubmit={onSubmit}>
      <Input
        large
        placeholder={defaultName}
        onChangeText={setWalletName}
        onSubmitEditing={onSubmit}
      />
    </OnboardingScreen>
  )
}
