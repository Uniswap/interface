import { createSelector } from '@reduxjs/toolkit'
import { ChainId } from 'wallet/src/constants/chains'
import { WebState } from '../../background/store'

export const selectChainByDappAndWallet = (dappUrl: string, wallet: Address) =>
  createSelector(
    (state: WebState) => state.dapp[dappUrl],
    (dappPreferences) => {
      if (!dappPreferences) {
        return ChainId.Mainnet
      }
      return dappPreferences[wallet]?.lastChainId ?? ChainId.Mainnet
    }
  )
