/* eslint-disable max-lines */
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagClaim } from 'uniswap/src/features/unitags/types'
import { ImportType } from 'uniswap/src/types/onboarding'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { isExtension } from 'utilities/src/platform'
import { setHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/slice'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { createImportedAccounts } from 'wallet/src/features/onboarding/createImportedAccounts'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account, BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { useAppSelector } from 'wallet/src/state'

export interface OnboardingContext {
  generateOnboardingAccount: (password?: string) => Promise<void>
  generateImportedAccounts: (mnemonicId: string, backupType: BackupType.Cloud | BackupType.Manual) => Promise<void>
  generateImportedAccountsByMnemonic: (
    validMnemonic: string,
    password?: string,
    backupType?: BackupType.Cloud | BackupType.Manual,
  ) => Promise<void>
  addBackupMethod: (backupMethod: BackupType) => void
  hasBackup: (address: string, backupType?: BackupType) => boolean | undefined
  enableNotifications: () => void
  selectImportedAccounts: (accountAddresses: string[]) => Promise<SignerMnemonicAccount[]>
  finishOnboarding: ({
    importType,
    accounts,
    extensionOnboardingFlow,
  }: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
  }) => Promise<void>
  getAllOnboardingAccounts: () => SignerMnemonicAccount[]
  getOnboardingAccount: () => SignerMnemonicAccount | undefined
  getOnboardingAccountAddress: () => string | undefined
  getImportedAccounts: () => SignerMnemonicAccount[] | undefined
  setRecoveredImportedAccounts: (accounts: SignerMnemonicAccount[]) => void
  getImportedAccountsAddresses: () => string[] | undefined
  getUnitagClaim: () => UnitagClaim | undefined
  addUnitagClaim: (unitag: UnitagClaim) => void
  addOnboardingAccountMnemonic: (mnemonic: string[]) => void
  getOnboardingAccountMnemonic: () => string[] | undefined
  getOnboardingAccountMnemonicString: () => string | undefined
  retrieveOnboardingAccountMnemonic: () => Promise<void>
  setPendingWalletName: (walletName: string) => void
  resetOnboardingContextData: () => void
}

const initialOnboardingContext: OnboardingContext = {
  generateOnboardingAccount: async () => undefined,
  generateImportedAccounts: async () => undefined,
  generateImportedAccountsByMnemonic: async () => undefined,
  addBackupMethod: () => undefined,
  hasBackup: () => undefined,
  enableNotifications: () => undefined,
  selectImportedAccounts: async () => [],
  finishOnboarding: async (_params: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
  }) => undefined,
  getAllOnboardingAccounts: () => [],
  getOnboardingAccount: () => undefined,
  getOnboardingAccountAddress: () => undefined,
  getImportedAccounts: () => undefined,
  setRecoveredImportedAccounts: (_accounts: SignerMnemonicAccount[]) => undefined,
  getImportedAccountsAddresses: () => undefined,
  getUnitagClaim: () => undefined,
  addUnitagClaim: () => undefined,
  addOnboardingAccountMnemonic: () => undefined,
  getOnboardingAccountMnemonic: () => undefined,
  getOnboardingAccountMnemonicString: () => undefined,
  retrieveOnboardingAccountMnemonic: async () => undefined,
  setPendingWalletName: () => undefined,
  resetOnboardingContextData: () => undefined,
}

const OnboardingContext = createContext<OnboardingContext>(initialOnboardingContext)

/**
 * Context responsible for persisting and modifying pending accounts during onboarding flow.
 * It's used for both creating  new accounts and importing existing accounts using mnemonics
 * or cloud. It is also reponsible for finalizing onboarding flow by adding active accounts
 * to redux store.
 */
