import { RowFixed } from 'components/Row'
import { TYPE } from 'theme'
import { Incentive } from '../../hooks/incentives/useAllIncentives'
import { usePoolsByAddresses } from 'hooks/usePools'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { LoadingRows } from 'pages/Pool/styleds'
import Badge, { GreenBadge, BlueBadge } from 'components/Badge'
import { formattedFeeAmount } from 'utils'
import { CardWrapper } from './styled'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ButtonSmall } from 'components/Button'
import { Link } from 'react-router-dom'
import { useActiveWeb3React } from 'hooks/web3'
import { useV3PositionsForPool } from 'hooks/useV3Positions'
import { useMemo } from 'react'
import { BigNumber } from 'ethers'
import { OverviewGrid } from './styled'
import { BIG_INT_SECONDS_IN_WEEK } from 'constants/misc'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import CurrencyLogo from 'components/CurrencyLogo'

interface ProgramCardProps {
  poolAddress: string
  incentives: Incentive[] // will be set at 1 incentive while UNI incentives only
  hideStake?: boolean // hide stake button on manage page
}

// Overview all all incentive programs for a given pool
export default function ProgramCard({ poolAddress, incentives }: ProgramCardProps) {
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

  /**
   * @todo
   */
  const rewardCurrency = incentives[0].initialRewardAmount.currency
  const activeLiquidity = incentives[0].initialRewardAmount
  const activeLiquidityUSD = useUSDCValue(activeLiquidity)
  const rewardPerDay = incentives[0].rewardRatePerSecond.multiply(BIG_INT_SECONDS_IN_WEEK)

  return (
    <CardWrapper>
      {!pool || !currency0 || !currency1 ? (
        <LoadingRows>
          <div />
        </LoadingRows>
      ) : (
        <OverviewGrid>
          <RowFixed justifySelf="flex-start">
            <DoubleCurrencyLogo margin={true} currency0={currency0} currency1={currency1} size={20} />
            <TYPE.body fontWeight={600} fontSize="20px" m="0 8px">
              {`${currency0.symbol} / ${currency1.symbol}`}
            </TYPE.body>
            <Badge>{formattedFeeAmount(pool.fee)}%</Badge>
            <RowFixed>
              {amountBoosted > 0 ? (
                <BlueBadge>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.blue3}>
                    {amountBoosted} <Trans>Boosted</Trans>
                  </TYPE.body>
                </BlueBadge>
              ) : null}
              {amountAvailable > 0 ? (
                <GreenBadge style={{ marginLeft: '8px' }}>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.green2}>
                    {amountAvailable} <Trans>Available</Trans>
                  </TYPE.body>
                </GreenBadge>
              ) : null}
            </RowFixed>
          </RowFixed>
          <TYPE.body fontWeight={600}>
            {activeLiquidityUSD
              ? `$${formatCurrencyAmount(activeLiquidityUSD, 2)}`
              : `${formatCurrencyAmount(activeLiquidity, 4)} ${rewardCurrency.symbol}`}
          </TYPE.body>
          <RowFixed>
            <CurrencyLogo currency={rewardCurrency} size={'16px'} />
            <TYPE.body fontWeight={600} ml="6px">{`${formatCurrencyAmount(rewardPerDay, 4)} ${
              rewardCurrency.symbol
            } / day`}</TYPE.body>
          </RowFixed>
          <ButtonSmall as={Link} to={'/stake/' + poolAddress}>
            <Trans>Manage</Trans>
          </ButtonSmall>
        </OverviewGrid>
      )}
    </CardWrapper>
  )
}
