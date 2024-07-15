import { PreloadedState } from 'redux'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { WalletState, initialWalletState } from 'wallet/src/features/wallet/slice'
import { SharedState } from 'wallet/src/state/reducer'
import { signerMnemonicAccount } from 'wallet/src/test/fixtures/wallet/accounts'
import { createFixture } from 'wallet/src/test/utils'

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

export const preloadedSharedState = createFixture<
  PreloadedState<SharedState>,
  PreloadedSharedStateOptions
>({ account: undefined })(({ account }) => ({
  wallet: preloadedWalletState({ account }),
}))
