import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ReactNode } from 'react'

export interface PoolInfo {
  // the smart pool token
  pool: Token
  // TODO: check where we use recipient
  recipient: string
  owner?: string
  // the amount of base tokens the user has available for purchase
  maxSlippage?: number
  // the total amount of pool tokens held by the account
  userPoolBalance: CurrencyAmount<Token>
  poolPriceAmount: CurrencyAmount<Token>
  spread: number
  poolStake?: number
  apr?: number
}

// based on typed value
export function useDerivedPoolInfo(
  typedValue: string,
  baseToken: Currency | undefined,
  userBaseTokenBalance: CurrencyAmount<Currency> | undefined
): {
  parsedAmount?: CurrencyAmount<Currency>
  error?: ReactNode
} {
  const { account } = useWeb3React()

  const parsedInput: CurrencyAmount<Currency> | undefined = tryParseCurrencyAmount(typedValue, baseToken)

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
