/* eslint-disable @typescript-eslint/no-unused-vars */
import { useWeb3React } from '@web3-react/core'
import { DarkGrayCard } from 'components/Card'
import { AutoColumn, Column } from 'components/Column'
import Row, { RowBetween } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { useToken } from 'hooks/Tokens'
import { Discord, Twitter } from 'pages/Landing/components/Icons'
import { Wiggle } from 'pages/Landing/components/animations'
import SimpleTable from 'pages/LaunchpadCreate/SimpleTable'
import { LaunchpadOptions } from 'pages/LaunchpadCreate/launchpad-state'
import { LaunchpadStatus } from 'pages/LaunchpadList/data/useLaunchpads'
import { transparentize } from 'polished'
import { ReactNode, useCallback, useMemo } from 'react'
import { Calendar, Globe, Square, Youtube } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ButtonText, ExternalLink, ThemedText } from 'theme/components'
import { ellipseMiddle, shortenAddress } from 'utilities/src/addresses'
import { formatDateTime } from 'utilities/src/time/time'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import LaunchpadInfoTable from './LaunchpadInfoTable'
import { useCancelCallback } from './launchpad-actions'

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
const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
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

export function getCounterParts(timestamp: number) {
  const now = Date.now()
  const timeDiff = timestamp < now ? 0 : timestamp - now
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

  if (days > 0) {
    return [days.toString(), days == 1 ? 'day' : 'days', hours.toString(), hours == 1 ? 'hour' : 'hours']
  } else if (hours > 0) {
    return [hours.toString(), hours == 1 ? 'hour' : 'hours', minutes.toString(), minutes == 1 ? 'minute' : 'minutes']
  } else if (minutes > 0) {
    return [
      minutes.toString(),
      minutes == 1 ? 'minute' : 'minutes',
      seconds.toString(),
      seconds == 1 ? 'second' : 'seconds',
    ]
  } else {
    return ['0', 'minutes', seconds.toString(), seconds == 1 ? 'second' : 'seconds']
  }
}

