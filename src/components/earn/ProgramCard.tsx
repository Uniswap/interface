import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { Incentive } from '../../hooks/incentives/useAllIncentives'
import { usePoolsByAddresses } from 'hooks/usePools'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { LoadingRows } from 'pages/Pool/styleds'
import Badge from 'components/Badge'
import { formattedFeeAmount } from 'utils'
import { Break } from './styled'
import IncentiveInfoBar from './IncentiveInfoBar'
import { unwrappedToken } from 'utils/unwrappedToken'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'

const Wrapper = styled.div`
  padding: 24px;
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(30, 26, 49, 0.2) 0%, rgba(61, 81, 165, 0.2) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`

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
}

export default function ProgramCard({ poolAddress, incentives }: ProgramCardProps) {
  const theme = useTheme()
  const [, pool] = usePoolsByAddresses([poolAddress])[0]

  const currency0 = pool ? unwrappedToken(pool.token0) : undefined
  const currency1 = pool ? unwrappedToken(pool.token1) : undefined

  return (
    <Wrapper>
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
    </Wrapper>
  )
}
