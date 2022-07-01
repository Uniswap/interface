import { parseUnits } from '@ethersproject/units'
import { useAppSelector } from 'state/hooks'

import { AppState } from '../index'
import { IXttPresaleFormattedState } from './reducer'

export function useXttPresaleState(): AppState['xttPresale'] {
  return useAppSelector((state) => state.xttPresale)
}

export function useXttPresaleStateFormatted() {
  return useAppSelector(
    ({ xttPresale }): IXttPresaleFormattedState => ({
      ...xttPresale,
      minimumDepositEthAmount: parseUnits(xttPresale.minimumDepositEthAmount || '0', 0),
      maximumDepositEthAmount: parseUnits(xttPresale.maximumDepositEthAmount || '0', 0),
      totalDepositedEthBalance: parseUnits(xttPresale.totalDepositedEthBalance || '0', 0),
      hardCapEthAmount: parseUnits(xttPresale.hardCapEthAmount || '0', 0),
      tokenPerETH: parseUnits(xttPresale.tokenPerETH || '0', 0),
      totalBought: parseUnits(xttPresale.totalBought || '0', 0),
      totalClaimed: parseUnits(xttPresale.totalClaimed || '0', 0),
      deposits: parseUnits(xttPresale.deposits || '0', 0),
      balanceOf: parseUnits(xttPresale.balanceOf || '0', 0),
    })
  )
}

export function useXttPresaleStateStatus(): AppState['xttPresale']['status'] {
  return useAppSelector((state) => state.xttPresale.status)
}
export function useXttPresaleStateStatusWithSigner(): AppState['xttPresale']['statusWithSigner'] {
  return useAppSelector((state) => state.xttPresale.statusWithSigner)
}
