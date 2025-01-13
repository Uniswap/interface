/* eslint-disable @typescript-eslint/no-unused-vars */
import { useWeb3React } from '@web3-react/core'
import { DarkGrayCard } from 'components/Card'
import { AutoColumn, Column } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { useToken } from 'hooks/Tokens'
import { Discord, Twitter } from 'pages/Landing/components/Icons'
import { Wiggle } from 'pages/Landing/components/animations'
import { LaunchpadOptions } from 'pages/LaunchpadCreate/launchpad-state'
import { transparentize } from 'polished'
import { useMemo } from 'react'
import { Calendar, Globe, Square, Youtube } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ExternalLink, ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'
import { formatDateTime } from 'utilities/src/time/time'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import LaunchpadInfoTable from './LaunchpadInfoTable'

const CalendarIcon = styled(Calendar)`
  color: ${({ theme }) => theme.neutral2};
  width: 12px;
  height: 12px;
  margin: -2px 4px 0 0;
`

export const RowBetweenRelative = styled(Row)`
  justify-content: space-between;
  position: relative;
`

const ColumnBetween = styled(Column)`
  justify-content: space-between;
`

const ResponsiveRow = styled(Row)`
  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
  }
`
const Divider = styled.div`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface3}`};
  width: 100%;
  margin: 20px 0;
`
const VerticalDivider = styled.div`
  box-sizing: content-box;
  width: 1px;
  background-color: ${({ theme }) => theme.neutral2};
`

const Circle = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.accent1};
  display: flex;
  justify-content: center;
  align-items: center;
`

const SocialIcon = styled(Wiggle)`
  flex: 0;
  fill: ${(props) => props.theme.neutral1};
  cursor: pointer;
  transition: fill;
  transition-duration: 0.2s;
  &:hover {
    fill: ${(props) => props.$hoverColor};
  }
`

const StyledBedge = styled.div<{ variant: 'success' | 'warning' | 'error' | 'info' }>`
  display: inline-flex;
  align-items: center;
  height: 30px;
  background-color: ${({ theme, variant }) =>
    transparentize(
      0.8,

      variant == 'warning'
        ? theme.warning2
        : variant == 'success'
        ? theme.success
        : variant == 'error'
        ? theme.critical
        : theme.primary1
    )};
  border: 1px solid
    ${({ theme, variant }) =>
      variant == 'warning'
        ? theme.warning2
        : variant == 'success'
        ? theme.success
        : variant == 'error'
        ? theme.critical
        : theme.primary1};
  border-radius: 15px;
  font-size: 1rem;
  padding: 0 12px;

  font-weight: 500;
  margin-left: 0.3rem;
  margin-right: 0.2rem;
  color: ${({ theme, variant }) =>
    variant == 'warning'
      ? theme.warning2
      : variant == 'success'
      ? theme.success
      : variant == 'error'
      ? theme.critical
      : theme.primary1};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
    margin-left: 0.4rem;
    margin-right: 0.1rem;
  `};
`
const WebsiteLink = styled(ExternalLink)`
  display: inline-flex;
  align-items: center;
  height: 28px;
  background-color: ${({ theme }) => transparentize(0.8, theme.accent3)};
  border: 1px solid ${({ theme }) => theme.accent3};
  border-radius: 14px;
  font-size: 1rem;
  padding: 0 10px;
  gap: 6px;
  font-weight: 500;
  color: ${({ theme }) => theme.accent3};
`

export const TwoColumnAuto = styled(Row)<{ gap?: string; justify?: string }>`
  flex-wrap: wrap;
  column-gap: 20px;

  & > * {
    width: calc(50% - 10px);
  }

  @media screen and (max-width: ${BREAKPOINTS.md}px) {
    flex-direction: column;
    & > * {
      width: 100%;
    }
  }
`

const LeftBorderedRow = styled(Row)`
  border-left: ${({ theme }) => `1px solid ${theme.surface3}`};
  margin-left: 12px;
  padding: 6px 0 12px 24px;
