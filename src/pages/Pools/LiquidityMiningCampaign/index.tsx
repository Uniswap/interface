import React, { useMemo } from 'react'
import styled from 'styled-components'
import { Link, Redirect, RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../../components/NavigationTabs'
import { PageWrapper } from '../styleds'

import { TYPE } from '../../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../../components/Row'
import { AutoColumn } from '../../../components/Column'

import { useToken } from '../../../hooks/Tokens'
import { UndecoratedLink } from '../../../components/UndercoratedLink'
import DoubleCurrencyLogo from '../../../components/DoubleLogo'
import { PairState, usePair } from '../../../data/Reserves'
import LiquidityMiningCampaignView from '../../../components/Pool/LiquidityMiningCampaignView'
import { useLiquidityMiningCampaign } from '../../../hooks/useLiquidityMiningCampaign'
import Skeleton from 'react-loading-skeleton'
import { ResponsiveButtonPrimary, ResponsiveButtonSecondary } from '../../LiquidityMining/styleds'
import { useActiveWeb3React } from '../../../hooks'
import { useTokenBalance } from '../../../state/wallet/hooks'
import CurrencyLogo from '../../../components/CurrencyLogo'
import { useSingleSidedCampaign } from '../../../hooks/singleSidedStakeCampaigns/useSingleSidedCampaign'
import { Location } from 'history'

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 8px;
  `};
`

export default function LiquidityMiningCampaign({
  match: {
    params: { liquidityMiningCampaignId, currencyIdA, currencyIdB }
  },
  location
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; liquidityMiningCampaignId: string }>) {
  const { account } = useActiveWeb3React()

  const token0 = useToken(currencyIdA)
  const token1 = useToken(currencyIdB)
  const isSingleSidedCampaign = location.pathname.includes('/singleSidedStaking')

  const { singleSidedStakingCampaign, loading: SingleSidedCampaignLoader } = useSingleSidedCampaign(
    liquidityMiningCampaignId
  )

  const wrappedPair = usePair(token0 || undefined, token1 || undefined)
  const pairOrUndefined = useMemo(() => wrappedPair[1] || undefined, [wrappedPair])
  const { campaign, containsKpiToken, loading } = useLiquidityMiningCampaign(pairOrUndefined, liquidityMiningCampaignId)

  const lpTokenBalance = useTokenBalance(account || undefined, wrappedPair[1]?.liquidityToken)

  if (
    (token0 && token1 && (wrappedPair[0] === PairState.NOT_EXISTS || wrappedPair[0] === PairState.INVALID)) ||
    (wrappedPair[0] === PairState.INVALID && !token0 && !token1)
  ) {
    return <Redirect to="/rewards" />
  }
  const AddLiquidityButtonComponent =
    lpTokenBalance && lpTokenBalance.equalTo('0') ? ResponsiveButtonPrimary : ResponsiveButtonSecondary
  return (
    <PageWrapper>
      <SwapPoolTabs active={'pool'} />
      <AutoColumn gap="lg" justify="center">
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
            <Flex alignItems="center">
              <Box mr="8px">
                <UndecoratedLink to="/rewards">
                  <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px" color="text4">
                    Rewards
                  </TYPE.mediumHeader>
                </UndecoratedLink>
              </Box>
              <Box mr="8px">
                <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px" color="text4">
                  /
                </TYPE.mediumHeader>
              </Box>
              <Box mr="4px">
                {isSingleSidedCampaign ? (
                  <CurrencyLogo currency={token0 || undefined} />
                ) : (
                  <DoubleCurrencyLogo
                    loading={!token0 || !token1}
                    currency0={token0 || undefined}
                    currency1={token1 || undefined}
                    size={20}
                  />
                )}
              </Box>
              <Box>
                <TYPE.small color="text4" fontWeight="600" fontSize="16px" lineHeight="20px">
                  {isSingleSidedCampaign ? (
                    token0?.symbol
                  ) : !token0 || !token1 ? (
                    <Skeleton width="60px" />
                  ) : (
                    `${token0.symbol}/${token1.symbol}`
                  )}
                </TYPE.small>
              </Box>
            </Flex>
            <ButtonRow>
              <AddLiquidityButtonComponent
                as={Link}
                padding="8px 14px"
                to={(location: Location) => {
                  if (isSingleSidedCampaign && token0) {
                    return {
                      ...location,
                      pathname: `/swap/${token0.address}`
                    }
                  }

                  if (token0 && token1) {
                    return {
                      ...location,
                      pathname: `/swap/${token0.address}`
                    }
                  }

                  return ''
                }}
              >
                <Text fontWeight={700} fontSize={12}>
                  {isSingleSidedCampaign ? 'GET SWPR' : 'ADD LIQUIDITY'}
                </Text>
              </AddLiquidityButtonComponent>
            </ButtonRow>
          </TitleRow>
          {((!isSingleSidedCampaign && !loading) || (!SingleSidedCampaignLoader && isSingleSidedCampaign)) && (
            <LiquidityMiningCampaignView
              isSingleSidedStake={isSingleSidedCampaign}
              campaign={isSingleSidedCampaign ? singleSidedStakingCampaign : campaign}
              containsKpiToken={containsKpiToken}
            />
          )}
        </AutoColumn>
      </AutoColumn>
    </PageWrapper>
  )
}
