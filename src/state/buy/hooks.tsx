import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ReactNode } from 'react'

// TODO: check if should batch userPoolBalance and activation in UserAccount, transform user tokens after
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
  activation: number
  poolPriceAmount: CurrencyAmount<Token>
  spread: number
  poolStake?: number
  apr?: number
  poolOwnStake?: number
  irr?: number
}

// based on typed value
export function useDerivedPoolInfo(
  typedValue: string,
  baseToken: Currency | undefined,
  userBaseTokenBalance: CurrencyAmount<Currency> | undefined,
  activation?: number
): {
  parsedAmount?: CurrencyAmount<Currency>
  error?: ReactNode
} {
  const { account } = useWeb3React()
  const currentTimestamp = useCurrentBlockTimestamp()

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
  if (activation) {
    error =
      error ?? Number(currentTimestamp) < activation ? (
        <Trans>Unlock in {((activation - Number(currentTimestamp)) / 86400).toFixed(1)} days</Trans>
      ) : undefined
  }

  return {
    parsedAmount,
    error,
  }
}
