import { PreloadedState } from 'redux'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletState, initialWalletState } from 'wallet/src/features/wallet/slice'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures'

// Useful when passing in preloaded state where active account is required
export function mockWalletPreloadedState(
  account?: Account
): PreloadedState<{ wallet: WalletState }> {
  const acc = account ?? signerMnemonicAccount()

  return {
    wallet: {
      ...initialWalletState,
      accounts: { [acc.address]: acc },
      activeAccountAddress: acc.address,
    },
  }
}
