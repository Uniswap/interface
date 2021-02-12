import React, { ReactNode } from 'react'
import { Box, Flex, Text } from 'rebass'
import { JSBI, Pair, Percent } from 'dxswap-sdk'
import { DarkCard } from '../../Card'
import DoubleCurrencyLogo from '../../DoubleLogo'
import Loading from './Loading'
import {
  useLiquidityMiningCampaignsForPairs,
  usePair24hVolumeUSD,
  usePairLiquidityUSD
} from '../../../hooks/usePairData'
import styled from 'styled-components'
import FullPositionCard from '../../PositionCard'
import { AutoRow } from '../../Row'
import { LiquidityMiningCampaign } from './LiquidityMiningCampaign'
import useDebounce from '../../../hooks/useDebounce'

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

export default function PairView({ loading, pair }: PairViewProps) {
  const { loading: volumeLoading, volume24hUSD } = usePair24hVolumeUSD(pair)
  const { loading: liquidityLoading, liquidityUSD } = usePairLiquidityUSD(pair)
  const { loading: liquidityMiningCampaignsLoading, liquidityMiningCampaigns } = useLiquidityMiningCampaignsForPairs(
    pair ? [pair] : []
  )

  const debouncedLoading = useDebounce(
    loading || volumeLoading || liquidityLoading || liquidityMiningCampaignsLoading,
    300
  )

  return (
    <DarkCard padding="40px">
      {debouncedLoading ? (
        <Flex flexDirection="column" width="100%" height="340px">
          <Loading />
        </Flex>
      ) : (
        <Flex flexDirection="column">
          <Flex mb="18px" alignItems="center">
            <Box mr="8px">
              <DoubleCurrencyLogo size={26} currency0={pair?.token0} currency1={pair?.token1} />
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
          <Flex flexDirection="column" my="24px">
            {liquidityMiningCampaigns.length === 1
              ? liquidityMiningCampaigns[0].map((liquidityMiningCampaign, index) => (
                  <Box key={index}>
                    <LiquidityMiningCampaign duration={1} />
                  </Box>
                ))
              : null}
          </Flex>
          {pair && (
            <Box>
              <FullPositionCard pair={pair} />
            </Box>
          )}
        </Flex>
      )}
    </DarkCard>
  )
}
