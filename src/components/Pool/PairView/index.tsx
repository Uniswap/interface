import React, { memo, ReactNode } from 'react'
import { Box, Flex, Text } from 'rebass'
import { Link } from 'react-router-dom'
import { JSBI, Pair, Percent } from 'dxswap-sdk'
import { DarkCard } from '../../Card'
import DoubleCurrencyLogo from '../../DoubleLogo'
import Loading from './Loading'
import {
  useLiquidityMiningCampaignsForPair,
  usePair24hVolumeUSD,
  usePairLiquidityUSD
} from '../../../hooks/usePairData'
import styled from 'styled-components'
import FullPositionCard from '../../PositionCard'
import { AutoRow, RowBetween } from '../../Row'
import { ButtonGrey } from '../../Button'
import { TYPE } from '../../../theme'
import LiquidityMiningCampaignsList from './LiquidityMiningCampaignsList'
import { ResponsiveButtonPrimary, TitleRow } from '../../../pages/LiquidityMining/styleds'

const StyledDarkCard = styled(DarkCard)`
  ::before {
    background: ${props => props.theme.bg1};
  }
`

const PoolFeesContainer = styled.div`
  height: 27px;
  padding-left: 14px;
  padding-right: 14px;
  display: flex;
  align-items: center;
  border: 1.2px solid ${props => props.theme.bg3};
  border-radius: 8px;
  font-size: 12px;
  line-height: 15px;
  letter-spacing: 0.08em;
  text-align: left;
`

const DataText = styled.div`
  font-size: 14px;
  line-height: 17px;
  font-weight: 500;
  color: ${props => props.theme.purple2};
`

interface DataRowProps {
  title: string
  value: ReactNode
}

function DataRow({ title, value }: DataRowProps) {
  return (
    <AutoRow justify="space-between" width="100%" marginBottom="8px">
      <DataText>{title}</DataText>
      <DataText>{value}</DataText>
    </AutoRow>
  )
}

interface PairViewProps {
  loading: boolean
  pair?: Pair | null
}

function PairView({ loading, pair }: PairViewProps) {
  const { loading: volumeLoading, volume24hUSD } = usePair24hVolumeUSD(pair)
  const { loading: liquidityLoading, liquidityUSD } = usePairLiquidityUSD(pair)
  // avoids reference changes and in turn continuously fetching liquidity mining campaigns for the pair
  const { loading: liquidityMiningCampaignsLoading, liquidityMiningCampaigns } = useLiquidityMiningCampaignsForPair(
    pair || undefined
  )

  return (
    <>
      <StyledDarkCard padding="40px">
        {loading || volumeLoading || liquidityLoading || liquidityMiningCampaignsLoading ? (
          <Flex flexDirection="column" width="100%" height="560px">
            <Loading />
          </Flex>
        ) : (
          <Flex flexDirection="column">
            <Flex mb="18px" alignItems="center">
              <Box mr="8px">
                <DoubleCurrencyLogo size={20} currency0={pair?.token0} currency1={pair?.token1} />
              </Box>
              <Box>
                <Text fontSize="16px" fontWeight="600" lineHeight="20px">
                  {pair?.token0.symbol}/{pair?.token1.symbol}
                </Text>
              </Box>
            </Flex>
            <DataRow title="Liquidity:" value={`$${liquidityUSD.decimalPlaces(2).toString()}`} />
            <DataRow title="Volume:" value={`$${volume24hUSD.decimalPlaces(2).toString()}`} />
            <DataRow
              title="Pool fees:"
              value={
                <PoolFeesContainer>
                  {pair ? new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000)).toSignificant(3) : '0'}%
                </PoolFeesContainer>
              }
            />
            {pair && (
              <Box mt="18px">
                <FullPositionCard pair={pair} />
              </Box>
            )}
            <RowBetween marginY="18px">
              <ButtonGrey
                padding="8px"
                disabled
                style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
                width="100%"
              >
                GOVERNANCE
              </ButtonGrey>
            </RowBetween>
            <Flex flexDirection="column">
              <TitleRow marginBottom="26px">
                <TYPE.mediumHeader fontSize="18px" color="white">
                  Reward pools
                </TYPE.mediumHeader>
                <ResponsiveButtonPrimary as={Link} padding="8px 14px" to="/liquidity-mining/create">
                  Create liq. mining
                </ResponsiveButtonPrimary>
              </TitleRow>
              <LiquidityMiningCampaignsList items={liquidityMiningCampaigns} stakablePair={pair || undefined} />
            </Flex>
          </Flex>
        )}
      </StyledDarkCard>
    </>
  )
}

export default memo(PairView, (previousProps, nextProps) => {
  // avoids pair reference changes to mess things up by reloading the whole thing
  // (which means that if the staking modal is open, it will be closed = bad)
  const sameLoading = previousProps.loading === nextProps.loading
  if (previousProps.pair === nextProps.pair) {
    return sameLoading
  } else if ((!previousProps.pair && nextProps.pair) || (previousProps.pair && !nextProps.pair)) {
    return false
  } else {
    return !!(previousProps.pair && nextProps.pair && previousProps.pair.equals(nextProps.pair) && sameLoading)
  }
})
