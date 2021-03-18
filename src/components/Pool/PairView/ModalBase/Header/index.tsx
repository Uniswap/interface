import { Pair, PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import React, { useState } from 'react'
import { AutoColumn } from '../../../../Column'
import CurrencyInputPanel from '../../../../CurrencyInputPanel'
import { tryParseAmount } from '../../../../../state/swap/hooks'

interface ConfirmStakeModalHeaderProps {
  stakablePair?: Pair | null
  maximumAmount?: TokenAmount | PricedTokenAmount
  onAmountChange: (amount: TokenAmount) => void
}

export default function ConfirmStakingWithdrawingModalHeader({
  stakablePair,
  maximumAmount,
  onAmountChange
}: ConfirmStakeModalHeaderProps) {
  const [typedAmount, setTypedAmount] = useState('')

  return (
    <AutoColumn gap="md" style={{ marginTop: '20px' }}>
      <CurrencyInputPanel
        value={typedAmount}
        onUserInput={input => {
          if (!stakablePair) return
          setTypedAmount(input)
          const parsedAmount = tryParseAmount(input, stakablePair.liquidityToken) as TokenAmount | undefined
          if (parsedAmount) {
            onAmountChange(parsedAmount)
          }
        }}
        onMax={() => {
          if (!maximumAmount) return
          setTypedAmount(maximumAmount.toExact())
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
