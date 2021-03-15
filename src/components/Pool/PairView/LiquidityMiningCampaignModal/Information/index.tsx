import { LiquidityMiningCampaign } from 'dxswap-sdk'
import { DateTime } from 'luxon'
import React from 'react'
import Skeleton from 'react-loading-skeleton'
import { Box, Flex } from 'rebass'
import styled from 'styled-components'
import { useNativeCurrencyUSDPrice } from '../../../../../hooks/useNativeCurrencyUSDPrice'
import { getRemainingRewardsUSD } from '../../../../../utils/liquidityMining'
import Countdown from '../../../../Countdown'
import CurrencyLogo from '../../../../CurrencyLogo'
import { RowBetween } from '../../../../Row'
import ApyBadge from '../../../ApyBadge'
import DataRow from '../DataRow'

const Divider = styled.div`
  height: 100%;
  width: 1px;
  background: ${props => props.theme.bg5};
`

interface LiquidityMiningInformationProps {
  campaign: LiquidityMiningCampaign
}

export default function LiquidityMiningInformation({ campaign }: LiquidityMiningInformationProps) {
  const { currentlyActive, locked, startsAt, endsAt, apy } = campaign
  const { loading: loadingNativeCurrencyUSDPrice, nativeCurrencyUSDPrice } = useNativeCurrencyUSDPrice()

  return (
    <Flex justifyContent="stretch" width="100%">
      <Flex flexDirection="column" flex="1">
        <DataRow title="APY" value={<ApyBadge apy={apy} />} />
        {currentlyActive && <DataRow title="Time left" value={<Countdown to={parseInt(endsAt.toString())} />} />}
        <DataRow
          title="Rewards left"
          value={campaign.remainingRewards.map(remainingReward => (
            <RowBetween key={remainingReward.token.address}>
              {remainingReward.toSignificant(3)}
              <CurrencyLogo size="14px" currency={remainingReward.token} />
            </RowBetween>
          ))}
        />
        <DataRow
          title="Rewards left (USD)"
          value={
            loadingNativeCurrencyUSDPrice ? (
              <Skeleton width="60px" />
            ) : (
              `$${getRemainingRewardsUSD(campaign, nativeCurrencyUSDPrice).toFixed(2)}`
            )
          }
        />
      </Flex>
      <Box mx="18px">
        <Divider />
      </Box>
      <Flex flexDirection="column" flex="1">
        <DataRow
          title="Starts at"
          value={DateTime.fromSeconds(parseInt(startsAt.toString())).toFormat('dd-MM-yyyy hh:mm')}
        />
        <DataRow
          title="Ends at"
          value={DateTime.fromSeconds(parseInt(endsAt.toString())).toFormat('dd-MM-yyyy hh:mm')}
        />
        <DataRow title="Timelock" value={locked ? 'ON' : 'OFF'} />
        <DataRow title="Max pool size" value="UNLIMITED" />
      </Flex>
    </Flex>
  )
}
