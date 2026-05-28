import { createUseActiveAccount } from 'uniswap/src/features/accounts/store/utils/accounts'
import { createUseActiveAddress, createUseActiveAddresses } from 'uniswap/src/features/accounts/store/utils/addresses'
import { createUseAccountsStore } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { createUseActiveWallet } from 'uniswap/src/features/accounts/store/utils/wallets'
import { useAccountsStoreContext } from 'wallet/src/features/accounts/store/provider'

export const useAccountsStore = createUseAccountsStore(useAccountsStoreContext)

export const useActiveAddress = createUseActiveAddress(useAccountsStoreContext)

export const useActiveAddresses = createUseActiveAddresses(useAccountsStoreContext)

export const useActiveAccount = createUseActiveAccount(useAccountsStoreContext)

export const useActiveWallet = createUseActiveWallet(useAccountsStoreContext)

// Wallet package currently has no use for connector information / status.
// export const useActiveConnector = createUseActiveConnector(useAccountsStoreContext)
// export const useConnectionStatus = createUseConnectionStatus(useAccountsStoreContext)
