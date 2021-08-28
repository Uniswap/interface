import { Trans } from '@lingui/macro'
import Badge from 'components/Badge'
import { ButtonGreySmall } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import IncentiveInfoBar from 'components/earn/IncentiveInfoBar'
import PositionManageCard from 'components/earn/PositionManageCard'
import Loader from 'components/Loader'
import { RowBetween, RowFixed } from 'components/Row'
import { useIncentivesForPool } from 'hooks/incentives/useAllIncentives'
import { usePoolsByAddresses } from 'hooks/usePools'
import useTheme from 'hooks/useTheme'
import { useV3PositionsForPool } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { LoadingRows } from 'pages/Pool/styleds'
import { AlertCircle } from 'react-feather'
import { Link, RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components/macro'
import { HoverText, TYPE } from 'theme'
import { formattedFeeAmount } from 'utils'
import { currencyId } from 'utils/currencyId'
import { unwrappedToken } from 'utils/unwrappedToken'

const Wrapper = styled.div`
  max-width: 840px;
  width: 100%;
`

export default function Manage({
  match: {
    params: { poolAddress },
  },
}: RouteComponentProps<{ poolAddress: string }>) {
  const theme = useTheme()
  const { account, chainId } = useActiveWeb3React()

  const [, pool] = usePoolsByAddresses([poolAddress])[0]

  const currency0 = pool ? unwrappedToken(pool.token0) : undefined
  const currency1 = pool ? unwrappedToken(pool.token1) : undefined

  // all incentive programs for this pool
  const { loading, incentives } = useIncentivesForPool(poolAddress)

  // all users positions for this pool
  const { loading: loadingPositions, positions } = useV3PositionsForPool(account, pool)

  if (!pool || !currency0 || !currency1 || loading) {
    return (
      <Wrapper>
        <LoadingRows>
          <div />
          <div />
          <div />
        </LoadingRows>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      <AutoColumn gap="24px">
        <RowFixed>
          <TYPE.body color={theme.text3} mr="4px" fontWeight={500}>
            <Link style={{ textDecoration: 'none' }} to="/stake">
              <HoverText color={theme.text3}>
                <Trans>Stake</Trans>
              </HoverText>
            </Link>
          </TYPE.body>
          <TYPE.body color={theme.text3} fontWeight={500}>
            {` >  ${currency0.symbol} / ${currency1.symbol} ${formattedFeeAmount(pool.fee)}%`}
          </TYPE.body>
        </RowFixed>
        <RowBetween>
          <RowFixed>
            <DoubleCurrencyLogo margin={true} currency0={currency0} currency1={currency1} size={24} />
            <TYPE.body fontWeight={600} fontSize="24px" m="0 8px">
              {`${currency0.symbol} / ${currency1.symbol} Pool`}
            </TYPE.body>
            <Badge>{formattedFeeAmount(pool.fee)}%</Badge>
          </RowFixed>
          <RowFixed>
            {chainId === 1 ? (
              <ButtonGreySmall>
                <Trans>View Analytics ↗</Trans>
              </ButtonGreySmall>
            ) : null}
            <ButtonGreySmall
              style={{ marginLeft: '8px' }}
              as={Link}
              to={`/add/${currencyId(currency0)}/${currencyId(currency1)}/${pool.fee}`}
            >
              <Trans>Add Liquidity</Trans>
            </ButtonGreySmall>
          </RowFixed>
        </RowBetween>
        {!incentives ? (
          <TYPE.body>No incentives on this pool yet </TYPE.body>
        ) : (
          incentives.slice(0, 1).map((incentive) => (
            <DarkGreyCard key={incentive.poolAddress} padding="24px">
              <IncentiveInfoBar incentive={incentive} expanded={true} />
            </DarkGreyCard>
          ))
        )}
        <AutoColumn gap="16px">
          <TYPE.body fontWeight={600} fontSize="18px">
            <Trans>Your Positions</Trans>
          </TYPE.body>
          {loadingPositions ? (
            <Loader />
          ) : !positions ? (
            <TYPE.body>No positions on this pool</TYPE.body>
          ) : (
            positions.map((p, i) => <PositionManageCard key={'position-manage-' + i} positionDetails={p} />)
          )}
        </AutoColumn>
        <DarkGreyCard>
          <RowBetween>
            <AlertCircle size={32} />
            <TYPE.body ml="8px" fontSize="12px">
              <Trans>
                Boosting liquidity deposits your liquidity in the Uniswap Liquidity mining contracts. When boosted, your
                liquidity will continue to earn fees while in range. You must remove boosts to be able to claim fees or
                withdraw liquidity.
              </Trans>
            </TYPE.body>
          </RowBetween>
        </DarkGreyCard>
      </AutoColumn>
    </Wrapper>
  )
}
