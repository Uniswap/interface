import { TokenAmount } from '@ubeswap/sdk'
import QuestionHelper from 'components/QuestionHelper'
import React from 'react'

interface Props {
  userAmountTokenA: TokenAmount | undefined
  userAmountTokenB: TokenAmount | undefined
}

export default function StakedAmountsHelper({ userAmountTokenA, userAmountTokenB }: Props) {
  return userAmountTokenA && userAmountTokenB ? (
    <QuestionHelper text={`${formatStakedAmount(userAmountTokenA)} | ${formatStakedAmount(userAmountTokenB)}`} />
  ) : null
}

export function SingleStakedAmountsHelper({ userAmountToken }: { userAmountToken: TokenAmount | undefined }) {
  return userAmountToken ? <QuestionHelper text={`${formatStakedAmount(userAmountToken)}`} /> : null
}

// Format amount based on the size, when under 1 show significant digits, when 1 to 10 show 1 decimal, over 10 round
function formatStakedAmount(tokenAmmount?: TokenAmount) {
  const amount = tokenAmmount?.lessThan('1')
    ? tokenAmmount.toSignificant(2)
    : tokenAmmount?.toFixed(tokenAmmount?.lessThan('10') ? 1 : 0, { groupSeparator: ',' })
  return `${amount} ${tokenAmmount?.token.symbol}`
}
