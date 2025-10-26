import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Account } from 'uniswap/src/features/accounts/store/types/Account'
import { AccessPattern, ConnectorErrorType, ConnectorStatus } from 'uniswap/src/features/accounts/store/types/Connector'
import { ChainScopeType } from 'uniswap/src/features/accounts/store/types/Session'
import { SigningCapability } from 'uniswap/src/features/accounts/store/types/Wallet'
import { createAccountsStoreContextProvider } from 'uniswap/src/features/accounts/store/utils/createAccountsStoreContextProvider'
import { AccountType as ReduxAccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ensure0xHex } from 'utilities/src/addresses/hex'
import { isNonEmptyArray, NonEmptyArray } from 'utilities/src/primitives/array'
import { createAccountsStoreGetters } from 'wallet/src/features/accounts/store/getters'
import {
  DerivedAddresses,
  LocalConnector,
  LocalSession,
  MnemonicWallet,
  ReadonlyWallet,
  WalletAppsAccountsData,
} from 'wallet/src/features/accounts/store/types'
import {
  Account as ReduxAccount,
  SignerMnemonicAccount as ReduxSignerMnemonicAccount,
} from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccount as useActiveReduxAccount } from 'wallet/src/features/wallet/hooks'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'
import { WalletState } from 'wallet/src/state/walletReducer'

/**
 * Wallet package implementation of the unified accounts store architecture.
 * Transforms local Redux state (mnemonic + readonly accounts) into our common format,
 * providing consistent APIs across web, mobile, and shared packages.
 */

const LOCAL_CONNECTOR_ID = 'local_connector'
const MNEMONIC_WALLET_ID = 'stored_mnemonic_wallet'
const READONLY_WALLET_ID_PREFIX = 'readonly_import_wallet'

/** Generates a unique wallet ID for readonly imported accounts. */
function getReadonlyWalletId(address: string): string {
  return `${READONLY_WALLET_ID_PREFIX}-${address}`
}

/** Returns the appropriate wallet ID based on account type. */
function getWalletId(account: ReduxAccount): string {
  return account.type === ReduxAccountType.Readonly ? getReadonlyWalletId(account.address) : MNEMONIC_WALLET_ID
}

/** Creates a local connector with native access pattern and multi-chain scope. */
function createLocalConnector(account: ReduxAccount | null, finishedOnboarding?: boolean): LocalConnector {
  if (!account) {
    const error = !finishedOnboarding
      ? ConnectorErrorType.OnboardingNotFinished
      : ConnectorErrorType.UnexpectedEmptyAccountState

    return {
      id: LOCAL_CONNECTOR_ID,
      access: AccessPattern.Native,
      status: ConnectorStatus.Disconnected,
      session: undefined,
      error,
    }
  }

  // Readonly wallets will only ever point to index 0, since they have one account.
  const currentAccountIndex = account.type === ReduxAccountType.Readonly ? 0 : account.derivationIndex

  const session: LocalSession = {
    walletId: getWalletId(account),
    currentAccountIndex,
    chainScope: {
      type: ChainScopeType.MultiChain,
      supportedChains: 'all',
    },
  }

  return {
    id: LOCAL_CONNECTOR_ID,
    access: AccessPattern.Native,
    status: ConnectorStatus.Connected,
    session,
  }
}

/** Creates a mnemonic wallet with immediate signing capability from derived accounts. */
function createMnemonicWallet(accounts: NonEmptyArray<ReduxSignerMnemonicAccount>): MnemonicWallet {
  const addresses: DerivedAddresses[] = []

  for (const account of accounts) {
    // We store by derivation index of the account, rather than for loop index, as some indices may not be present in the stored array, but we still want O(1) lookup time.
    addresses[account.derivationIndex] = { derivationIndex: account.derivationIndex, evm: ensure0xHex(account.address) }
  }

  return {
    id: MNEMONIC_WALLET_ID,
    addresses,
    signingCapability: SigningCapability.Immediate,
  }
}

/** Creates a readonly wallet with no signing capability from imported account. */
function createReadonlyWallet(account: ReduxAccount): ReadonlyWallet {
  return {
    id: getReadonlyWalletId(account.address),
    addresses: [{ evm: ensure0xHex(account.address) }],
    signingCapability: SigningCapability.None,
    name: account.name,
  }
}

/** Creates wallet records from Redux accounts, handling both mnemonic and readonly types. */
function createWallets(accounts: ReduxAccount[]): Record<string, MnemonicWallet | ReadonlyWallet> {
  const mnemonicAccounts = accounts.filter(
    (account): account is ReduxSignerMnemonicAccount => account.type === ReduxAccountType.SignerMnemonic,
  )
  // As we currently only supported one seed phrase, all mnemonic accounts will be coming from the same wallet.
  const mnemonicWallet = isNonEmptyArray(mnemonicAccounts) ? createMnemonicWallet(mnemonicAccounts) : undefined
  const mnemonicWallets = mnemonicWallet ? [mnemonicWallet] : []

  const readonlyWallets = accounts.flatMap((account) =>
    account.type === ReduxAccountType.Readonly ? createReadonlyWallet(account) : [],
  )

  return [...mnemonicWallets, ...readonlyWallets].reduce(
    (acc, wallet) => ({ ...acc, [wallet.id]: wallet }),
    {} as Record<string, MnemonicWallet | ReadonlyWallet>,
  )
}

/** Creates account records from Redux accounts with proper wallet ID mapping. */
function createAccounts(accounts: ReduxAccount[]): Record<string, Account<Platform.EVM>> {
  return accounts.reduce(
    (acc, account) => ({
      ...acc,
      [account.address]: {
        walletId: getWalletId(account),
        address: ensure0xHex(account.address),
        platform: Platform.EVM,
      },
    }),
    {} as Record<string, Account<Platform.EVM>>,
  )
}

/** Main hook that transforms Redux state into unified accounts store format. */
function useAccountsState(): WalletAppsAccountsData {
  const { reduxAccounts } = useSelector((state: WalletState) => ({ reduxAccounts: state.wallet.accounts }))
  const finishedOnboarding = useSelector(selectFinishedOnboarding)
  const activeAccount = useActiveReduxAccount()

  const localConnector = useMemo(
    () => createLocalConnector(activeAccount, finishedOnboarding),
    [activeAccount, finishedOnboarding],
  )
  const accounts = useMemo(() => createAccounts(Object.values(reduxAccounts)), [reduxAccounts])
  const wallets = useMemo(() => createWallets(Object.values(reduxAccounts)), [reduxAccounts])

  return useMemo(
    () => ({
      connectors: {
        [LOCAL_CONNECTOR_ID]: localConnector,
      },
      localConnector,
      wallets,
      accounts,
    }),
    [localConnector, wallets, accounts],
  )
}

/** Wallet package accounts store provider and context hook. */
export const { AccountsStoreContextProvider, useAccountsStoreContext } = createAccountsStoreContextProvider({
  useAppAccountsState: useAccountsState,
  createGetters: createAccountsStoreGetters,
})
