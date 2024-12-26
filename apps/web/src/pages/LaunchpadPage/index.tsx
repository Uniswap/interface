/* eslint-disable @typescript-eslint/no-unused-vars */
import { InterfacePageName } from '@ubeswap/analytics-events'
import { ChainId } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonPrimary } from 'components/Button'
import { DarkGrayCard } from 'components/Card'
import { AutoColumn, Column } from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { isSupportedChain } from 'constants/chains'
import { useToken } from 'hooks/Tokens'
import { usePoolContract } from 'hooks/useContract'
import { Trans } from 'i18n'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { getIncentiveIdsByPool } from 'pages/Earn/data/v3-incentive-list'
import { Discord, Github, Twitter } from 'pages/Landing/components/Icons'
import { Wiggle } from 'pages/Landing/components/animations'
import { transparentize } from 'polished'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Calendar, Globe, Inbox, Info, Youtube } from 'react-feather'
import { useParams } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ExternalLink, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'
import LaunchpadInfoTable from './LaunchpadInfoTable'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 960px;
  width: 100%;

  @media (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    max-width: 800px;
    padding-top: 48px;
  }

  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    max-width: 500px;
    padding-top: 20px;
  }
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.neutral2};
  @media (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  }
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const CalendarIcon = styled(Calendar)`
  color: ${({ theme }) => theme.neutral2};
  width: 12px;
  height: 12px;
  margin: -2px 4px 0 0;
`

const PositionstWrapper = styled.div`
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
`

export const RowBetweenRelative = styled(Row)`
  justify-content: space-between;
  position: relative;
`

const InfoBoxWrapper = styled.div`
  margin: 0 auto;
  width: 100%;
`

const InfoBoxContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 10px;
  gap: 16px;
  border: 1px solid ${({ theme }) => theme.accent1};
  border-radius: 20px;
  background: ${({ theme }) => theme.surface4};
  backdrop-filter: blur(5px);
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

