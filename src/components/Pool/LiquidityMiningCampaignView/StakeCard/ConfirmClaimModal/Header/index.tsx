import { PricedTokenAmount, TokenAmount } from '@swapr/sdk'
import React, { useState } from 'react'
import styled from 'styled-components'
import { tryParseAmount } from '../../../../../../state/swap/hooks'
import { AutoColumn } from '../../../../../Column'
import CurrencyInputPanel from '../../../../../CurrencyInputPanel'

const Root = styled.div`
  margin-top: 20px;
`

interface ConfirmStakeModalHeaderProps {
  claimableRewards: PricedTokenAmount[]
  onAmountChange: (newAmount: TokenAmount) => void
}

export default function ConfirmClaimModalHeader({ claimableRewards, onAmountChange }: ConfirmStakeModalHeaderProps) {
  const [typedAmount, setTypedAmount] = useState<{ [rewardTokenAddress: string]: string }>({})

  return (
    <Root>
      <AutoColumn gap="8px">
        {claimableRewards.map(claimableReward => {
          const rewardToken = claimableReward.token
          const rewardTokenAddress = rewardToken.address
          return (
            <CurrencyInputPanel
              key={rewardTokenAddress}
              value={typedAmount[rewardTokenAddress] || ''}
              onUserInput={input => {
                setTypedAmount({ ...typedAmount, [rewardTokenAddress]: input })
                const parsedAmount = tryParseAmount(input, rewardToken) as TokenAmount | undefined
                if (parsedAmount) {
                  onAmountChange(parsedAmount)
                }
              }}
              onMax={() => {
                setTypedAmount({ ...typedAmount, [rewardTokenAddress]: claimableReward.toExact() })
                onAmountChange(new TokenAmount(rewardToken, claimableReward.raw.toString()))
              }}
              showMaxButton
              currency={rewardToken}
              id={rewardTokenAddress}
              disableCurrencySelect
              customBalanceText="Claimable: "
              balance={claimableReward}
            />
          )
        })}
      </AutoColumn>
    </Root>
  )
}
