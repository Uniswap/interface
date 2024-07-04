import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { PermitInfo, PermitType, useERC20Permit } from 'hooks/useERC20Permit'
import useTransactionDeadline from 'hooks/useTransactionDeadline'

const REMOVE_V2_LIQUIDITY_PERMIT_INFO: PermitInfo = {
  version: '1',
  name: 'Uniswap V2',
  type: PermitType.AMOUNT,
}

export function useV2LiquidityTokenPermit(
  liquidityAmount: CurrencyAmount<Token> | null | undefined,
  spender: string | null | undefined,
) {
  const transactionDeadline = useTransactionDeadline()
  return useERC20Permit(liquidityAmount, spender, transactionDeadline, REMOVE_V2_LIQUIDITY_PERMIT_INFO)
}
