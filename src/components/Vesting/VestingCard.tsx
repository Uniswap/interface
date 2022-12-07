import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { BigNumber } from 'ethers'
import { Box, Flex, Text } from 'rebass'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import HoverDropdown from 'components/HoverDropdown'
import Wallet from 'components/Icons/Wallet'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { formatDollarAmount } from 'utils/numbers'

const formatRemainTime = (numberOfSeconds: number) => {
  if (numberOfSeconds < 0) return t`Full unlocked`
  const days = numberOfSeconds / 60 / 60 / 24
  if (days > 1) return days + ' Days left'

  const hours = numberOfSeconds / 60 / 60
  if (hours < 24 && hours > 1) return hours.toFixed(0) + ' Hours left'
  const minutes = numberOfSeconds / 60
  return minutes.toFixed(0) + ' Minutes left'
}

const COLORS = ['#0086E7', '#31CB9E', '#FF50F8', '#FF9901']

const ScheduleCardWrapper = styled.div`
  padding: 24px;
  border-radius: 20px;
  background: ${({ theme }) => theme.background};
  border: 1px solid ${({ theme }) => theme.border};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
  `}
`

const ScheduleCardContent = styled.span`
  background: ${({ theme }) => theme.buttonBlack};
  padding: 24px;
  border-radius: 20px;
  display: flex;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background: ${({ theme }) => theme.background};
    padding: 0;
  `}
`

const TotalHarvested = styled.div`
  flex: 1;
`

const DetailReward = styled.div`
  flex: 2;
  border-left: 1px solid ${({ theme }) => theme.border};
  padding-left: 24px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding-left: 0;
    border-left: none;
    margin-top: 24px
  `}
`

const Title = styled(Text)<{ noBorder?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  border-bottom: 1px dashed ${({ theme, noBorder }) => (noBorder ? 'transparent' : theme.border)};
  line-height: 24px;
  color: ${({ theme }) => theme.subText};
`

const ProgressBar = styled.div`
  height: 36px;
  margin-top: 12px;
  background: ${({ theme }) => theme.border};
  position: relative;
`
const Claimed = styled.div<{ width: string }>`
  height: 36px;
  background: ${({ theme }) => theme.darkGreen};
  width: ${({ width }) => width};
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  text-align: right;
`

const Unlocked = styled(Claimed)`
  background: ${({ theme }) => theme.primary};
`

const Dot = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${({ color }) => color};
`

const Circle = styled.div<{ fill: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ fill }) => fill};
`

const SummaryWrapper = styled(Flex)`
  gap: 24px;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `}
`

const SummaryItem = styled.div<{ colorful?: boolean }>`
  border-radius: 20px;
  flex: 1;
  padding: 16px 24px;
  background: ${({ theme, colorful }) => (!colorful ? theme.background : theme.radialGradient)};

  ${({ theme, colorful }) => theme.mediaWidth.upToSmall`
    background: ${!colorful ? theme.buttonBlack : theme.radialGradient};
    display: flex;
    align-items: center;
    justify-content: space-between;
  `}
`

const PieChartLengd = styled(Box)`
  margin: 24px auto 0 !important;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  width: fit-content;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
   grid-template-columns: 1fr;
  `}
`
const VestingPercent = styled(Flex)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    flex-direction: column;
  `}
`

