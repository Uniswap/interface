/* eslint-disable import/no-unused-modules */
import { useAccountsStoreContext } from 'features/accounts/store/provider'
import { createUseActiveAccount } from 'uniswap/src/features/accounts/store/utils/accounts'
import { createUseActiveAddress, createUseActiveAddresses } from 'uniswap/src/features/accounts/store/utils/addresses'
import {
  createUseActiveConnector,
  createUseConnectionStatus,
} from 'uniswap/src/features/accounts/store/utils/connection'
import { createUseAccountsStore } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { createUseActiveWallet } from 'uniswap/src/features/accounts/store/utils/wallets'

export const useAccountsStore = createUseAccountsStore(useAccountsStoreContext)

export const useActiveAddress = createUseActiveAddress(useAccountsStoreContext)

export const useActiveAddresses = createUseActiveAddresses(useAccountsStoreContext)

export const useActiveAccount = createUseActiveAccount(useAccountsStoreContext)

export const useActiveConnector = createUseActiveConnector(useAccountsStoreContext)

export const useActiveWallet = createUseActiveWallet(useAccountsStoreContext)

export const useConnectionStatus = createUseConnectionStatus(useAccountsStoreContext)
