import React, { ReactNode } from 'react'
import { Box, Flex, Text } from 'rebass'
import { Pair } from 'dxswap-sdk'
import { DarkCard } from '../../Card'
import DoubleCurrencyLogo from '../../DoubleLogo'
import styled from 'styled-components'
import FullPositionCard from '../../PositionCard'
import { RowBetween } from '../../Row'
import { ButtonGrey } from '../../Button'
import { useLiquidityMiningFeatureFlag } from '../../../hooks/useLiquidityMiningFeatureFlag'
import Skeleton from 'react-loading-skeleton'
import { usePair24hVolumeUSD } from '../../../hooks/usePairVolume24hUSD'
import { usePairLiquidityUSD } from '../../../hooks/usePairLiquidityUSD'
import LiquidityMiningCampaigns from './LiquidityMiningCampaigns'
import { useActiveWeb3React } from '../../../hooks'
import { commify } from 'ethers/lib/utils'

const StyledDarkCard = styled(DarkCard)`
  ::before {
    background: ${props => props.theme.bg1};
  }
`

const DataText = styled.div`
  font-size: 14px;
  line-height: 17px;
  font-weight: 500;
  color: ${props => props.theme.purple2};
`

interface DataRowProps {
  loading?: boolean
  title: string
  value: ReactNode
}

function DataRow({ title, value, loading }: DataRowProps) {
  return (
    <RowBetween justify="space-between" width="100%" marginBottom="8px">
      <DataText>{title}</DataText>
      <DataText>{loading ? <Skeleton width="36px" /> : value}</DataText>
    </RowBetween>
  )
}

interface PairViewProps {
  loading: boolean
  pair?: Pair | null
}

function PairView({ loading, pair }: PairViewProps) {
  const { account } = useActiveWeb3React()
  const { loading: volumeLoading, volume24hUSD } = usePair24hVolumeUSD(pair)
  const { loading: liquidityLoading, liquidityUSD } = usePairLiquidityUSD(pair)
  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()

  const overallLoading = loading || volumeLoading || liquidityLoading

  return (
    <>
      <StyledDarkCard padding="32px">
        <Flex flexDirection="column">
          <Flex mb="18px" alignItems="center">
            <Box mr="8px">
              <DoubleCurrencyLogo
                loading={overallLoading}
                size={20}
                currency0={pair?.token0}
                currency1={pair?.token1}
              />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="600" lineHeight="20px">
                {pair ? `${pair?.token0.symbol}/${pair?.token1.symbol}` : <Skeleton width="60px" />}
              </Text>
            </Box>
          </Flex>
          <DataRow loading={overallLoading} title="Liquidity:" value={`$${commify(liquidityUSD.toSignificant(2))}`} />
          <DataRow loading={overallLoading} title="Volume:" value={`$${commify(volume24hUSD.toSignificant(2))}`} />
          {!!account && (
            <Box mt="18px">
              <FullPositionCard pair={pair || undefined} />
            </Box>
          )}
          <RowBetween mt="18px">
            <ButtonGrey
              padding="8px"
              disabled
              style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '15px' }}
              width="100%"
            >
              GOVERNANCE
            </ButtonGrey>
          </RowBetween>
        </Flex>
      </StyledDarkCard>
      {liquidityMiningEnabled && <LiquidityMiningCampaigns pair={pair || undefined} />}
    </>
  )
}

export default PairView
