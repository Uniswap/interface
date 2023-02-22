import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ReactNode } from 'react'

export interface BuyInfo {
  // the address of the smart pool
  poolAddress: string
  recipient?: string
  // the amount of base tokens the user has available for purchase
  maxSlippage?: number
  // the total amount of minted pool tokens
  purchaseAmount?: CurrencyAmount<Token>
  // the total amount of minted pool tokens
  totalSupplyAmount?: CurrencyAmount<Token>
  poolPrice?: CurrencyAmount<Token>
  spread?: number
  // calculates a hypothetical amount of token distributed to the active account per second.
  getExpectedOutput?: (
    purchaseAmount: CurrencyAmount<Token>,
    poolPrice: CurrencyAmount<Token>,
    spread: number
  ) => CurrencyAmount<Token>
}

// based on typed value
export function useDerivedBuyInfo(
  typedValue: string,
  baseToken: Token | undefined,
  userBaseTokenBalance: CurrencyAmount<Token> | undefined
): {
  parsedAmount?: CurrencyAmount<Token>
  error?: ReactNode
} {
  const { account } = useWeb3React()

  const parsedInput: CurrencyAmount<Token> | undefined = tryParseCurrencyAmount(typedValue, baseToken)

  const parsedAmount =
    parsedInput && userBaseTokenBalance && JSBI.lessThanOrEqual(parsedInput.quotient, userBaseTokenBalance.quotient)
      ? parsedInput
      : undefined

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (!parsedAmount) {
    error = error ?? <Trans>Enter an amount</Trans>
  }

  return {
    parsedAmount,
    error,
  }
}
