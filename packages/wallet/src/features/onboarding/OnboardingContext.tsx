import { PropsWithChildren, createContext, useCallback, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagClaim } from 'uniswap/src/features/unitags/types'
import { ImportType } from 'uniswap/src/types/onboarding'
import { useAsyncData } from 'utilities/src/react/hooks'
import {
  setHasSkippedUnitagPrompt,
  setHasViewedUniconV2IntroModal,
} from 'wallet/src/features/behaviorHistory/slice'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { createImportedAccounts } from 'wallet/src/features/onboarding/createImportedAccounts'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import {
  Account,
  BackupType,
  SignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'
import { areAddressesEqual } from 'wallet/src/utils/addresses'

export interface OnboardingContext {
  generateOnboardingAccount: (password?: string) => Promise<void>
  generateImportedAccounts: (
    mnemonicId: string,
    backupType: BackupType.Cloud | BackupType.Manual
  ) => Promise<void>
  addBackupMethod: (backupMethod: BackupType) => void
  enableNotifications: () => void
  selectImportedAccounts: (accountAddresses: string[]) => void
  finishOnboarding: (importType: ImportType) => Promise<void>
  getAllOnboardingAccounts: () => SignerMnemonicAccount[]
  getOnboardingAccount: () => SignerMnemonicAccount | undefined
  getOnboardingAccountAddress: () => string | undefined
  getImportedAccounts: () => SignerMnemonicAccount[] | undefined
  getImportedAccountsAddresses: () => string[] | undefined
  getUnitagClaim: () => UnitagClaim | undefined
  addUnitagClaim: (unitag: UnitagClaim) => void
}

const initialOnboardingContext: OnboardingContext = {
  generateOnboardingAccount: async () => undefined,
  generateImportedAccounts: async () => undefined,
  addBackupMethod: () => undefined,
  enableNotifications: () => undefined,
  selectImportedAccounts: () => undefined,
  finishOnboarding: async (_importType: ImportType) => undefined,
  getAllOnboardingAccounts: () => [],
  getOnboardingAccount: () => undefined,
  getOnboardingAccountAddress: () => undefined,
  getImportedAccounts: () => undefined,
  getImportedAccountsAddresses: () => undefined,
  getUnitagClaim: () => undefined,
  addUnitagClaim: () => undefined,
}

const OnboardingContext = createContext<OnboardingContext>(initialOnboardingContext)

/**
 * Context responsible for persisting and modifying pending accounts during onboarding flow.
 * It's used for both creating  new accounts and importing existing accounts using mnemonics
 * or cloud. It is also reponsible for finalizing onboarding flow by adding active accounts
 * to redux store.
 */
export function OnboardingContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const claimUnitag = useClaimUnitag()
  const sortedMnemonicAccounts = useAppSelector(selectSortedSignerMnemonicAccounts)
  const [onboardingAccount, setOnboardingAccount] = useState<SignerMnemonicAccount | undefined>()
  const [unitagClaim, setUnitagClaim] = useState<UnitagClaim | undefined>()
  const [importedAccounts, setImportedAccounts] = useState<SignerMnemonicAccount[] | undefined>()
  const uniconsV2Enabled = useFeatureFlag(FeatureFlags.UniconsV2)

  /**
   * Creates a new pending account and stores it within the context.
   * Used for creating a new wallet and an additional wallet flows.
   * @param password secures generated mnemonic with password
   */
  const generateOnboardingAccount = async (password?: string): Promise<void> => {
    setOnboardingAccount(await createOnboardingAccount(sortedMnemonicAccounts, password))
  }

  const getOnboardingAccount = (): SignerMnemonicAccount | undefined => {
    return onboardingAccount
  }

  const getOnboardingAccountAddress = (): string | undefined => {
    return onboardingAccount?.address
  }

  const getUnitagClaim = (): UnitagClaim | undefined => {
    return unitagClaim
  }

  const addUnitagClaim = (unitag: UnitagClaim): void => {
    setUnitagClaim(unitag)
  }

  /**
   * Generates a set (10) of wallets based on given mnemonicId. Used for importing
   * existing wallets from cloud or using mnemonics.
   * @param mnemonicId Required to generate a wallet address
   * @param backupType Predefines backup type for generated accounts
   */
  const generateImportedAccounts = async (
    mnemonicId: string,
    backupType?: BackupType.Cloud | BackupType.Manual
  ): Promise<void> => {
    setOnboardingAccount(undefined)
    setImportedAccounts(await createImportedAccounts(mnemonicId, backupType))
  }

  const getImportedAccounts = (): SignerMnemonicAccount[] | undefined => {
    return importedAccounts
  }

  /**
   * Returns an array of sorted account addresses if importedAccounts
   * is defined and not null. It returns undefined otherwise.
   */
  const getImportedAccountsAddresses = (): string[] | undefined => {
    return importedAccounts
      ?.sort(
        (a, b) =>
          (a as SignerMnemonicAccount).derivationIndex -
          (b as SignerMnemonicAccount).derivationIndex
      )
      .map((account: SignerMnemonicAccount) => account.address)
  }

  /**
   * Selects imported accounts from within the context and sets them as the.
   * selected imported accounts, overriding any previous selection.
   */
  const selectImportedAccounts = (accountAddresses: string[]): void => {
    if (!importedAccounts) {
      throw new Error('No imported accounts available for toggling selecting imported accounts')
    }
    const filteredImportedAccounts = importedAccounts.filter((importedAccount) =>
      accountAddresses.includes(importedAccount.address)
    )
    const namedImportedAccounts = filteredImportedAccounts.map((acc, index) => ({
      ...acc,
      name: t('onboarding.wallet.defaultName', { number: index + 1 }),
    }))
    setImportedAccounts(namedImportedAccounts)
  }

  /**
   * Adds given backupMethod to all pending accounts
   */
  const addBackupMethod = (backupMethod: BackupType): void => {
    if (onboardingAccount) {
      const { backups } = onboardingAccount
      const updatedBackups = backups ? [...new Set([...backups, backupMethod])] : [backupMethod]
      setImportedAccounts(undefined)
      setOnboardingAccount({ ...onboardingAccount, backups: updatedBackups })
    } else if (importedAccounts) {
      const updatedImportedAccounts = importedAccounts.map((acc) => {
        const { backups } = acc
        acc.backups = backups ? [...new Set([...backups, backupMethod])] : [backupMethod]
        return acc
      })
      setImportedAccounts(updatedImportedAccounts)
    } else {
      throw new Error('No account available for adding a backup method')
    }
  }

  /**
   * Enables push notifications for all pending accounts
   */
  const enableNotifications = (): void => {
    if (onboardingAccount) {
      setOnboardingAccount({ ...onboardingAccount, pushNotificationsEnabled: true })
    } else if (importedAccounts) {
      const updatedImportedAccounts = importedAccounts.map((acc) => {
        acc.pushNotificationsEnabled = true
        return acc
      })
      setImportedAccounts(updatedImportedAccounts)
    } else {
      throw new Error('No account available for toggling notifiations')
    }
  }

  /**
   * Returns an array of accounts imported accounts or an array with a single
   * pending account depending on flow it is invoked in.
   */
  const getAllOnboardingAccounts = (): SignerMnemonicAccount[] => {
    return [
      ...(importedAccounts && importedAccounts.length > 0 ? importedAccounts : []),
      ...(onboardingAccount ? [onboardingAccount] : []),
    ]
  }

  /**
   * Finalizes onboarding flow by adding pedning account or imported accounts
   * to redux store.
   */
  const finishOnboarding = async (importType: ImportType): Promise<void> => {
    const onboardingAccounts = getAllOnboardingAccounts()
    const onboardingAddresses = onboardingAccounts.map((a) => a.address)

    // Activate all pending accounts
    if (onboardingAccounts) {
      dispatch(
        createAccountsActions.trigger({
          accounts: onboardingAccounts,
          activateFirst: true,
        })
      )
    }

    // Enforces that a unitag claim is made with the correct address
    const isValidUnitagClaimState = areAddressesEqual(
      onboardingAccount?.address,
      unitagClaim?.address
    )

    // Claim unitag if there's a claim to process
    if (unitagClaim && isValidUnitagClaimState) {
      const { claimError } = await claimUnitag(
        unitagClaim,
        {
          source: 'onboarding',
          hasENSAddress: false,
        },
        onboardingAccount
      )

      if (claimError) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: claimError,
          })
        )
      }
    }

    // enables push notifications for mobile based on account settings
    onboardingAccounts.forEach((acc) => {
      if (acc?.pushNotificationsEnabled) {
        dispatch(
          editAccountActions.trigger({
            type: EditAccountAction.TogglePushNotification,
            enabled: true,
            address: acc.address,
          })
        )
      }
    })

    // Dismiss unitags prompt if the onboarding method prompts for unitags (create new)
    if (importType === ImportType.CreateNew) {
      dispatch(setHasSkippedUnitagPrompt(true))
    }

    if (uniconsV2Enabled) {
      // Don't show Unicon V2 intro modal to new users
      dispatch(setHasViewedUniconV2IntroModal(true))
    }

    // Send analytics events
    sendAnalyticsEvent(MobileEventName.OnboardingCompleted, {
      wallet_type: importType,
      accounts_imported_count: onboardingAddresses.length,
      wallets_imported: onboardingAddresses,
      cloud_backup_used: Object.values(onboardingAccounts).some((acc: Account) =>
        acc.backups?.includes(BackupType.Cloud)
      ),
    })
  }

  return (
    <OnboardingContext.Provider
      value={{
        getOnboardingAccount,
        getImportedAccounts,
        addBackupMethod,
        generateOnboardingAccount,
        generateImportedAccounts,
        enableNotifications,
        selectImportedAccounts,
        finishOnboarding,
        getAllOnboardingAccounts,
        getOnboardingAccountAddress,
        getImportedAccountsAddresses,
        getUnitagClaim,
        addUnitagClaim,
      }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboardingContext(): OnboardingContext {
  return useContext(OnboardingContext)
}

/**
 * Initiates pending account when there is no already existing one.
 * Extracted into hook for reusability.
 */
export function useCreateOnboardingAccountIfNone(): void {
  const { getOnboardingAccount, generateOnboardingAccount } = useOnboardingContext()
  const onboardingAccount = getOnboardingAccount()

  useAsyncData(
    useCallback(async () => {
      if (!onboardingAccount) {
        await generateOnboardingAccount()
      }
    }, [generateOnboardingAccount, onboardingAccount])
  )
}
