import Row from 'components/Row'
import { t, Trans } from 'i18n'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { Body1, Box, H2 } from '../components/Generics'
import { StatCard } from '../components/StatCard'
import { useDashboardData } from '../use-dashboard-data'
import { useInView } from './useInView'

// Ana konteyner - tüm içeriği merkezler ve responsive padding sağlar
const Container = styled.div`
  width: 100%;
  max-width: 1360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40px;

  // Tablet boyutunda yükseklik sınırlaması
  @media (max-width: 960px) {
    max-height: 360px;
  }

  // Mobil görünüm için padding ayarlamaları
  @media (max-width: 768px) {
    max-height: none;
    padding: 0 48px;
  }
  @media (max-width: 468px) {
    padding: 0 24px;
  }
`

// Ana içerik bölümü için genişlik sınırlaması
const SectionLayout = styled(Box)`
  width: 100%;
  max-width: 1280px;
`

// Mobilde gizlenecek masaüstü görünümü
const HideWhenLarge = styled(Box)`
  @media (min-width: 768px) {
    display: none;
  }
`

// Masaüstünde gizlenecek mobil görünümü
const HideWhenSmall = styled(Box)`
  @media (max-width: 768px) {
    display: none;
  }
`

// Logo ve başlık için özel konteyner
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  img {
    width: 64px;
    // height: 40px;
    border-radius: 50%;

    @media (max-width: 768px) {
      width: 48px;
      // height: 30px;
    }

    @media (max-width: 480px) {
      width: 48px;
      // height: 24px;
    }
  }
`

// İstatistik kartları için grid düzeni
const CardLayout = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  grid-column-gap: 16px;
  grid-row-gap: 16px;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 320px;
    grid-column-gap: 12px;
    grid-row-gap: 12px;
  }

  @media (max-width: 468px) {
    grid-column-gap: 8px;
    grid-row-gap: 8px;
  }
`

// Ana layout için grid yapısı
const Layout = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 234px);
  grid-column-gap: 24px;
  grid-row-gap: 16px;

  @media (max-width: 960px) {
    grid-template-rows: repeat(2, 160px);
  }
  @media (max-width: 768px) {
    grid-template-rows: repeat(2, 200px);
  }
`

// Grid pozisyonları için stil bileşenleri
const Left = styled.div`
  grid-column-start: 1;
  grid-column-end: 2;
  grid-row-start: 1;
  grid-row-end: 3;
  height: 100%;
`

const Right = styled.div`
  grid-column-start: 2;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 3;
  height: 100%;
`

// Kart pozisyonları için stil bileşenleri
const LeftTop = styled.div`
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 3;
`

const RightTop = styled.div`
  grid-column-start: 3;
  grid-column-end: 5;
  grid-row-start: 1;
  grid-row-end: 3;
`

const LeftBottom = styled.div`
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 3;
  grid-row-end: 5;
`

const RightBottom = styled.div`
  grid-column-start: 3;
  grid-column-end: 5;
  grid-row-start: 3;
  grid-row-end: 5;
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

function LearnMore() {
  return (
    <LearnMoreButton to="/swap">
      <Row gap="sm" align="center">
        <Trans>Go To Swap</Trans>
        <LearnMoreArrow />
      </Row>
    </LearnMoreButton>
  )
}

// Protokol açıklaması için bileşen
const ProtocolDescription = () => (
  <Trans>
    Ubeswap products are powered by the Ubeswap Protocol. The protocol is the largest onchain marketplace, with billions
    of dollars in weekly volume across thousands of tokens on Ethereum and 7+ additional chains.
  </Trans>
)

// UBE istatistiklerini gösteren bileşen
function UbeStats() {
  const { data, isLoading } = useDashboardData()
  const { formatNumber } = useFormatter()

  if (isLoading) {
    return (
      <Body1
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '16px',
          borderRadius: '12px',
          width: '100%',
          marginBottom: '32px',
        }}
      >
        <div>Loading...</div>
      </Body1>
    )
  }

  return (
    <Body1
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '36px',
        borderRadius: '12px',
        width: '100%',
        marginBottom: '32px',
        fontSize: '24px',
        opacity: 0.8,
      }}
    >
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <div>UBE Price:</div> <div>{formatNumber({ input: data?.ubePrice ?? 0, type: NumberType.FiatTokenPrice })}</div>
      </div>
      <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <div>Market Cap:</div>{' '}
        <div>{formatNumber({ input: data?.ubeMarketCap ?? 0, type: NumberType.FiatTokenStats })}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>FDV:</div> <div>{formatNumber({ input: data?.UbeFdv ?? 0, type: NumberType.FiatTokenStats })}</div>
      </div>
    </Body1>
  )
}

// İstatistik kartları bileşeni
function Cards({ inView }: { inView: boolean }) {
  const { formatNumber } = useFormatter()
  const { data, isLoading } = useDashboardData()

  if (isLoading) {
    return (
      <CardLayout>
        {['TVL', 'Volume (24h)', 'Users', 'Volume To Date'].map((title, index) => (
          <div
            key={title}
            style={{
              gridColumn: index < 2 ? '1/3' : '3/5',
              gridRow: index % 2 === 0 ? '1/3' : '3/5',
            }}
          >
            <StatCard title={title} value="Loading..." delay={index * 0.2} inView={inView} />
          </div>
        ))}
      </CardLayout>
    )
  }

  return (
    <CardLayout>
      <LeftTop>
        <StatCard
          title={t`TVL`}
          value={formatNumber({ input: data?.totalTvl ?? 0, type: NumberType.FiatTokenStats })}
          delay={0}
          inView={inView}
          prefix="$"
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t`Volume (24h)`}
          value={formatNumber({ input: data?.volume24h ?? 0, type: NumberType.FiatTokenStats })}
          delay={0.2}
          inView={inView}
          prefix="$"
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t`Users`}
          value={formatNumber({ input: data?.uniqueWallets ?? 0, type: NumberType.WholeNumber })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t`Volume To Date`}
          value={formatNumber({ input: data?.totalVolume ?? 0, type: NumberType.FiatTokenStats })}
          delay={0.6}
          inView={inView}
          prefix="$"
          // live
        />
      </RightBottom>
    </CardLayout>
  )
}

// Ana Stats bileşeni
export function Stats() {
  const { ref, inView } = useInView()

  return (
    <Container>
      <SectionLayout ref={ref}>
        {/* Masaüstü görünümü */}
        <HideWhenSmall>
          <Layout>
            <Left>
              <Box direction="column" justify-content="space-between" height="100%">
                <H2>
                  <LogoContainer>
                    <img src="/images/192x192_App_Icon.png" alt="ubeswap" />
                    <Trans style={{ marginBottom: '50px' }}> Ubeswap</Trans>
                  </LogoContainer>
                </H2>
                <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
                  <UbeStats />
                  <Body1>
                    <ProtocolDescription />
                  </Body1>
                  <LearnMore />
                </Box>
              </Box>
            </Left>
            <Right>
              <Cards inView={inView} />
            </Right>
          </Layout>
        </HideWhenSmall>

        {/* Mobil görünümü */}
        <HideWhenLarge maxWidth="1280px" direction="column" gap="32px">
          <H2>
            <LogoContainer>
              <img src="/images/192x192_App_Icon.png" alt="ubeswap" />
              <Trans style={{ marginBottom: '50px' }}> Ubeswap</Trans>
            </LogoContainer>
          </H2>
          <UbeStats />
          <Body1>
            <ProtocolDescription />
          </Body1>
          <Cards inView={inView} />
        </HideWhenLarge>
      </SectionLayout>
    </Container>
  )
}
