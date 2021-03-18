import { PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import React, { useState } from 'react'
import { Flex, Box } from 'rebass'
import { tryParseAmount } from '../../../../../state/swap/hooks'
import CurrencyInputPanel from '../../../../CurrencyInputPanel'

interface ConfirmStakeModalHeaderProps {
  claimableRewards: PricedTokenAmount[]
  onAmountChange: (newAmount: TokenAmount) => void
}

export default function ConfirmClaimModalHeader({ claimableRewards, onAmountChange }: ConfirmStakeModalHeaderProps) {
  const [typedAmount, setTypedAmount] = useState<{ [rewardTokenAddress: string]: string }>({})

  return (
    <Flex flexDirection="column" alignItems="center" mt="20px">
      {claimableRewards.map(claimableReward => {
        const rewardToken = claimableReward.token
        const rewardTokenAddress = rewardToken.address
        return (
          <Box width="100%" key={rewardTokenAddress}>
            <CurrencyInputPanel
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
          </Box>
        )
      })}
    </Flex>
  )
}
