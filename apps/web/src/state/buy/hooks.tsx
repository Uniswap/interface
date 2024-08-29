import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { Trans } from 'uniswap/src/i18n'
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
  token: Currency | undefined,
  tokenBalance: CurrencyAmount<Currency> | undefined,
  activation?: number
): {
  parsedAmount?: CurrencyAmount<Currency>
  error?: ReactNode
} {
  const account = useAccount()
  const currentTimestamp = useCurrentBlockTimestamp()

  const parsedAmount: CurrencyAmount<Currency> | undefined = tryParseCurrencyAmount(typedValue, token)

  // when a value is not typed, we do not return an error
  const userHasEnough: boolean = JSBI.lessThanOrEqual(
    parsedAmount?.quotient ?? JSBI.BigInt(0),
    tokenBalance?.quotient ?? JSBI.BigInt(0)
  )

  let error: ReactNode | undefined
  if (!account.isConnected) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (!parsedAmount) {
    error = error ?? <Trans>Enter an amount</Trans>
  }
  if (!userHasEnough) {
    if (activation) {
      error = error ?? <Trans>Cannot sell more than owned</Trans>
    } else {
      error = error ?? <Trans>Amount error</Trans>
    }
  }
  if (activation && activation > Number(currentTimestamp)) {
    error = error ?? <Trans>Unlock in {((activation - Number(currentTimestamp)) / 86400).toFixed(1)} days</Trans>
  }

  return {
    parsedAmount,
    error,
  }
}
