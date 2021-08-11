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
import { Break, CardWrapper } from './styled'
import IncentiveInfoBar from './IncentiveInfoBar'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ButtonSmall } from 'components/Button'
import { Link } from 'react-router-dom'

const TitleGrid = styled.div`
  padding: 0px;
  display: grid;
  grid-template-columns: 1.4fr 3fr 188px 168px;
  grid-column-gap: 24px;
  align-items: center;
`

interface ProgramCardProps {
  poolAddress: string
  incentives: Incentive[]
  hideStake?: boolean // hide stake button on manage page
}

export default function ProgramCard({ poolAddress, incentives, hideStake = false }: ProgramCardProps) {
  const theme = useTheme()
  const [, pool] = usePoolsByAddresses([poolAddress])[0]

  const currency0 = pool ? unwrappedToken(pool.token0) : undefined
  const currency1 = pool ? unwrappedToken(pool.token1) : undefined

  // dummy until real data from hooks
  const amountBoosted = 1
  const amountavailable = 1

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
              <DoubleCurrencyLogo style={{ marginLeft: '8px' }} currency0={currency0} currency1={currency1} size={24} />
              <TYPE.body fontWeight={600} fontSize="24px" m="0 8px">
                {`${currency0.symbol} / ${currency1.symbol} Pool`}
              </TYPE.body>
              <Badge>{formattedFeeAmount(pool.fee)}%</Badge>
            </RowFixed>
            <AutoRow gap="6px" width="fit-content">
              {amountavailable > 0 ? (
                <BlueBadge>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.blue3}>
                    {amountavailable} <Trans>Boosted</Trans>
                  </TYPE.body>
                </BlueBadge>
              ) : null}
              {amountBoosted > 0 ? (
                <GreenBadge>
                  <TYPE.body fontWeight={700} fontSize="12px" color={theme.green2}>
                    {amountBoosted} <Trans>Available</Trans>
                  </TYPE.body>
                </GreenBadge>
              ) : null}
              {hideStake ? null : (
                <ButtonSmall as={Link} to={'/stake/' + poolAddress}>
                  <Trans>Stake</Trans>
                </ButtonSmall>
              )}
            </AutoRow>
          </RowBetween>
          <Break />
          <AutoColumn gap="12px">
            <TitleGrid>
              <TYPE.body fontSize="12px" fontWeight={400} color={theme.text3}>
                <Trans> TOKEN BOOSTS</Trans>
              </TYPE.body>
              <TYPE.body fontSize="12px" fontWeight={400} color={theme.text3}>
                <Trans>REWARDS REMAINING</Trans>
              </TYPE.body>
              <TYPE.body fontSize="12px" fontWeight={400} color={theme.text3}>
                <Trans>REWARDS</Trans>
              </TYPE.body>
              <TYPE.body fontSize="12px" fontWeight={400} color={theme.text3}>
                <Trans>TIME REMAINING</Trans>
              </TYPE.body>
            </TitleGrid>
            {incentives.map((incentive, i) => (
              <IncentiveInfoBar
                incentive={incentive}
                key={
                  incentive.poolAddress + '-' + incentive.rewardAmountRemaining.currency.address + i + '-incentive-bar'
                }
              />
            ))}
          </AutoColumn>
        </AutoColumn>
      )}
    </CardWrapper>
  )
}
