import { createSelector } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'

import { RootState } from 'wallet/src/state'

export const selectChainByDappAndWallet = (dappUrl: string, wallet: Address) =>
  createSelector(
    (state: RootState) => state.dapp[dappUrl],
    (dappPreferences) => {
      if (!dappPreferences) {
        return ChainId.Mainnet
      }
      return dappPreferences[wallet]?.lastChainId ?? ChainId.Mainnet
    }
  )
