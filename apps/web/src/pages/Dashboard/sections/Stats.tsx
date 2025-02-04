import { DarkCard } from 'components/Card'
import Column from 'components/Column'
import Row from 'components/Row'
import { t } from 'i18n'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme/components'
import { useMedia } from 'ui'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { Body1, Box, H2 } from '../components/Generics'
import { StatCard } from '../components/StatCard'
import { useDashboardData } from '../use-dashboard-data'
import { useInView } from './useInView'

const Container = styled.div`
  width: 100%;
  max-width: 1360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;

  @media (max-width: 960px) {
    max-height: 360px;
  }
  @media (max-width: 768px) {
    max-height: none;
    padding: 0 48px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`

const DashboardTitle = styled(H2)`
  font-size: 46px;

  @media (max-width: 960px) {
    font-size: 36px;
  }
  @media (max-width: 768px) {
    font-size: 32px;
  }
`

const SectionLayout = styled(Box)`
  width: 100%;
  max-width: 1280px;
`

const HideWhenLarge = styled(Box)`
  @media (min-width: 768px) {
    display: none;
  }
`

const HideWhenSmall = styled(Box)`
  @media (max-width: 768px) {
    display: none;
  }
`

const CardLayout = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 16px;

  @media (max-width: 768px) {
    height: 280px;
  }
  @media (max-width: 468px) {
  }
`
const LearnMoreButton = styled(Link)`
  padding: 12px 16px;
  border-radius: 24px;
  border: 0;
  background-color: ${({ theme }) => theme.surface2};
  font-family: Basel;
  font-size: 20px;
  font-style: normal;
  font-weight: 535;
  line-height: 24px;
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle}
`
const LearnMoreArrow = styled(ArrowRightCircle)`
  size: 24px;
  stroke: ${({ theme }) => theme.surface2};
  fill: ${({ theme }) => theme.neutral1};
`

const UbeStatsContainer = styled(DarkCard)`
  background-color: ${({ theme }) => (theme.darkMode ? 'rgba(0, 102, 255, 0.04)' : 'rgba(0, 102, 255, 0.04)')};
`

const StyledDot = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.primary1};
`

function LearnMore() {
  const { data } = useDashboardData()
  const media = useMedia()
  return (
    <Row gap="16px">
      <LearnMoreButton to="/swap">
        <Row gap="sm" align="center">
          {media.xs ? 'Swap' : 'Go To Swap'}
          <LearnMoreArrow />
        </Row>
      </LearnMoreButton>
      <Row width="fit-content" gap="8px">
        <StyledDot />
        <ThemedText.BodySecondary>1 UBE = </ThemedText.BodySecondary>
        <ThemedText.BodyPrimary>
          ${parseFloat(parseFloat(data?.ubePrice.toString() || '0').toFixed(4))}
        </ThemedText.BodyPrimary>
      </Row>
    </Row>
  )
}

const ProtocolDescription = () => {
  const { data } = useDashboardData()
  return (
    <div style={{ fontSize: '16px' }}>
      Ubeswap is a protocol for decentralized exchange and automated liquidity provision on Celo. With{' '}
      {data ? data.poolCount : '-'} pairs and {data ? data.tokenCount : '-'} tokens listed on the protocol, Ubeswap
      offers the premier experience of DeFi on Celo.
    </div>
  )
}

