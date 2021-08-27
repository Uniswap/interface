import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { Incentive } from '../../hooks/incentives/useAllIncentives'
import { usePoolsByAddresses } from 'hooks/usePools'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { LoadingRows } from 'pages/Pool/styleds'
import Badge, { GreenBadge, BlueBadge } from 'components/Badge'
import { formattedFeeAmount } from 'utils'
import { CardWrapper } from './styled'
import IncentiveInfoBar from './IncentiveInfoBar'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ButtonSmall } from 'components/Button'
import { Link } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks/web3'
import { useV3PositionsForPool } from 'hooks/useV3Positions'
import { useMemo } from 'react'
import { BigNumber } from 'ethers'

const ProgramsWrapper = styled.div`
  background: rgba(255, 255, 255, 0.04);
  padding: 8px;
  border-radius: 12px;
`

interface ProgramCardProps {
  poolAddress: string
  incentives: Incentive[] // will be set at 1 incentive while UNI incentives only
  hideStake?: boolean // hide stake button on manage page
}

// Overview all all incentive programs for a given pool
export default function ProgramCard({ poolAddress, incentives, hideStake = false }: ProgramCardProps) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const [, pool] = usePoolsByAddresses([poolAddress])[0]

  const currency0 = pool ? unwrappedToken(pool.token0) : undefined
  const currency1 = pool ? unwrappedToken(pool.token1) : undefined

  const { positions } = useV3PositionsForPool(account, pool)

  const [amountBoosted, amountAvailable] = useMemo(() => {
    if (!positions) {
      return [0, 0]
    }
    // loop through all stakes - count # where liquidity is > 0
    return positions.reduce(
      (accum, position) => {
        position.stakes.map((stake) => {
          if (incentives.includes(stake.incentive) && stake.liquidity.gt(BigNumber.from(0))) {
            accum[0]++
          } else {
            accum[1]++
          }
        })
        return accum
      },
      [0, 0]
    )
  }, [incentives, positions])

  return (
    <CardWrapper>
      {!pool || !currency0 || !currency1 ? (
        <LoadingRows>
          <div />
        </LoadingRows>
      ) : (
        <AutoColumn gap="24px">
          <RowBetween>
            <RowFixed>
              <DoubleCurrencyLogo margin={true} currency0={currency0} currency1={currency1} size={24} />
              <TYPE.body fontWeight={600} fontSize="24px" m="0 8px">
                {`${currency0.symbol} / ${currency1.symbol}`}
              </TYPE.body>
              <Badge>{formattedFeeAmount(pool.fee)}%</Badge>
            </RowFixed>
            <AutoRow gap="6px" width="fit-content">
              {amountBoosted > 0 ? (
                <BlueBadge>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.blue3}>
                    {amountBoosted} <Trans>Boosted</Trans>
                  </TYPE.body>
                </BlueBadge>
              ) : null}
              {amountAvailable > 0 ? (
                <GreenBadge>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.green2}>
                    {amountAvailable} <Trans>Available</Trans>
                  </TYPE.body>
                </GreenBadge>
              ) : null}
              {hideStake ? null : (
                <ButtonSmall as={Link} to={'/stake/' + poolAddress}>
                  <Trans>Manage</Trans>
                </ButtonSmall>
              )}
            </AutoRow>
          </RowBetween>
          <AutoColumn gap="12px">
            <ProgramsWrapper>
              {incentives
                .map((incentive, i) => (
                  <IncentiveInfoBar
                    incentive={incentive}
                    key={
                      incentive.poolAddress +
                      '-' +
                      incentive.rewardAmountRemaining.currency.address +
                      i +
                      '-incentive-bar'
                    }
                  />
                ))
                .slice(0, 1)}
            </ProgramsWrapper>
          </AutoColumn>
        </AutoColumn>
      )}
    </CardWrapper>
  )
}
