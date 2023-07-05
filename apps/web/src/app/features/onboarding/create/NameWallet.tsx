import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingInput } from 'src/app/features/onboarding/OnboardingInput'
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

    if (!walletName) {
      setWalletNamingErrorString('Please enter a name for your wallet')
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
    <OnboardingScreen
      Icon={<UniconWithLockIcon address={pendingAddress ?? ''} />}
      inputError={walletNamingErrorString}
      nextButtonEnabled={walletName !== ''}
      nextButtonText="Finish"
      subtitle="This nickname is only visible to you"
      title="Give your wallet a name"
      onSubmit={onSubmit}>
      <OnboardingInput
        placeholderText="Wallet 1"
        onChangeText={setWalletName}
        onSubmit={onSubmit}
      />
    </OnboardingScreen>
  )
}
