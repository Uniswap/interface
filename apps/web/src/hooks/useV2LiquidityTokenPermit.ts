import {CurrencyAmount, Token} from '@taraswap/sdk-core'

import {PermitInfo, PermitType, SignatureData, useERC20Permit, UseERC20PermitState} from './useERC20Permit'
import useTransactionDeadline from './useTransactionDeadline'

const REMOVE_V2_LIQUIDITY_PERMIT_INFO: PermitInfo = {
  version: '1',
  name: 'Uniswap V2',
  type: PermitType.AMOUNT,
}

export function useV2LiquidityTokenPermit(
  liquidityAmount: CurrencyAmount<Token> | null | undefined,
  spender: string | null | undefined
): {
  signatureData: SignatureData | null
  state: UseERC20PermitState
  gatherPermitSignature: null | (() => Promise<void>)
} {
  const transactionDeadline = useTransactionDeadline()
  return useERC20Permit(liquidityAmount, spender, transactionDeadline, REMOVE_V2_LIQUIDITY_PERMIT_INFO)
}
