import { Trade } from '@ubeswap/sdk'
import { MoolaTrade } from './moola/MoolaTrade'

export enum RoutingMethod {
  UBESWAP = 0,
  MOOLA = 1,
}

export const describeTrade = (
  trade: Trade | undefined
): {
  label: string
  makeLabel: (isInverted: boolean) => string
  routingMethod: RoutingMethod
  isEstimate: boolean
} => {
  if (trade instanceof MoolaTrade) {
    return {
      label: trade.isWithdrawal() ? 'Withdraw' : 'Deposit',
      makeLabel: (isInverted) => {
        const result = trade.isWithdrawal()
        const resultInverted = isInverted ? !result : result
        return resultInverted ? 'Withdraw' : 'Deposit'
      },
      routingMethod: RoutingMethod.MOOLA,
      isEstimate: false,
    }
  } else {
    return { label: 'Swap', routingMethod: RoutingMethod.UBESWAP, isEstimate: true, makeLabel: () => 'Swap' }
  }
}
