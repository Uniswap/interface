import { PreloadedState } from 'redux'
import { createFixture } from 'uniswap/src/test/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletState, initialWalletState } from 'wallet/src/features/wallet/slice'
import { SharedState } from 'wallet/src/state/reducer'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures/wallet/accounts'

type WalletPreloaedStateOptions = {
  account: Account
}

export const preloadedWalletState = createFixture<WalletState, WalletPreloaedStateOptions>(() => ({
  account: signerMnemonicAccount(),
}))(({ account }) => ({
  ...initialWalletState,
  accounts: { [account.address]: account },
  activeAccountAddress: account.address,
}))

type PreloadedSharedStateOptions = {
  account: Account | undefined
}

export const preloadedSharedState = createFixture<PreloadedState<SharedState>, PreloadedSharedStateOptions>({
  account: undefined,
})(({ account }) => ({
  wallet: preloadedWalletState({ account }),
}))
