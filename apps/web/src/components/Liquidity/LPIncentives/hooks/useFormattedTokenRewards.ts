import { Token } from '@uniswap/sdk-core'
import { formatTokenAmount } from 'components/Liquidity/LPIncentives/utils/formatTokenAmount'
import { useMemo } from 'react'

interface UseFormattedTokenRewardsProps {
  tokenRewards: string
  token: Token
}

export function useFormattedTokenRewards({ tokenRewards, token }: UseFormattedTokenRewardsProps) {
  return useMemo(() => {
    return formatTokenAmount(tokenRewards, token.decimals)
  }, [tokenRewards, token.decimals])
}
