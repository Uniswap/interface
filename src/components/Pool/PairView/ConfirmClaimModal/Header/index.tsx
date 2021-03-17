import { PricedTokenAmount, TokenAmount } from 'dxswap-sdk'
import React from 'react'
import { Flex, Box } from 'rebass'
import { tryParseAmount } from '../../../../../state/swap/hooks'
import CurrencyInputPanel from '../../../../CurrencyInputPanel'

interface ConfirmStakeModalHeaderProps {
  claimableRewards: PricedTokenAmount[]
  claimedRewards: { [claimedTokenAddress: string]: TokenAmount }
  onAmountChange: (newAmount: TokenAmount) => void
}

export default function ConfirmClaimModalHeader({
  claimableRewards,
  claimedRewards,
  onAmountChange
}: ConfirmStakeModalHeaderProps) {
  return (
    <Flex flexDirection="column" alignItems="center" mt="20px">
      {claimableRewards.map(claimableReward => {
        const rewardToken = claimableReward.token
        const rewardTokenAddress = rewardToken.address
        const claimedValue = claimedRewards[rewardTokenAddress]?.toExact() ?? '0'
        return (
          <Box width="100%" key={rewardTokenAddress}>
            <CurrencyInputPanel
              value={claimedValue}
              onUserInput={input => {
                const parsedAmount = tryParseAmount(input) as TokenAmount | undefined
                onAmountChange(parsedAmount ?? new TokenAmount(rewardToken, '0'))
              }}
              onMax={() => {
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
