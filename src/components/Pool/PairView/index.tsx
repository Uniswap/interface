import React from 'react'
import { Box, Flex, Text } from 'rebass'
import { JSBI, Pair, Percent } from 'dxswap-sdk'
import { DarkCard } from '../../Card'
import DoubleCurrencyLogo from '../../DoubleLogo'
import Loading from './Loading'
import { usePair24hVolumeUSD, usePairLiquidityUSD } from '../../../hooks/usePairData'
import styled from 'styled-components'
import FullPositionCard from '../../PositionCard'

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

interface PairViewProps {
  loading: boolean
  pair?: Pair | null
}

export default function PairView({ loading, pair }: PairViewProps) {
  const { loading: volumeLoading, volume24hUSD } = usePair24hVolumeUSD(pair)
  const { loading: liquidityLoading, liquidityUSD } = usePairLiquidityUSD(pair)

  return (
    <DarkCard padding="40px">
      {loading || volumeLoading || liquidityLoading || !pair ? (
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
          <Flex justifyContent="space-between" mb="8px">
            <Box>Liquidity:</Box>
            <Box>${liquidityUSD.decimalPlaces(2).toString()}</Box>
          </Flex>
          <Flex justifyContent="space-between" mb="11px">
            <Box>Volume:</Box>
            <Box>${volume24hUSD.decimalPlaces(2).toString()}</Box>
          </Flex>
          <Flex justifyContent="space-between" mb="18px">
            <Box>Pool fees:</Box>
            <Flex>
              <Box>
                <PoolFeesContainer>
                  {pair ? new Percent(JSBI.BigInt(pair.swapFee.toString()), JSBI.BigInt(10000)).toSignificant(3) : '0'}%
                </PoolFeesContainer>
              </Box>
            </Flex>
          </Flex>
          <Box>
            <FullPositionCard pair={pair} showUnwrapped />
          </Box>
        </Flex>
      )}
    </DarkCard>
  )
}
