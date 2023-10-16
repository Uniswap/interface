import { createSelector } from '@reduxjs/toolkit'
import { Selector } from 'react-redux'
import { WebState } from 'src/background/store'
import { ChainId } from 'wallet/src/constants/chains'

export const selectChainByDappAndWallet = (
  wallet: Address,
  dappUrl?: string
): Selector<WebState, ChainId> =>
  createSelector(
    (state: WebState) => state.dapp[dappUrl ?? ''],
    (dappPreferences) => dappPreferences?.[wallet]?.lastChainId ?? ChainId.Mainnet
  )

export const selectWalletsByDapp = (
  dappUrl: string | undefined
): Selector<WebState, Set<Address>> =>
  createSelector(
    (state: WebState) => state.dapp[dappUrl ?? ''],
    (dappWallets) => new Set(Object.keys(dappWallets || {}))
  )
