import { RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import { Incentive } from 'hooks/incentives/useAllIncentives'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { darken, transparentize } from 'polished'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { BIG_INT_SECONDS_IN_WEEK } from 'constants/misc'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { Countdown } from './Countdown'
import { useColor } from 'hooks/useColor'
import { unwrappedToken } from 'utils/unwrappedToken'
import useTheme from 'hooks/useTheme'
import { EmptyBadge, GreenBadge } from 'components/Badge'

const Wrapper = styled.div`
  padding: 0;
  display: grid;
  grid-template-columns: 1.4fr 3fr 188px 168px;
  grid-column-gap: 24px;
  align-items: center;
`

const BadgeText = styled(TYPE.body)`
  white-space: nowrap;
`

const BarWrapper = styled.div`
  width: 100%;
  height: calc(100% - 8px);
  border-radius: 20px;
  background-color: ${({ theme }) => transparentize(0.7, theme.bg3)};
`

const Bar = styled.div<{ percent: number; color?: string }>`
  width: ${({ percent }) => `${percent}%`};
  height: 100%;
  border-radius: inherit;
  background: ${({ color, theme }) =>
    color ? `linear-gradient(to left, ${darken(0.18, color)}, ${darken(0.01, color)});` : theme.blue1};
  display: flex;
  align-items: center;
  padding: 4px;
`

const WrappedLogo = styled(CurrencyLogo)`
  border: 1px solid black;
`

interface IncentiveInfoBarProps {
  incentive: Incentive
}

const MINUTE = 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export default function IncentiveInfoBar({ incentive }: IncentiveInfoBarProps) {
  const theme = useTheme()

  const rewardToken = incentive.initialRewardAmount.currency
  const rewardCurrency = unwrappedToken(rewardToken)

  const startDate = new Date(incentive.startTime * 1000)
  const endDate = new Date(incentive.endTime * 1000)

  const rewardTokensPerWeek = incentive.rewardRatePerSecond.multiply(BIG_INT_SECONDS_IN_WEEK)

  // may be null if no usd price for token
  const usdPerWeek = useUSDCValue(rewardTokensPerWeek)

  const percentageRemaining =
    (parseFloat(incentive.rewardAmountRemaining.toExact()) / parseFloat(incentive.initialRewardAmount.toExact())) * 100

  const color = useColor(rewardToken)

  const beginsInFuture = incentive.startTime > Date.now() / 1000

  let timeUntilGenesis: number = incentive.startTime - Date.now() / 1000
  const days = (timeUntilGenesis - (timeUntilGenesis % DAY)) / DAY
  timeUntilGenesis -= days * DAY
  const hours = (timeUntilGenesis - (timeUntilGenesis % HOUR)) / HOUR
  timeUntilGenesis -= hours * HOUR
  const minutes = (timeUntilGenesis - (timeUntilGenesis % MINUTE)) / MINUTE

  return (
    <Wrapper>
      <RowFixed>
        <CurrencyLogo currency={rewardToken} size="20px" />
        <TYPE.body fontSize="20px" ml="12px" fontWeight={500}>
          {rewardToken.symbol}
        </TYPE.body>
      </RowFixed>
      {beginsInFuture ? (
        <RowFixed>
          <GreenBadge>
            <TYPE.body fontWeight={700} color={theme.green2} fontSize="12px">
              NEW
            </TYPE.body>
          </GreenBadge>
          <TYPE.main fontSize="12px" fontStyle="italic" ml="8px">
            {`Starts in ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`}
          </TYPE.main>
        </RowFixed>
      ) : (
        <BarWrapper>
          <Bar percent={percentageRemaining} color={color}>
            <RowFixed>
              <WrappedLogo currency={rewardCurrency} size="14px" />
              <TYPE.body fontSize="12px" fontWeight={600} ml="8px" mt="-2px">
                {percentageRemaining}% remaining
              </TYPE.body>
            </RowFixed>
          </Bar>
        </BarWrapper>
      )}
      <EmptyBadge>
        <BadgeText fontWeight={700} fontSize="15px">
          {usdPerWeek
            ? `$${formatCurrencyAmount(usdPerWeek, 2)}`
            : `${formatCurrencyAmount(rewardTokensPerWeek, 3)} ${rewardToken.symbol}`}{' '}
          Weekly
        </BadgeText>
      </EmptyBadge>
      <Countdown exactStart={startDate} exactEnd={endDate} />
    </Wrapper>
  )
}