export default function LaunchpadView({
  options,
  participants,
  totalRaisedAsQuote,
  status,
  userTokens,
  userClaimableTokens,
  userActionComponent,
  launchpadAddress,
}: {
  options: LaunchpadOptions
  participants: number
  totalRaisedAsQuote: number
  status: LaunchpadStatus
  userTokens: number
  userClaimableTokens: number
  userActionComponent: () => ReactNode
  launchpadAddress?: string
}) {
  const { account } = useWeb3React()
  const isOwner = account?.toLowerCase() === options.tokenSale.owner.toLowerCase()

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

  const startDate = new Date(options.tokenSale.startDate)
  const counterParts = getCounterParts(startDate.valueOf())
  const statusVariant =
    status == 'Pending' ? 'info' : status == 'Active' || status == 'Succeeded' || status == 'Done' ? 'success' : 'error'
  const statusText = status == 'Pending' ? 'Upcoming' : status == 'Done' ? 'Succeeded' : status

  const tokenomicsHeaders = ['#', 'Type', 'Amount', 'Unlocked at TGE', 'Cliff', 'Vesting']
  const tokenomicsData = options.tokenInfo.tokenomics.map((info) => [
    info.index.toString(),
    info.name,
    formatNumber({
      input: info.amount,
      type: NumberType.TokenNonTx,
    }),
    formatNumber({
      input: info.unlockedAmount,
      type: NumberType.TokenNonTx,
    }),
    info.cliffInDays.toString(),
    info.vestingInDays.toString(),
  ])

  const [cancelCallback, cancelTx, isCanceling] = useCancelCallback(launchpadAddress)
  const onCancelAction = () => {
    if (isCanceling == false) {
      cancelCallback('invalid info')
    }
  }

  const onDissmissConfirmationModal = useCallback(() => {}, [])

  return (
    <AutoColumn gap="lg" justify="center">
      <AutoColumn gap="lg" style={{ width: '100%' }}>
        <DarkGrayCard>
          <ResponsiveRow align="stretch" gap="lg">
            <Column flex="1">
              <Row
                style={{
                  borderRadius: '16px',
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
                    <StyledBedge variant={statusVariant}>{statusText}</StyledBedge>
                  </Row>
                  <Row marginTop="10px">
                    <ThemedText.BodySecondary paddingLeft="4px">Symbol:</ThemedText.BodySecondary>
                    <ThemedText.BodyPrimary paddingLeft="4px">{token?.symbol}</ThemedText.BodyPrimary>
                    <ThemedText.BodySecondary paddingLeft="16px">Contract:</ThemedText.BodySecondary>
                    <ExternalLink
                      style={{ textDecoration: 'underline', textAlign: 'left' }}
                      target="_blank"
                      href={`https://celoscan.io/address/${options.tokenInfo.tokenAddress}`}
                    >
                      <ThemedText.BodyPrimary paddingLeft="4px">
                        {shortenAddress(options.tokenInfo.tokenAddress)}
                      </ThemedText.BodyPrimary>
                    </ExternalLink>
                  </Row>
                </ColumnBetween>
                <Column>
                  {status == 'Pending' ? (
                    <DarkGrayCard>
                      <Row align="stretch" gap="12px">
                        <Column gap="6px">
                          <Row alignItems="center" justify="center">
                            <CalendarIcon />
                            <ThemedText.Caption>Start Date</ThemedText.Caption>
                          </Row>
                          <Row>
                            <ThemedText.BodyPrimary>{formatDateTime(startDate)}</ThemedText.BodyPrimary>
                          </Row>
                        </Column>
                        <VerticalDivider />
                        <Column gap="2px">
                          <Row>
                            <ThemedText.Caption>Time until launch</ThemedText.Caption>
                          </Row>
                          <Row gap="6px" align="flex-end">
                            <ThemedText.MediumHeader>{counterParts[0]}</ThemedText.MediumHeader>
                            <ThemedText.Caption marginBottom="1px">{counterParts[1]}</ThemedText.Caption>
                            <ThemedText.MediumHeader>{counterParts[2]}</ThemedText.MediumHeader>
                            <ThemedText.Caption marginBottom="1px">{counterParts[3]}</ThemedText.Caption>
                          </Row>
                        </Column>
                      </Row>
                    </DarkGrayCard>
                  ) : (
                    userActionComponent()
                  )}
                </Column>
              </ResponsiveRow>
              <Divider />
              <TwoColumnAuto>
                <RowBetween>
                  <ThemedText.BodySecondary>Tokens Offered</ThemedText.BodySecondary>
                  <ThemedText.SubHeader>
                    {formatNumber({
                      input: tokensOffered,
                      type: NumberType.TokenNonTx,
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
                {totalRaisedAsQuote > 0 ? (
                  <RowBetween>
                    <ThemedText.BodySecondary>Total Raised</ThemedText.BodySecondary>
                    <ThemedText.SubHeader>
                      {totalRaisedAsQuote} {quoteToken?.symbol}
                    </ThemedText.SubHeader>
                  </RowBetween>
                ) : (
                  <RowBetween>
                    <ThemedText.BodySecondary>Duration</ThemedText.BodySecondary>
                    <ThemedText.SubHeader>{options.tokenSale.durationDays} days</ThemedText.SubHeader>
                  </RowBetween>
                )}

                {status !== 'Pending' && (
                  <>
                    <RowBetween>
                      <ThemedText.BodySecondary>Your Allocation</ThemedText.BodySecondary>
                      <ThemedText.SubHeader>
                        {userTokens} {token?.symbol}
                      </ThemedText.SubHeader>
                    </RowBetween>
                    <RowBetween>
                      <ThemedText.BodySecondary>Your Claimable Tokens</ThemedText.BodySecondary>
                      <ThemedText.SubHeader>
                        {userClaimableTokens} {token?.symbol}
                      </ThemedText.SubHeader>
                    </RowBetween>
                  </>
                )}
              </TwoColumnAuto>
              {isOwner && launchpadAddress && (
                <DarkGrayCard marginTop="12px">
                  <p>
                    You are the owner of this launchpad. You can change the information or cancel. Information change
                    can be done until one day earlier than the start date.
                  </p>
                  <Row gap="20px" justify="flex-ed">
                    <ButtonText>Change Info</ButtonText>
                    <ButtonText onClick={onCancelAction}>Cancel</ButtonText>
                  </Row>
                </DarkGrayCard>
              )}
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
                    <Row align="center" gap="12px" key={'timeline' + index}>
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
              <ThemedText.MediumHeader>Project Description</ThemedText.MediumHeader>
              <pre>{options.tokenInfo.description}</pre>
              <ThemedText.MediumHeader>Tokenomics</ThemedText.MediumHeader>
              <TableWrapper data-testid="tokenomics-table">
                <SimpleTable headers={tokenomicsHeaders} data={tokenomicsData} />
              </TableWrapper>
              {options.tokenInfo.teamMembers.length > 0 && (
                <>
                  <ThemedText.MediumHeader>Team Members</ThemedText.MediumHeader>
                  <TableWrapper data-testid="team-members"></TableWrapper>
                </>
              )}
              {options.tokenInfo.auditLinks.trim().length > 0 && (
                <>
                  <ThemedText.MediumHeader>Audit Links</ThemedText.MediumHeader>
                  {options.tokenInfo.auditLinks
                    .trim()
                    .split('\n')
                    .map((link) => (
                      <ExternalLink
                        key={link}
                        style={{ textDecoration: 'underline', textAlign: 'left' }}
                        target="_blank"
                        href={link}
                      >
                        <ThemedText.BodyPrimary paddingLeft="4px">
                          {link.length > 50 ? ellipseMiddle(link, 30, 10) : link}
                        </ThemedText.BodyPrimary>
                      </ExternalLink>
                    ))}
                </>
              )}
            </Column>
          </DarkGrayCard>
        </ResponsiveRow>
      </AutoColumn>
      <TransactionConfirmationModal
        isOpen={isCanceling}
        attemptingTxn={isCanceling}
        hash={cancelTx}
        reviewContent={() => <div></div>}
        onDismiss={onDissmissConfirmationModal}
        pendingText="Launchpad is canceling"
      />
    </AutoColumn>
  )
}