export function OnboardingContextProvider({ children }: PropsWithChildren<unknown>): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const claimUnitag = useClaimUnitag()
  const sortedMnemonicAccounts = useAppSelector(selectSortedSignerMnemonicAccounts)

  const [onboardingAccount, setOnboardingAccount] = useState<SignerMnemonicAccount | undefined>()
  const [unitagClaim, setUnitagClaim] = useState<UnitagClaim | undefined>()
  const [importedAccounts, setImportedAccounts] = useState<SignerMnemonicAccount[] | undefined>()
  const [onboardingAccountMnemonic, setOnboardingAccountMnemonic] = useState<string[] | undefined>()

  const sortedImportedAccountAddresses = useMemo(
    () =>
      importedAccounts
        ?.sort((a, b) => (a as SignerMnemonicAccount).derivationIndex - (b as SignerMnemonicAccount).derivationIndex)
        .map((account: SignerMnemonicAccount) => account.address),
    [importedAccounts],
  )

  /**
   * Creates a new pending account and stores it within the context.
   * Used for creating a new wallet and an additional wallet flows.
   * @param password secures generated mnemonic with password
   */
  const generateOnboardingAccount = async (password?: string): Promise<void> => {
    if (isExtension) {
      // Clear any stale data from Keyring
      // Only used on web during onboarding
      // Mobile has different legacy conditions
      await Keyring.removeAllMnemonicsAndPrivateKeys()
    }
    resetOnboardingContextData()
    setOnboardingAccount(await createOnboardingAccount(sortedMnemonicAccounts, password))
  }

  const getOnboardingAccount = (): SignerMnemonicAccount | undefined => {
    return onboardingAccount
  }

  const getOnboardingAccountAddress = (): string | undefined => {
    return onboardingAccount?.address
  }

  const setPendingWalletName = (walletName: string): void => {
    if (!onboardingAccount) {
      throw new Error('No pending account available to perform renaming')
    }
    const account = onboardingAccount
    account.name = walletName
    setOnboardingAccount(account)
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
    backupType?: BackupType.Cloud | BackupType.Manual,
  ): Promise<void> => {
    setImportedAccounts(undefined)
    setOnboardingAccount(undefined)
    setImportedAccounts(await createImportedAccounts(mnemonicId, backupType))
  }

  const generateImportedAccountsByMnemonic = async (
    validMnemonic: string,
    password?: string,
    backupType?: BackupType.Cloud | BackupType.Manual,
  ): Promise<void> => {
    if (isExtension) {
      // Clear any stale data from Keyring
      // Only used on web during onboarding
      // Mobile has different legacy conditions
      await Keyring.removeAllMnemonicsAndPrivateKeys()
    }
    const mnemonicId = await Keyring.importMnemonic(validMnemonic, password, true)
    await generateImportedAccounts(mnemonicId, backupType)
  }

  const getImportedAccounts = (): SignerMnemonicAccount[] | undefined => {
    return importedAccounts
  }

  /**
   * Returns an array of sorted account addresses if importedAccounts
   * is defined and not null. It returns undefined otherwise.
   */
  const getImportedAccountsAddresses = (): string[] | undefined => {
    return sortedImportedAccountAddresses
  }

  /**
   * Selects imported accounts from within the context and sets them as the.
   * selected imported accounts, overriding any previous selection.
   */
  const selectImportedAccounts = async (accountAddresses: string[]): Promise<SignerMnemonicAccount[]> => {
    if (!importedAccounts) {
      throw new Error('No imported accounts available for toggling selecting imported accounts')
    }
    const filteredImportedAccounts = importedAccounts.filter((importedAccount) =>
      accountAddresses.includes(importedAccount.address),
    )
    const namedImportedAccounts = filteredImportedAccounts.map((acc, index) => ({
      ...acc,
      name: t('onboarding.wallet.defaultName', { number: index + 1 }),
    }))

    // Remove private keys form unselected accounts
    const unselectedAddresses = importedAccounts
      .map((acc) => acc.address)
      .filter((address) => !accountAddresses.includes(address))

    for (const address of unselectedAddresses) {
      await Keyring.removePrivateKey(address)
    }
    setImportedAccounts(namedImportedAccounts)
    return namedImportedAccounts
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
   * Checks if account of given address has a certain type of backup or any backup if a second
   * paramter is not provided
   */
  const hasBackup = (address: string, backupType?: BackupType): boolean | undefined => {
    return getAllOnboardingAccounts()
      .find((account) => account.address === address)
      ?.backups?.some((backup) =>
        backupType ? backup === backupType : backup === BackupType.Cloud || backup === BackupType.Manual,
      )
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
   * Finalizes onboarding flow by adding pending account or imported accounts
   * to redux store.
   * @param importType Type of onboarding flow
   * @param accounts optional list of accounts to import directly, only used for device recovery
   */
  const finishOnboarding = async ({
    importType,
    accounts,
    extensionOnboardingFlow,
  }: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
  }): Promise<void> => {
    const isWatchFlow = importType === ImportType.Watch
    const onboardingAccounts = isWatchFlow ? [] : accounts ?? getAllOnboardingAccounts()
    const onboardingAddresses = onboardingAccounts.map((a) => a.address)

    // Activate all pending accounts
    if (onboardingAccounts) {
      dispatch(
        createAccountsActions.trigger({
          accounts: onboardingAccounts,
        }),
      )
    }

    // Enforces that a unitag claim is made with the correct address
    const isValidUnitagClaimState = areAddressesEqual(onboardingAccount?.address, unitagClaim?.address)

    // Claim unitag if there's a claim to process
    if (unitagClaim && isValidUnitagClaimState && !isWatchFlow) {
      const { claimError } = await claimUnitag(
        unitagClaim,
        {
          source: 'onboarding',
          hasENSAddress: false,
        },
        onboardingAccount,
      )

      if (claimError) {
        dispatch(
          pushNotification({
            type: AppNotificationType.Error,
            errorMessage: claimError,
          }),
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
          }),
        )
      }
    })

    // Dismiss unitags prompt if the onboarding method prompts for unitags (create new)
    if (importType === ImportType.CreateNew) {
      dispatch(setHasSkippedUnitagPrompt(true))
    }

    const isExtensionNoAccounts = onboardingAddresses.length === 0 && isExtension
    if (!isExtensionNoAccounts) {
      // Send analytics events
      sendAnalyticsEvent(MobileEventName.OnboardingCompleted, {
        wallet_type: importType,
        flow: extensionOnboardingFlow,
        accounts_imported_count: onboardingAddresses.length,
        wallets_imported: onboardingAddresses,
        cloud_backup_used: Object.values(onboardingAccounts).some((acc: Account) =>
          acc.backups?.includes(BackupType.Cloud),
        ),
      })
    }

    // Reset data caused production ios app crashes and it is not necessary on mobile
    if (isExtension) {
      resetOnboardingContextData()
    }
  }

  /**
   * Retrieves pending account mnemonic from Keyring
   * Should only be used on web/extension
   */
  const retrieveOnboardingAccountMnemonic = async (): Promise<void> => {
    throwIfNotExtension()
    if (onboardingAccount) {
      const mnemonicString = await Keyring.retrieveMnemonicUnlocked(onboardingAccount?.address)
      setOnboardingAccountMnemonic(mnemonicString?.split(' '))
    }
  }

  /**
   * Returns previously retrieved mnemonics array
   * Should only be used on web/extension
   */
  const getOnboardingAccountMnemonic = (): string[] | undefined => {
    throwIfNotExtension()
    return onboardingAccountMnemonic
  }

  /**
   * Returns previously retrieved mnemonics string
   * Should only be used on web/extension
   */
  const getOnboardingAccountMnemonicString = (): string | undefined => {
    throwIfNotExtension()
    return onboardingAccountMnemonic?.map((word: string) => word.trim().toLowerCase()).join(' ')
  }

  /**
   * Sets mnemonics in the context state
   * Should only be used on web/extension
   */
  const addOnboardingAccountMnemonic = (mnemonic: string[]): void => {
    throwIfNotExtension()
    if (!mnemonic || (mnemonic.length !== 12 && mnemonic.length !== 24)) {
      throw new Error('Incorrect value of mnemonic parameted passed to addOnboardingAccountMnemonic function')
    }
    setOnboardingAccountMnemonic(mnemonic)
  }

  const resetOnboardingContextData = (): void => {
    setOnboardingAccount(undefined)
    setUnitagClaim(undefined)
    setImportedAccounts(undefined)
    setOnboardingAccountMnemonic(undefined)
  }

  return (
    <OnboardingContext.Provider
      value={{
        getOnboardingAccount,
        getImportedAccounts,
        setRecoveredImportedAccounts: setImportedAccounts,
        addBackupMethod,
        hasBackup,
        generateOnboardingAccount,
        generateImportedAccounts,
        generateImportedAccountsByMnemonic,
        enableNotifications,
        selectImportedAccounts,
        finishOnboarding,
        getAllOnboardingAccounts,
        getOnboardingAccountAddress,
        getImportedAccountsAddresses,
        getUnitagClaim,
        addUnitagClaim,
        addOnboardingAccountMnemonic,
        getOnboardingAccountMnemonic,
        getOnboardingAccountMnemonicString,
        retrieveOnboardingAccountMnemonic,
        setPendingWalletName,
        resetOnboardingContextData,
      }}
    >
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

  useEffect(() => {
    if (!onboardingAccount) {
      generateOnboardingAccount().catch((e) => {
        logger.error(e, {
          tags: { file: 'useCreateOnboardingAccountIfNone', function: 'generateOnboardingAccount' },
        })
      })
    }
  }, [generateOnboardingAccount, onboardingAccount])
}

/**
 * Triggers onboarding finish on screen mount
 * Extracted into hook for reusability.
 */
export function useFinishOnboarding(callback?: () => void, extensionOnboardingFlow?: ExtensionOnboardingFlow): void {
  const { finishOnboarding, getOnboardingAccountAddress } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const importType = onboardingAccountAddress ? ImportType.CreateNew : ImportType.RestoreMnemonic

  useEffect(() => {
    finishOnboarding({ importType, extensionOnboardingFlow })
      .then(callback)
      .catch((e) => {
        logger.error(e, {
          tags: { file: 'useFinishOnboarding', function: 'finishOnboarding' },
        })
      })
  }, [finishOnboarding, importType, callback, extensionOnboardingFlow])
}

// Checks if context function is used on the proper platform
const throwIfNotExtension = (): void => {
  if (!isExtension) {
    throw new Error('We should never generate/store mnemonic in Javascript for a non-extension app')
  }
}