function InfoBox({ message, desc }: { message?: string; desc?: string }) {
  const theme = useTheme()
  const [showDesc, setShowDesc] = useState(false)
  return (
    <InfoBoxWrapper onClick={() => setShowDesc(!showDesc)}>
      <InfoBoxContainer>
        <Info size={28} stroke={theme.primary1} />
        <AutoColumn justify="flex-start">
          {message && (
            <ThemedText.BodySmall padding={10} textAlign="center">
              {message}
            </ThemedText.BodySmall>
          )}
          {desc && showDesc && (
            <ThemedText.BodySmall padding={10} textAlign="center">
              {desc}
            </ThemedText.BodySmall>
          )}
        </AutoColumn>
      </InfoBoxContainer>
    </InfoBoxWrapper>
  )
}

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
const WebsiteLink = styled.div`
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

function WrongNetworkCard() {
  const theme = useTheme()

  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">
              <ThemedText.H1Large>
                <Trans>Positions</Trans>
              </ThemedText.H1Large>
            </TitleRow>

            <PositionstWrapper>
              <ErrorContainer>
                <ThemedText.BodyPrimary color={theme.neutral3} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                </ThemedText.BodyPrimary>
              </ErrorContainer>
            </PositionstWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

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

export default function FarmV3() {
  const { account } = useWeb3React()
  const chainId = ChainId.CELO
  const { poolAddress } = useParams<{ poolAddress: string }>()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const incentiveIds = useMemo(() => (poolAddress ? getIncentiveIdsByPool(poolAddress) : []), [poolAddress])

  const theme = useTheme()
  const { formatPercent, formatNumber } = useFormatter()

  const poolContract = usePoolContract(poolAddress)
  const poolFee = useSingleCallResult(poolContract, 'fee', undefined, NEVER_RELOAD).result?.[0] as number
  const poolToken0 = useSingleCallResult(poolContract, 'token0', undefined, NEVER_RELOAD).result?.[0] as string
  const poolToken1 = useSingleCallResult(poolContract, 'token1', undefined, NEVER_RELOAD).result?.[0] as string
  const token0 = useToken(poolToken0, ChainId.CELO)
  const token1 = useToken(poolToken1, ChainId.CELO)

  const showConnectAWallet = Boolean(!account)

  const onAction = useCallback(() => {}, [])
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] = useState(false)

  const handleCheckbox = () => {
    setIsDisclaimerAccepted(!isDisclaimerAccepted)
  }

  const [showDisclaimer, setShowDisclaimer] = useState(false)
  useEffect(() => {
    const v3FarmDisclaimerShown = localStorage.getItem('v3FarmDisclaimerShown')
    if (!v3FarmDisclaimerShown) {
      setShowDisclaimer(true)
    }
  }, [])
  const onDisclaimerAccepted = () => {
    localStorage.setItem('v3FarmDisclaimerShown', 'true')
    setShowDisclaimer(false)
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  return (
    <Trace page={InterfacePageName.FARM_V3} shouldLogImpression>
      <Modal isOpen={showDisclaimer} $scrollOverlay={true} onDismiss={() => setShowDisclaimer(false)} maxHeight={90}>
        <div style={{ padding: '16px' }}>
          <div>
            <p>
              This website-hosted user interface (this &quot;Interface&quot;) is an open source frontend software portal
              to the Ubeswap protocol, a decentralized and community-driven collection of blockchain-enabled smart
              contracts and tools (the &quot;Ubeswap Protocol&quot;). This Interface and the Ubeswap Protocol are made
              available by QW3 Labs, however all transactions conducted on the protocol are run by related
              permissionless smart contracts. As the Interface is open-sourced and the Ubeswap Protocol and its related
              smart contracts are accessible by any user, entity or third party, there are a number of third party web
              and mobile user-interfaces that allow for interaction with the Ubeswap Protocol.
            </p>
            <p>
              THIS INTERFACE AND THE UBESWAP PROTOCOL ARE PROVIDED &quot;AS IS&quot;, AT YOUR OWN RISK, AND WITHOUT
              WARRANTIES OF ANY KIND. QW3 Labs, does not provide, own, or control the Ubeswap Protocol or any
              transactions conducted on the protocol or via related smart contracts. By using or accessing this
              Interface or the Ubeswap Protocol and related smart contracts, you agree that no developer or entity
              involved in creating, deploying or maintaining this Interface or the Ubeswap Protocol will be liable for
              any claims or damages whatsoever associated with your use, inability to use, or your interaction with
              other users of, this Interface or the Ubeswap Protocol, including any direct, indirect, incidental,
              special, exemplary, punitive or consequential damages, or loss of profits, digital assets, tokens, or
              anything else of value.
            </p>
          </div>
          <Checkbox checked={isDisclaimerAccepted} hovered={true} onChange={handleCheckbox}>
            <div style={{ marginRight: '10px' }}>I understand</div>
          </Checkbox>
          <AutoColumn justify="center">
            <ButtonPrimary
              disabled={!isDisclaimerAccepted}
              style={{ marginTop: '16px', width: 'fit-content', padding: '8px 20px' }}
              onClick={onDisclaimerAccepted}
            >
              OK
            </ButtonPrimary>
          </AutoColumn>
        </div>
      </Modal>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding="0">UbeStarter Launchpad</TitleRow>

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
                    <img
                      style={{ width: '100%', maxWidth: '250px' }}
                      src="https://res.coinpaper.com/coinpaper/measurable_data_token_mdt_logo_027595e08b.png"
                    />
                  </Row>
                </Column>
                <Column flex="4">
                  <ResponsiveRow align="stretch" gap="md">
                    <ColumnBetween flex="1">
                      <Row gap="10px">
                        <img
                          style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                          src="https://res.coinpaper.com/coinpaper/measurable_data_token_mdt_logo_027595e08b.png"
                        />
                        <ThemedText.H1Medium>Acme Project</ThemedText.H1Medium>
                        <StyledBedge variant="info">Upcoming</StyledBedge>
                      </Row>
                      <Row>
                        <ThemedText.BodySecondary paddingLeft="4px" marginTop="8px">
                          Symbol: ACME Contract: 0x1231...ab03
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
                              <ThemedText.BodyPrimary>2024-12-27</ThemedText.BodyPrimary>
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
                      <ThemedText.SubHeader>10 000 000 ACME</ThemedText.SubHeader>
                    </RowBetween>
                    <RowBetween>
                      <ThemedText.BodySecondary>Participants</ThemedText.BodySecondary>
                      <ThemedText.SubHeader>0</ThemedText.SubHeader>
                    </RowBetween>
                    <RowBetween>
                      <ThemedText.BodySecondary>Price</ThemedText.BodySecondary>
                      <ThemedText.SubHeader>1 ACME = 0.01 CELO</ThemedText.SubHeader>
                    </RowBetween>
                    <RowBetween>
                      <ThemedText.BodySecondary>Duration</ThemedText.BodySecondary>
                      <ThemedText.SubHeader>3 days</ThemedText.SubHeader>
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
                    <WebsiteLink style={{ cursor: 'pointer' }}>
                      <Globe size={12} />
                      Website
                    </WebsiteLink>
                    <SocialIcon $hoverColor="#00C32B">
                      <ExternalLink href="https://github.com/Ubeswap">
                        <Github size="32px" fill="inherit" />
                      </ExternalLink>
                    </SocialIcon>
                    <SocialIcon $hoverColor="#20BAFF">
                      <ExternalLink href="https://twitter.com/Ubeswap">
                        <Twitter size="32px" fill="inherit" />
                      </ExternalLink>
                    </SocialIcon>
                    <SocialIcon $hoverColor="#5F51FF">
                      <ExternalLink href="https://discord.com/invite/zZkUXCMPGP">
                        <Discord size="32px" fill="inherit" />
                      </ExternalLink>
                    </SocialIcon>
                    <SocialIcon $hoverColor="#5F51FF">
                      <ExternalLink href="https://discord.com/invite/zZkUXCMPGP">
                        <Youtube size="32px" fill="inherit" />
                      </ExternalLink>
                    </SocialIcon>
                  </Row>
                </Column>
                <Column gap="16px">
                  <ThemedText.MediumHeader>Timeline</ThemedText.MediumHeader>
                  <Column>
                    <Row align="center" gap="12px">
                      <Circle>1</Circle>
                      <ThemedText.BodySecondary>2024-12-27 15:30 UTC</ThemedText.BodySecondary>
                    </Row>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Launchpad Start</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                    <Row align="center" gap="12px">
                      <Circle>2</Circle>
                      <ThemedText.BodySecondary>2024-12-30 15:30 UTC</ThemedText.BodySecondary>
                    </Row>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Launchpad End</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Automatic Liquidity Creation</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Token Vesting Start</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                    <Row align="center" gap="12px">
                      <Circle>3</Circle>
                      <ThemedText.BodySecondary>2025-03-29 15:30 UTC</ThemedText.BodySecondary>
                    </Row>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Token Vesting End</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                    <Row align="center" gap="12px">
                      <Circle>4</Circle>
                      <ThemedText.BodySecondary>2025-04-29 15:30 UTC</ThemedText.BodySecondary>
                    </Row>
                    <LeftBorderedRow>
                      <ThemedText.BodyPrimary>Liquidity Unlock</ThemedText.BodyPrimary>
                    </LeftBorderedRow>
                  </Column>
                </Column>
              </DarkGrayCard>
              <DarkGrayCard flex="2">
                <Column gap="16px">
                  <ThemedText.MediumHeader>Acme Project Details</ThemedText.MediumHeader>
                  <LaunchpadInfoTable data={[]} />
                </Column>
              </DarkGrayCard>
            </ResponsiveRow>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </Trace>
  )
}
