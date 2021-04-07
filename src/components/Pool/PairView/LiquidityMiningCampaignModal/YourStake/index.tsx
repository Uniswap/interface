import { PricedTokenAmount, Pair } from 'dxswap-sdk'
import React from 'react'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { TYPE } from '../../../../../theme'
import { AutoColumn } from '../../../../Column'
import CurrencyLogo from '../../../../CurrencyLogo'
import DoubleCurrencyLogo from '../../../../DoubleLogo'
import Row from '../../../../Row'
import DataRow from '../DataRow'

const Divider = styled.div`
  height: 100%;
  width: 1px;
  background: ${props => props.theme.bg5};
`

interface LiquidityMiningYourStakeProps {
  stake?: PricedTokenAmount
  claimables?: PricedTokenAmount[]
  targetedPair?: Pair
}

export default function LiquidityMiningYourStake({ stake, claimables, targetedPair }: LiquidityMiningYourStakeProps) {
  return (
    <AutoColumn gap="12px">
      <TYPE.body color="white" lineHeight="20px" fontWeight="600">
        Your position
      </TYPE.body>
      <Flex flexDirection={['column', 'row']}>
        <Box flex="1">
          <DataRow
            title="Stake size"
            value={
              stake ? (
                <Row>
                  {stake.toSignificant(3)}{' '}
                  <DoubleCurrencyLogo
                    marginLeft={4}
                    currency0={targetedPair?.token0}
                    currency1={targetedPair?.token1}
                  />
                </Row>
              ) : (
                '0'
              )
            }
          />
        </Box>
        <Box display={['none', 'flex']} mx="18px">
          <Divider />
        </Box>
        <Box flex="1">
          <DataRow
            title="Rewards"
            value={
              claimables && claimables.length > 0 ? (
                <AutoColumn gap="4px" justify="flex-end">
                  {claimables.map(claimable => (
                    <Row alignItems="center" justifyContent="flex-end" key={claimable.token.address}>
                      {claimable.toSignificant(5)}
                      <CurrencyLogo marginLeft={4} size="14px" currency={claimable.token} />
                    </Row>
                  ))}
                </AutoColumn>
              ) : (
                '0'
              )
            }
          />
        </Box>
      </Flex>
    </AutoColumn>
  )
}
