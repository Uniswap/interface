/* eslint-disable max-lines */
import dayjs from 'dayjs'
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UnitagClaim } from 'uniswap/src/features/unitags/types'
import { ImportType } from 'uniswap/src/types/onboarding'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isMobileApp } from 'utilities/src/platform'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import {
  setBackupReminderLastSeenTs,
  setCreatedOnboardingRedesignAccount,
  setHasSkippedUnitagPrompt,
  setHasViewedWelcomeWalletCard,
} from 'wallet/src/features/behaviorHistory/slice'
import { createImportedAccounts } from 'wallet/src/features/onboarding/createImportedAccounts'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { useClaimUnitag } from 'wallet/src/features/unitags/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'
import { EditAccountAction, editAccountActions } from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { Account, BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'

export const NUMBER_OF_WALLETS_TO_GENERATE = 10

interface ImportMnemonicArgs {
  mnemonic: string
  password?: string
  allowOverwrite?: boolean
}

interface GenerateImportedAccountsArgs {
  mnemonicId: string
  backupType: BackupType.Cloud | BackupType.Manual
}

export interface OnboardingContext {
  importMnemonicToKeychain: ({ mnemonic, password, allowOverwrite }: ImportMnemonicArgs) => Promise<void>
  generateOnboardingAccount: (password?: string) => Promise<void>
  generateInitialAddresses: () => Promise<void>
  generateAdditionalAddresses: () => Promise<void>
  generateImportedAccounts: ({ mnemonicId, backupType }: GenerateImportedAccountsArgs) => Promise<void>
  generateAccountsAndImportAddresses: (selectedAddresses: string[]) => Promise<SignerMnemonicAccount[] | undefined>
  addBackupMethod: (backupMethod: BackupType) => void
  hasBackup: (address: string, backupType?: BackupType) => boolean | undefined
  enableNotifications: () => void
  selectImportedAccounts: (accountAddresses: string[]) => Promise<SignerMnemonicAccount[]>
  finishOnboarding: ({
    importType,
    accounts,
    extensionOnboardingFlow,
    createdFromOnboardingRedesign,
  }: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
    createdFromOnboardingRedesign?: boolean
  }) => Promise<void>
  getAllOnboardingAccounts: () => SignerMnemonicAccount[]
  getOnboardingAccount: () => SignerMnemonicAccount | undefined
  getOnboardingAccountAddress: () => string | undefined
  getGeneratedAddresses: () => Promise<string[] | undefined>
  getImportedAccounts: () => SignerMnemonicAccount[] | undefined
  getOnboardingOrImportedAccount: () => SignerMnemonicAccount | undefined
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
  importMnemonicToKeychain: async () => undefined,
  generateOnboardingAccount: async () => undefined,
  generateInitialAddresses: async () => undefined,
  generateAdditionalAddresses: async () => undefined,
  generateImportedAccounts: async () => undefined,
  generateAccountsAndImportAddresses: async () => [],
  addBackupMethod: () => undefined,
  hasBackup: () => undefined,
  enableNotifications: () => undefined,
  selectImportedAccounts: async () => [],
  finishOnboarding: async (_params: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
    createdFromOnboardingRedesign?: boolean
  }) => undefined,
  getAllOnboardingAccounts: () => [],
  getGeneratedAddresses: async () => undefined,
  getOnboardingAccount: () => undefined,
  getOnboardingAccountAddress: () => undefined,
  getImportedAccounts: () => undefined,
  getOnboardingOrImportedAccount: () => undefined,
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
  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)

  const [onboardingAccount, setOnboardingAccount] = useState<SignerMnemonicAccount | undefined>()
  const [unitagClaim, setUnitagClaim] = useState<UnitagClaim | undefined>()
  const [lastDerivedIndex, setLastDerivedIndex] = useState<number>(0)
  const [generatedAddresses, setGeneratedAddresses] = useState<string[] | undefined>()
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
      // Clear any stale data from the extension Keyring only
      // Mobile enforces the single mnemonic rule via the onboarding recovery process
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

  const getOnboardingOrImportedAccount = (): SignerMnemonicAccount | undefined => {
    return onboardingAccount || importedAccounts?.[0]
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

  const importMnemonicToKeychain = async ({
    mnemonic,
    password,
    allowOverwrite,
  }: ImportMnemonicArgs): Promise<void> => {
    if (isExtension) {
      // Clear any stale data from the extension Keyring only
      // Mobile enforces the single mnemonic rule via the onboarding recovery process
      await Keyring.removeAllMnemonicsAndPrivateKeys()
    }

    await Keyring.importMnemonic(mnemonic, password, allowOverwrite)
    setImportedAccounts(undefined)
    setOnboardingAccount(undefined)
  }

  const generateInitialAddresses = async (): Promise<void> => {
    // Mobile requires an implementation in Keyring.native.ts for this function to be used
    throwIfNotExtension()
    const mnemonic = getOnboardingAccountMnemonicString()
    if (!mnemonic) {
      throw new Error('No mnemonic available to generate addresses')
    }

    if (generatedAddresses?.length) {
      logger.error(new Error('Attempting to generate initial addresses when already generated'), {
        tags: { file: 'OnboardingContextProvider', function: 'generateInitialAddresses' },
      })

      return
    }

    const newAddresses = await Keyring.generateAddressesForMnemonic(mnemonic, 0, NUMBER_OF_WALLETS_TO_GENERATE)
    setGeneratedAddresses(newAddresses)
    setLastDerivedIndex(NUMBER_OF_WALLETS_TO_GENERATE)
  }

  const generateAdditionalAddresses = async (): Promise<void> => {
    // Mobile requires an implementation in Keyring.native.ts for this function to be used
    throwIfNotExtension()
    const mnemonic = getOnboardingAccountMnemonicString()
    if (!mnemonic) {
      throw new Error('No mnemonic available to generate addresses')
    }

    const existingAddresses = generatedAddresses ?? []
    const newlyDerivedAddresses = await Keyring.generateAddressesForMnemonic(
      mnemonic,
      lastDerivedIndex,
      lastDerivedIndex + NUMBER_OF_WALLETS_TO_GENERATE,
    )
    setGeneratedAddresses([...existingAddresses, ...newlyDerivedAddresses])
    setLastDerivedIndex(lastDerivedIndex + NUMBER_OF_WALLETS_TO_GENERATE)
  }

  const getGeneratedAddresses = async (): Promise<string[] | undefined> => {
    if (!generatedAddresses?.length) {
      logger.error(new Error('No addresses available to retrieve'), {
        tags: { file: 'OnboardingContextProvider', function: 'getGeneratedAddresses' },
      })

      await generateInitialAddresses()
    }

    return generatedAddresses
  }

  const generateAccountsAndImportAddresses = async (
    selectedAddresses: string[],
  ): Promise<SignerMnemonicAccount[] | undefined> => {
    const mnemonicId = generatedAddresses?.[0]
    if (!generatedAddresses || !mnemonicId) {
      throw new Error('No addresses to generate accounts for')
    }

    const indexesToImport = selectedAddresses.map((address) => generatedAddresses.indexOf(address))

    if (indexesToImport.includes(-1)) {
      const invalidAddress = selectedAddresses[indexesToImport.indexOf(-1)]
      logger.error(new Error('Invalid address selected for import'), {
        tags: { file: 'OnboardingContextProvider', function: 'generateAccountsAndImportAddresses' },
        extra: { invalidAddress },
      })
    }

    const addresses = await Promise.all(
      indexesToImport.map(async (index) => Keyring.generateAndStorePrivateKey(mnemonicId, index)),
    ).catch((error) => {
      logger.error(error, {
        tags: { file: 'OnboardingContextProvider', function: 'generateAccountsAndImportAddresses' },
      })
    })

    const accountsToImport: SignerMnemonicAccount[] | undefined = addresses?.map((address, index) => ({
      type: AccountType.SignerMnemonic,
      address,
      name: t('onboarding.wallet.defaultName', { number: index + 1 }),
      timeImportedMs: dayjs().valueOf(),
      derivationIndex: index,
      mnemonicId,
      backups: [BackupType.Manual],
    }))

    setImportedAccounts(accountsToImport)

    return accountsToImport
  }
  /**
   * Generates a set (10) of wallets based on given mnemonicId. Used for importing
   * existing wallets from cloud or using mnemonics.
   * @param mnemonicId Required to generate a wallet address
   * @param backupType Backup type for generated accounts
   */
  const generateImportedAccounts = async ({ mnemonicId, backupType }: GenerateImportedAccountsArgs): Promise<void> => {
    setImportedAccounts(undefined)
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
    return sortedImportedAccountAddresses
  }

  /**
   * Selects imported accounts from within the context and sets them as the
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
   * parameter is not provided
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
    createdFromOnboardingRedesign = false,
  }: {
    importType: ImportType
    accounts?: SignerMnemonicAccount[]
    extensionOnboardingFlow?: ExtensionOnboardingFlow
    createdFromOnboardingRedesign?: boolean
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

      if (claimError && !extensionOnboardingFlow) {
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

    if (importType === ImportType.CreateNew) {
      if (isMobileApp) {
        // Dismiss unitags prompt if the onboarding method prompts for unitags (create new)
        dispatch(setHasSkippedUnitagPrompt(true))
      }

      // Reset the last timestamp for having shown the backup reminder modal
      dispatch(setBackupReminderLastSeenTs(undefined))

      // Reset the flag for having seen the welcome wallet card
      dispatch(setHasViewedWelcomeWalletCard(false))

      if (createdFromOnboardingRedesign) {
        dispatch(setCreatedOnboardingRedesignAccount(true))
      }
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
    return normalizeTextInput(onboardingAccountMnemonic?.join(' ') ?? '')
  }

  /**
   * Sets mnemonics in the context state
   * Should only be used on web/extension
   */
  const addOnboardingAccountMnemonic = (mnemonic: string[]): void => {
    throwIfNotExtension()
    if (!mnemonic || (mnemonic.length !== 12 && mnemonic.length !== 24)) {
      throw new Error('Incorrect mnemonic value passed to addOnboardingAccountMnemonic function')
    }
    setOnboardingAccountMnemonic(mnemonic)
    setLastDerivedIndex(0)
    setGeneratedAddresses(undefined)
  }

  const resetOnboardingContextData = (): void => {
    setOnboardingAccount(undefined)
    setImportedAccounts(undefined)
    setOnboardingAccountMnemonic(undefined)
  }

  return (
    <OnboardingContext.Provider
      value={{
        importMnemonicToKeychain,
        getOnboardingAccount,
        getImportedAccounts,
        getOnboardingOrImportedAccount,
        setRecoveredImportedAccounts: setImportedAccounts,
        addBackupMethod,
        hasBackup,
        generateOnboardingAccount,
        generateInitialAddresses,
        generateAdditionalAddresses,
        getGeneratedAddresses,
        generateImportedAccounts,
        generateAccountsAndImportAddresses,
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
 * Triggers onboarding finish on screen mount for extension only
 * Extracted into hook for reusability.
 */
export function useFinishOnboarding(
  callback?: () => void,
  extensionOnboardingFlow?: ExtensionOnboardingFlow,
  pendingClaim?: boolean,
): void {
  const { finishOnboarding, getOnboardingAccountAddress } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const importType = onboardingAccountAddress ? ImportType.CreateNew : ImportType.RestoreMnemonic

  useEffect(() => {
    if (pendingClaim) {
      return
    }
    finishOnboarding({ importType, extensionOnboardingFlow })
      .then(callback)
      .catch((e) => {
        logger.error(e, {
          tags: { file: 'useFinishOnboarding', function: 'finishOnboarding' },
        })
      })
  }, [finishOnboarding, importType, callback, extensionOnboardingFlow, pendingClaim])
}

// Checks if context function is used on the proper platform
const throwIfNotExtension = (): void => {
  if (!isExtension) {
    throw new Error('We should never generate/store mnemonic in Javascript for a non-extension app')
  }
}
