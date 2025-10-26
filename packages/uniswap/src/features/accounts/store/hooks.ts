import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import type { AccountsStore } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { createUseActiveAccount } from 'uniswap/src/features/accounts/store/utils/accounts'
import { createUseActiveAddress, createUseActiveAddresses } from 'uniswap/src/features/accounts/store/utils/addresses'
import {
  createUseActiveConnector,
  createUseConnectionStatus,
} from 'uniswap/src/features/accounts/store/utils/connection'
import { createUseAccountsStore } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { createUseActiveWallet, createUseWalletWithId } from 'uniswap/src/features/accounts/store/utils/wallets'

/** Gets AccountsStoreContext for the current app, passed by the app to this package via `UniswapProvider`. */
function useCurrentAppAccountStoreContext(): AccountsStore {
  const useAccountsStoreContextHook = useUniswapContext().useAccountsStoreContextHook
  return useAccountsStoreContextHook()
}

export const useAccountsStore = createUseAccountsStore(useCurrentAppAccountStoreContext)

export const useActiveAddress = createUseActiveAddress(useCurrentAppAccountStoreContext)

export const useActiveAddresses = createUseActiveAddresses(useCurrentAppAccountStoreContext)

export const useActiveAccount = createUseActiveAccount(useCurrentAppAccountStoreContext)

export const useActiveConnector = createUseActiveConnector(useCurrentAppAccountStoreContext)

export const useActiveWallet = createUseActiveWallet(useCurrentAppAccountStoreContext)

export const useConnectionStatus = createUseConnectionStatus(useCurrentAppAccountStoreContext)

export const useWalletWithId = createUseWalletWithId(useCurrentAppAccountStoreContext)