`

export function getAbbreviatedTimeString(timestamp: number) {
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)
  const daysPassed = Math.floor(hoursPassed / 24)
  const monthsPassed = Math.floor(daysPassed / 30)

  if (monthsPassed > 0) {
    return `${monthsPassed} months ago`
  } else if (daysPassed > 0) {
    return `${daysPassed} days ago`
  } else if (hoursPassed > 0) {
    return `${hoursPassed} hours ago`
  } else if (minutesPassed > 0) {
    return `${minutesPassed} minutes ago`
  } else {
    return `${secondsPassed} seconds ago`
  }
}

export default function LaunchpadView({
  options,
  participants,
  totalRaisedAsQuote,
}: {
  options: LaunchpadOptions
  participants: number
  totalRaisedAsQuote: number
}) {
  const { account } = useWeb3React()

  const theme = useTheme()
  const { formatPercent, formatNumber } = useFormatter()

  const token = useToken(options.tokenInfo.tokenAddress)
  const quoteToken = useToken(options?.tokenSale.quoteToken)

  const tokensOffered = Math.floor(
    (parseFloat(options.tokenSale.hardCapAsQuote) || 0) / (parseFloat(options.tokenSale.sellPrice) || 0)
  )

  const timeline: { time: number; items: string[] }[] = useMemo(() => {
    const startTime = new Date(options.tokenSale.startDate).valueOf()
    const oneDay = 24 * 60 * 60 * 1000
    let endDate = startTime + parseInt(options.tokenSale.durationDays) * oneDay
    const rt = [
      {
        time: startTime,
        items: ['Launchpad Start'],
      },
      {
        time: endDate,
        items: ['Launchpad End', 'Automatic Liquidity Creation'],
      },
    ]
    const cliffDuration = parseInt(options.tokenSale.cliffDurationDays || '0')
    const releaseDuration = parseInt(options.tokenSale.releaseDurationDays || '0')
    if (cliffDuration > 0) {
      endDate = endDate + cliffDuration * oneDay
      if (releaseDuration > 0) {
        rt.push({
          time: endDate,
          items: ['Token Vesting Start'],
        })
      } else {
        rt.push({
          time: endDate,
          items: ['Token Release'],
        })
      }
    } else {
      if (releaseDuration > 0) {
        rt[1].items.push('Token Vesting Start')
      } else {
        rt[1].items.push('Token Release')
      }
    }
    if (releaseDuration > 0) {
      endDate = endDate + releaseDuration * oneDay
      rt.push({
        time: endDate,
        items: ['Token Vesting End'],
      })
    }
    if (options.liquidity.liquidityAction == 'LOCK') {
      const lockDuration = parseInt(options.liquidity.lockDurationDays || '0')
      endDate = endDate + lockDuration * oneDay
      rt.push({
        time: endDate,
        items: ['Liquidity Unlock'],
      })
    }
    return rt
  }, [options])

  return (
    <AutoColumn gap="lg" justify="center">
      <AutoColumn gap="lg" style={{ width: '100%' }}>
        <DarkGrayCard>
          <ResponsiveRow align="stretch" gap="lg">
            <Column flex="1">
              <Row
                style={{
                  borderRadius: '16px',
                  backgroundColor: '#00000055',
                  padding: '8px',
                  overflow: 'hidden',
                  justifyContent: 'center',
                }}
              >
                <img style={{ width: '100%', maxWidth: '250px' }} src={options.tokenInfo.logoUrl} />
              </Row>
            </Column>
            <Column flex="4">
              <ResponsiveRow align="stretch" gap="md">
                <ColumnBetween flex="1">
                  <Row gap="10px">
                    <img
                      style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                      src={options.tokenInfo.logoUrl}
                    />
                    <ThemedText.H1Medium>{token?.name}</ThemedText.H1Medium>
                    <StyledBedge variant="info">Upcoming</StyledBedge>
                  </Row>
                  <Row>
                    <ThemedText.BodySecondary paddingLeft="4px" marginTop="8px">
                      Symbol: {token?.symbol} Contract: {shortenAddress(options.tokenInfo.tokenAddress)}
                    </ThemedText.BodySecondary>
                  </Row>
                </ColumnBetween>
                <Column>
                  <DarkGrayCard>
                    <Row align="stretch" gap="12px">
                      <Column gap="6px">
                        <Row alignItems="center" justify="center">
                          <CalendarIcon />
                          <ThemedText.Caption>Start Date</ThemedText.Caption>
                        </Row>
                        <Row>
                          <ThemedText.BodyPrimary>{formatDateTime(options.tokenSale.startDate)}</ThemedText.BodyPrimary>
                        </Row>
                      </Column>
                      <VerticalDivider />
                      <Column gap="2px">
                        <Row>
                          <ThemedText.Caption>Time until launch</ThemedText.Caption>
                        </Row>
                        <Row gap="6px" align="flex-end">
                          <ThemedText.MediumHeader>2</ThemedText.MediumHeader>
                          <ThemedText.Caption marginBottom="1px">days</ThemedText.Caption>
                          <ThemedText.MediumHeader>15</ThemedText.MediumHeader>
                          <ThemedText.Caption marginBottom="1px">hours</ThemedText.Caption>
                        </Row>
                      </Column>
                    </Row>
                  </DarkGrayCard>
                </Column>
              </ResponsiveRow>
              <Divider />
              <TwoColumnAuto>
                <RowBetween>
                  <ThemedText.BodySecondary>Tokens Offered</ThemedText.BodySecondary>
                  <ThemedText.SubHeader>
                    {formatNumber({
                      input: tokensOffered,
                      type: NumberType.PortfolioBalance,
                    })}{' '}
                    {token?.symbol}
                  </ThemedText.SubHeader>
                </RowBetween>
                <RowBetween>
                  <ThemedText.BodySecondary>Participants</ThemedText.BodySecondary>
                  <ThemedText.SubHeader>{participants}</ThemedText.SubHeader>
                </RowBetween>
                <RowBetween>
                  <ThemedText.BodySecondary>Price</ThemedText.BodySecondary>
                  <ThemedText.SubHeader>
                    1 {token?.symbol} = {options.tokenSale.sellPrice} {quoteToken?.symbol}
                  </ThemedText.SubHeader>
                </RowBetween>
                <RowBetween>
                  <ThemedText.BodySecondary>Duration</ThemedText.BodySecondary>
                  <ThemedText.SubHeader>{options.tokenSale.durationDays} days</ThemedText.SubHeader>
                </RowBetween>
              </TwoColumnAuto>
            </Column>
          </ResponsiveRow>
        </DarkGrayCard>

        <ResponsiveRow align="stretch" gap="md">
          <DarkGrayCard flex="1">
            <Column gap="16px">
              <ThemedText.MediumHeader>Links</ThemedText.MediumHeader>
              <Row marginBottom="22px" gap="8px" align="center">
                <WebsiteLink href={options.tokenInfo.website}>
                  <Globe size={12} />
                  Website
                </WebsiteLink>
                {options.tokenInfo.twitter && (
                  <SocialIcon $hoverColor="#20BAFF">
                    <ExternalLink href={options.tokenInfo.twitter}>
                      <Twitter size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
                {options.tokenInfo.discord && (
                  <SocialIcon $hoverColor="#5F51FF">
                    <ExternalLink href={options.tokenInfo.discord}>
                      <Discord size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
                {options.tokenInfo.telegram && (
                  <SocialIcon $hoverColor="#5F51FF">
                    <ExternalLink href={options.tokenInfo.telegram}>
                      <Square size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
                {options.tokenInfo.farcaster && (
                  <SocialIcon $hoverColor="#5F51FF">
                    <ExternalLink href={options.tokenInfo.farcaster}>
                      <Square size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
                {options.tokenInfo.medium && (
                  <SocialIcon $hoverColor="#5F51FF">
                    <ExternalLink href={options.tokenInfo.medium}>
                      <Square size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
                {options.tokenInfo.youtube && (
                  <SocialIcon $hoverColor="#5F51FF">
                    <ExternalLink href={options.tokenInfo.youtube}>
                      <Youtube size="32px" fill="inherit" />
                    </ExternalLink>
                  </SocialIcon>
                )}
              </Row>
            </Column>
            <Column gap="16px">
              <ThemedText.MediumHeader>Timeline</ThemedText.MediumHeader>
              <Column>
                {timeline.map((timelineItem, index) => (
                  <>
                    <Row align="center" gap="12px">
                      <Circle>{index + 1}</Circle>
                      <ThemedText.BodySecondary>{formatDateTime(timelineItem.time)}</ThemedText.BodySecondary>
                    </Row>
                    {timelineItem.items.map((item) => (
                      <LeftBorderedRow key={item}>
                        <ThemedText.BodyPrimary>{item}</ThemedText.BodyPrimary>
                      </LeftBorderedRow>
                    ))}
                  </>
                ))}
              </Column>
            </Column>
          </DarkGrayCard>
          <DarkGrayCard flex="2">
            <Column gap="16px">
              <ThemedText.MediumHeader>{token?.name} Details</ThemedText.MediumHeader>
              <LaunchpadInfoTable options={options} />
            </Column>
          </DarkGrayCard>
        </ResponsiveRow>
      </AutoColumn>
    </AutoColumn>
  )
}
