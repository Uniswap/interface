import { gql, useQuery } from '@apollo/client'

import { Token, SingleSidedLiquidityMiningCampaign } from '@swapr/sdk'

import { useMemo } from 'react'

import { useActiveWeb3React } from '..'
import { SubgraphSingleSidedStakingCampaign } from '../../apollo'

import { toSingleSidedStakeCampaign } from '../../utils/liquidityMining'
import { useNativeCurrency } from '../useNativeCurrency'

const QUERY = gql`
  query($campaignAddress: ID) {
    singleSidedStakingCampaign(id: $campaignAddress) {
      id
      owner
      startsAt
      endsAt
      duration
      locked
      stakeToken {
        id
        symbol
        name
        decimals
        totalSupply
        derivedNativeCurrency
      }
      rewards {
        token {
          address: id
          name
          symbol
          decimals
          derivedNativeCurrency
        }
        amount
      }
      stakedAmount
      stakingCap
    }
  }
`

export function useSingleSidedCampaign(
  campaginAddress: string
): {
  loading: boolean
  singleSidedStakingCampaign: SingleSidedLiquidityMiningCampaign | undefined
} {
  //const hardcodedShit = '0x26358e62c2eded350e311bfde51588b8383a9315'
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()
  const { data, loading, error } = useQuery<{
    singleSidedStakingCampaign: SubgraphSingleSidedStakingCampaign
  }>(QUERY, {
    variables: {
      campaignAddress: campaginAddress.toLowerCase()
    }
  })
  return useMemo(() => {
    if (loading || chainId === undefined) {
      return { loading: true, singleSidedStakingCampaign: undefined }
    }
    if (error || !data || !data.singleSidedStakingCampaign) {
      return { loading: false, singleSidedStakingCampaign: undefined }
    }
    const wrapped = data.singleSidedStakingCampaign
    const stakeToken = new Token(
      chainId,
      wrapped.stakeToken.id,
      parseInt(wrapped.stakeToken.decimals),
      wrapped.stakeToken.symbol,
      wrapped.stakeToken.name
    )

    const singleSidedStakeCampaign = toSingleSidedStakeCampaign(
      chainId,
      wrapped,
      stakeToken,
      wrapped.stakeToken.totalSupply,
      nativeCurrency,
      wrapped.stakeToken.derivedNativeCurrency
    )

    return {
      loading: false,
      singleSidedStakingCampaign: singleSidedStakeCampaign
    }
  }, [data, loading, error, chainId, nativeCurrency])
}
