import { createSelector } from '@reduxjs/toolkit'
import { Selector } from 'react-redux'
import { ChainId } from 'wallet/src/constants/chains'
import { WebState } from '../../store'

export const selectChainByDappAndWallet = (
  wallet: Address,
  dappUrl?: string
): Selector<WebState, ChainId> =>
  createSelector(
    (state: WebState) => state.dapp[dappUrl ?? ''],
    (dappPreferences) => {
      if (!dappPreferences) {
        return ChainId.Mainnet
      }
      return dappPreferences[wallet]?.lastChainId ?? ChainId.Mainnet
    }
  )
