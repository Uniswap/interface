import { Pair, PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import React from 'react'
import { AutoColumn } from '../../../../Column'
import CurrencyInputPanel from '../../../../CurrencyInputPanel'
import { tryParseAmount } from '../../../../../state/swap/hooks'

interface ConfirmStakeModalHeaderProps {
  stakablePair?: Pair | null
  amount: TokenAmount | null
  maximumAmount?: TokenAmount | PricedTokenAmount
  onAmountChange: (amount: TokenAmount) => void
}

export default function ConfirmStakingWithdrawingModalHeader({
  stakablePair,
  amount,
  maximumAmount,
  onAmountChange
}: ConfirmStakeModalHeaderProps) {
  return (
    <AutoColumn gap="md" style={{ marginTop: '20px' }}>
      <CurrencyInputPanel
        value={amount?.toExact() ?? '0'}
        onUserInput={input => {
          if (!stakablePair) return
          const parsedAmount = tryParseAmount(input) as TokenAmount | undefined
          onAmountChange(parsedAmount ?? new TokenAmount(stakablePair?.liquidityToken, '0'))
        }}
        onMax={() => {
          if (!maximumAmount) return
          onAmountChange(new TokenAmount(maximumAmount.token, maximumAmount.raw))
        }}
        showMaxButton
        pair={stakablePair}
        id="staked-amount"
        disableCurrencySelect
        customBalanceText="Stakable: "
        balance={maximumAmount}
      />
    </AutoColumn>
  )
}