function VestingCard({
  info,
  endTime,
  remainTime,
  onClaimAll,
}: {
  endTime: number
  remainTime: number
  onClaimAll: () => void
  info: {
    [tokenAddress: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      /* fullyIndexes: number[] */
      /* fullyAmount: BigNumber */
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      vestedAmount: BigNumber
      token: Token
      tokenPrice: number
    }
  }
}) {
  const theme = useTheme()

  const unlockedUSD = Object.values(info).reduce((res, item) => {
    const vestableAmount = CurrencyAmount.fromRawAmount(item.token, item.vestableAmount.toString())
    return res + item.tokenPrice * parseFloat(vestableAmount.toExact())
  }, 0)

  const harvestedUSD = Object.values(info).reduce((res, item) => {
    const harvestedAmount = CurrencyAmount.fromRawAmount(item.token, item.totalAmount.toString())
    return res + item.tokenPrice * parseFloat(harvestedAmount.toExact())
  }, 0)

  const claimedUSD = Object.values(info).reduce((res, item) => {
    const vestedAmount = CurrencyAmount.fromRawAmount(item.token, item.vestedAmount.toString())
    return res + item.tokenPrice * parseFloat(vestedAmount.toExact())
  }, 0)

  const lockedUSD = harvestedUSD - unlockedUSD - claimedUSD

  const claimable = Object.values(info).some(item => item.vestableAmount.gt(0))

  const claimedPercent = (harvestedUSD ? claimedUSD / harvestedUSD : 0) * 100
  const unlockedPercent = (harvestedUSD ? unlockedUSD / harvestedUSD : 0) * 100

  const pieChartData = Object.values(info).map(amount => {
    const value =
      amount.tokenPrice * +CurrencyAmount.fromRawAmount(amount.token, amount.totalAmount.toString()).toExact()
    return {
      name: amount.token.symbol,
      value,
      percent: (value / harvestedUSD) * 100,
    }
  })

  return (
    <>
      <ScheduleCardWrapper>
        <ScheduleCardContent>
          <TotalHarvested>
            <MouseoverTooltip
              text={t`The total amount of rewards you have harvested from the farms. Harvested rewards are locked initially and vested linearly over a short period.`}
            >
              <Title>
                <Trans>Total Harvested Rewards</Trans>
              </Title>
            </MouseoverTooltip>
            <Text marginTop="8px" fontSize="32px" fontWeight="500">
              {formatDollarAmount(harvestedUSD)}
            </Text>

            <Title marginTop="28px" noBorder>
              <Trans>Rewards Breakdown</Trans>
            </Title>

            <PieChart width={184} height={184} style={{ margin: 'auto', marginTop: '24px' }}>
              <Pie
                data={pieChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#82ca9d"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
                <Tooltip />
              </Pie>
            </PieChart>

            <PieChartLengd>
              {pieChartData.map((item, index) => (
                <Flex key={index} fontSize="12px" alignItems="center" sx={{ gap: '6px' }}>
                  <Circle fill={COLORS[index % COLORS.length]} />
                  <Text>{item.name}:</Text>
                  <Text color={theme.subText}>
                    {formatDollarAmount(item.value)} ({item.percent.toFixed(2)}%)
                  </Text>
                </Flex>
              ))}
            </PieChartLengd>
          </TotalHarvested>

          <DetailReward>
            <SummaryWrapper>
              <SummaryItem>
                <Flex alignItems="center" color={theme.subText} sx={{ gap: '4px' }}>
                  <Wallet />
                  <MouseoverTooltip text={t`The amount of rewards you have already claimed`}>
                    <Title>
                      <Trans>Claimed Rewards</Trans>
                    </Title>
                  </MouseoverTooltip>
                </Flex>
                <HoverDropdown
                  padding="8px 0 0"
                  content={
                    <Text fontSize="20px" fontWeight="500">
                      {formatDollarAmount(claimedUSD)}
                    </Text>
                  }
                  dropdownContent={
                    Object.values(info).length
                      ? Object.values(info).map(amount => (
                          <Flex alignItems="center" key={amount.token.address} paddingY="4px">
                            <CurrencyLogo size="16px" currency={amount.token} />
                            <Text fontSize="12px" marginLeft="4px">
                              {CurrencyAmount.fromRawAmount(amount.token, amount.vestedAmount.toString()).toSignificant(
                                8,
                              )}{' '}
                              {amount.token.symbol}
                            </Text>
                          </Flex>
                        ))
                      : ''
                  }
                />
              </SummaryItem>

              <SummaryItem colorful>
                <Flex alignItems="center" color={theme.subText} sx={{ gap: '4px' }}>
                  <Wallet />
                  <MouseoverTooltip
                    text={t`The amount of rewards that are unlocked and can be claimed instantly as their vesting is over`}
                  >
                    <Title>Claimable Rewards</Title>
                  </MouseoverTooltip>
                </Flex>
                <HoverDropdown
                  padding="8px 0 0"
                  content={
                    <Text fontSize="20px" fontWeight="500">
                      {formatDollarAmount(unlockedUSD)}
                    </Text>
                  }
                  dropdownContent={Object.values(info).map(amount => (
                    <Flex alignItems="center" key={amount.token.address} paddingY="4px">
                      <CurrencyLogo size="16px" currency={amount.token} />
                      <Text fontSize="12px" marginLeft="4px">
                        {CurrencyAmount.fromRawAmount(amount.token, amount.vestableAmount.toString()).toSignificant(8)}{' '}
                        {amount.token.symbol}
                      </Text>
                    </Flex>
                  ))}
                />
              </SummaryItem>

              <SummaryItem>
                <Flex alignItems="center" color={theme.subText} sx={{ gap: '4px' }}>
                  <Wallet />
                  <MouseoverTooltip text={t`The amount of rewards that are locked as they are currently vesting`}>
                    <Title>
                      <Trans>Locked Rewards</Trans>
                    </Title>
                  </MouseoverTooltip>
                </Flex>
                <HoverDropdown
                  padding="8px 0 0"
                  content={
                    <Text fontSize="20px" fontWeight="500">
                      {formatDollarAmount(lockedUSD)}
                    </Text>
                  }
                  dropdownContent={
                    Object.values(info).length
                      ? Object.values(info).map(amount => (
                          <Flex alignItems="center" key={amount.token.address} paddingY="4px">
                            <CurrencyLogo size="16px" currency={amount.token} />
                            <Text fontSize="12px" marginLeft="4px">
                              {CurrencyAmount.fromRawAmount(
                                amount.token,
                                amount.totalAmount.sub(amount.vestedAmount).sub(amount.vestableAmount).toString(),
                              ).toSignificant(8)}{' '}
                              {amount.token.symbol}
                            </Text>
                          </Flex>
                        ))
                      : ''
                  }
                />
              </SummaryItem>
            </SummaryWrapper>

            <Text color={theme.subText} fontSize="14px" fontWeight="500" marginTop="36px">
              Vesting Schedule
            </Text>

            <Flex fontSize="14px" marginTop="20px" justifyContent="space-between">
              <Text>Full Unlock</Text>
              <Text color={theme.subText}>
                {dayjs(endTime * 1000).format('DD-MM-YYYY')} ({formatRemainTime(remainTime)})
              </Text>
            </Flex>

            <ProgressBar>
              <Unlocked width={`${claimedPercent + unlockedPercent}%`} />
              <Claimed width={claimedPercent + '%'} />
            </ProgressBar>

            <VestingPercent
              sx={{ gap: '24px' }}
              alignItems="center"
              justifyContent="center"
              fontSize="12px"
              color={theme.subText}
              marginTop="12px"
            >
              <Flex>
                <Dot color={theme.darkGreen} />
                <Text marginLeft="4px" lineHeight="16px">
                  <Trans>{claimedPercent.toFixed(0)}% Claimed</Trans>
                </Text>
              </Flex>
              <Flex>
                <Dot color={theme.primary} />
                <Text marginLeft="4px" lineHeight="16px">
                  <Trans>{unlockedPercent.toFixed(0)}% claimable</Trans>
                </Text>
              </Flex>
              <Flex>
                <Dot color={theme.border} />
                <Text marginLeft="4px" lineHeight="16px">
                  <Trans>{Math.abs(100 - unlockedPercent - claimedPercent).toFixed(0)}% Locked</Trans>
                </Text>
              </Flex>
            </VestingPercent>

            <ButtonPrimary
              style={{
                margin: '28px auto 0',
                fontSize: '14px',
                width: 'fit-content',
                minWidth: '200px',
              }}
              onClick={onClaimAll}
              disabled={!claimable}
            >
              <Trans>Claim</Trans>
            </ButtonPrimary>
          </DetailReward>
        </ScheduleCardContent>
      </ScheduleCardWrapper>
    </>
  )
}

export default VestingCard