function UbeStats() {
  const { data, isLoading } = useDashboardData()
  const { formatNumber } = useFormatter()

  if (isLoading) {
    return (
      <UbeStatsContainer>
        <div>Loading...</div>
      </UbeStatsContainer>
    )
  }

  return (
    <UbeStatsContainer>
      <Row marginBottom="16px">
        <Column flex="1">
          <ThemedText.BodySecondary>Market Cap</ThemedText.BodySecondary>
          <ThemedText.MediumHeader>
            ${formatNumber({ input: data?.ubeMarketCap ?? 0, type: NumberType.TokenNonTx })}
          </ThemedText.MediumHeader>
        </Column>
        <Column flex="1">
          <ThemedText.BodySecondary>Circulating Supply</ThemedText.BodySecondary>
          <ThemedText.MediumHeader>
            {formatNumber({ input: data?.ubeCirculatingSupply ?? 0, type: NumberType.TokenNonTx })}
          </ThemedText.MediumHeader>
        </Column>
      </Row>
      <Row>
        <Column flex="1">
          <ThemedText.BodySecondary>FDV</ThemedText.BodySecondary>
          <ThemedText.MediumHeader>
            ${formatNumber({ input: data?.ubeFdv ?? 0, type: NumberType.TokenNonTx })}
          </ThemedText.MediumHeader>
        </Column>
        <Column flex="1">
          <ThemedText.BodySecondary>Total Supply</ThemedText.BodySecondary>
          <ThemedText.MediumHeader>
            {formatNumber({ input: data?.ubeTotalSupply ?? 0, type: NumberType.TokenNonTx })}
          </ThemedText.MediumHeader>
        </Column>
      </Row>
    </UbeStatsContainer>
  )
}

function Cards({ inView }: { inView: boolean }) {
  const { formatNumber } = useFormatter()
  const { data, isLoading } = useDashboardData()

  if (isLoading) {
    return (
      <CardLayout>
        <Row gap="16px">
          <Column flex="1">
            <StatCard key="stcard1" title="TVL" value="Loading..." delay={0} inView={inView} />
          </Column>
          <Column flex="1">
            <StatCard key="stcard2" title="Volume (24h)" value="Loading..." delay={0.2} inView={inView} />
          </Column>
        </Row>
        <Row gap="16px">
          <Column flex="1">
            <StatCard key="stcard3" title="Users To Date" value="Loading..." delay={0.4} inView={inView} />
          </Column>
          <Column flex="1">
            <StatCard key="stcard4" title="Volume To Date" value="Loading..." delay={0.6} inView={inView} />
          </Column>
        </Row>
      </CardLayout>
    )
  }

  return (
    <CardLayout>
      <Row gap="16px">
        <Column flex="1">
          <StatCard
            title={t`TVL`}
            value={'$' + formatNumber({ input: data?.totalTvl ?? 0, type: NumberType.TokenNonTx })}
            delay={0}
            inView={inView}
          />
        </Column>
        <Column flex="1">
          <StatCard
            title={t`Volume (24h)`}
            value={'$' + formatNumber({ input: data?.volume24h ?? 0, type: NumberType.TokenNonTx })}
            delay={0.2}
            inView={inView}
          />
        </Column>
      </Row>
      <Row gap="16px">
        <Column flex="1">
          <StatCard
            title={t`Users To Date`}
            value={formatNumber({ input: data?.uniqueWallets ?? 0, type: NumberType.WholeNumber })}
            delay={0.4}
            inView={inView}
          />
        </Column>
        <Column flex="1">
          <StatCard
            title={t`Volume To Date`}
            value={'$' + formatNumber({ input: data?.totalVolume ?? 0, type: NumberType.TokenNonTx })}
            delay={0.6}
            inView={inView}
          />
        </Column>
      </Row>
    </CardLayout>
  )
}

export function Stats() {
  const { ref, inView } = useInView()

  return (
    <Container>
      <SectionLayout ref={ref}>
        <HideWhenSmall>
          <Row gap="16px" align="stretch">
            <Column flex="1">
              <Box direction="column" justify="space-between" height="100%">
                <DashboardTitle>Ubeswap Dashboard</DashboardTitle>
                <Body1>
                  <ProtocolDescription />
                </Body1>

                <UbeStats />

                <LearnMore />
              </Box>
            </Column>
            <Column flex="1">
              <Cards inView={inView} />
            </Column>
          </Row>
        </HideWhenSmall>

        <HideWhenLarge maxWidth="1280px" direction="column" gap="32px">
          <Body1>
            <DashboardTitle>Ubeswap Dashboard</DashboardTitle>
            <ProtocolDescription />
          </Body1>
          <UbeStats />
          <LearnMore />

          <Cards inView={inView} />
        </HideWhenLarge>
      </SectionLayout>
    </Container>
  )
}
