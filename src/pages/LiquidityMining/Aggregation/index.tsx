import React, { useEffect, useState } from 'react'
import { TYPE } from '../../../theme'
import { PageWrapper, ResponsiveButtonPrimary, TitleRow } from '../styleds'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import DistributionsPerAssetList from '../../../components/LiquidityMining/DistributionsPerAssetList'
import { AutoRow } from '../../../components/Row'
import { useQuery } from '@apollo/client'
import {
  DistributionsPerAssetQueryResult,
  Distribution,
  Reward,
  ParsedPerAssetData
} from '../../../components/LiquidityMining/DistributionsPerAssetList/index.d'
import BigNumber from 'bignumber.js'
import { ChainId, Token } from 'dxswap-sdk'
import { GET_DISTRIBUTIONS_BY_AGGREGATION } from '../../../apollo/queries'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from '../../../components/CurrencyLogo'

export default function LiquidityMiningAggregation({
  match: {
    params: { aggregationId }
  }
}: RouteComponentProps<{ aggregationId: string }>) {
  const { chainId } = useWeb3React()
  const { t } = useTranslation()

  const { loading, error, data: rawDistributionsPerAsset } = useQuery<DistributionsPerAssetQueryResult>(
    GET_DISTRIBUTIONS_BY_AGGREGATION,
    {
      variables: {
        id: aggregationId
      }
    }
  )
  const [relatedToken, setRelatedToken] = useState<Token | null>(null)
  const [distributionsPerAsset, setDistributionsPerAsset] = useState<ParsedPerAssetData[]>([])

  // TODO: make this into a hook to clean up component
  useEffect(() => {
    if (!rawDistributionsPerAsset || loading || error) {
      return
    }
    const ethPrice = new BigNumber(rawDistributionsPerAsset.bundles[0].ethPrice)
    const token0 = rawDistributionsPerAsset.aggregatedToken0DistributionData.token0
    setRelatedToken(token0)
    const parsedDistributionsPerAsset = rawDistributionsPerAsset.aggregatedToken0DistributionData.distributions.reduce(
      (accumulator: ParsedPerAssetData[], distribution: Distribution) => {
        const distributionRewardsEth = distribution.rewards.reduce(
          (rewardEth: BigNumber, reward: Reward) =>
            rewardEth.plus(new BigNumber(reward.amount).multipliedBy(reward.token.derivedETH)),
          new BigNumber(0)
        )
        const token1 = distribution.stakablePair.token1
        accumulator.push({
          id: distribution.id,
          token0: new Token(chainId || ChainId.MAINNET, token0.address, token0.decimals, token0.symbol),
          token1: new Token(chainId || ChainId.MAINNET, token1.address, token1.decimals, token1.symbol),
          usdRewards: distributionRewardsEth.multipliedBy(ethPrice)
        })
        return accumulator
      },
      []
    )
    setDistributionsPerAsset(parsedDistributionsPerAsset)
  }, [chainId, error, loading, rawDistributionsPerAsset])

  return (
    <PageWrapper gap="32px">
      <TitleRow>
        <AutoRow gap="4px">
          <TYPE.mediumHeader color="text4" lineHeight="24px">
            {t('liquidityMining.title')}
          </TYPE.mediumHeader>
          <TYPE.mediumHeader color="text4" lineHeight="24px">
            /
          </TYPE.mediumHeader>
          <CurrencyLogo currency={relatedToken || undefined} />
          <TYPE.mediumHeader lineHeight="24px">{relatedToken ? relatedToken.symbol : ''}</TYPE.mediumHeader>
        </AutoRow>
        <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
          <Text fontWeight={700} fontSize={12}>
            {t('liquidityMining.action.create')}
          </Text>
        </ResponsiveButtonPrimary>
      </TitleRow>
      <DistributionsPerAssetList distributions={distributionsPerAsset} />
    </PageWrapper>
  )
}
