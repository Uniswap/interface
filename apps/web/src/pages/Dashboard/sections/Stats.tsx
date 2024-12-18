import { t, Trans } from 'i18n'
import { useMemo } from 'react'
import styled from 'styled-components'
import {
  ProtocolVersion,
  useDailyProtocolVolumeQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { Body1, Box, H2 } from '../components/Generics'
import { StatCard } from '../components/StatCard'
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
const Layout = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 234px);
  @media (max-width: 960px) {
    grid-template-rows: repeat(2, 160px);
  }
  @media (max-width: 768px) {
    grid-template-rows: repeat(2, 200px);
  }
  grid-column-gap: 24px;
  grid-row-gap: 16px;
`
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
const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  img {
    width: 54px;
    height: 40px;
    border-radius: 24px;

    @media (max-width: 768px) {
      width: 40px;
      height: 30px;
    }

    @media (max-width: 480px) {
      width: 32px;
      height: 24px;
    }
  }
`

const ProtocolDescription = () => (
  <Trans>
    Ubeswap products are powered by the Ubeswap Protocol. The protocol is the largest onchain marketplace, with billions
    of dollars in weekly volume across thousands of tokens on Ethereum and 7+ additional chains.
  </Trans>
)

export function Stats() {
  const { ref, inView } = useInView()

  return (
    <Container>
      <SectionLayout ref={ref}>
        <HideWhenSmall>
          <Layout>
            <Left>
              <Box direction="column" justify-content="space-between" height="100%">
                <H2>
                  <LogoContainer>
                    <img src="/images/192x192_App_Icon.png" alt="ubeswap" />
                    <Trans style={{ marginBottom: '50px' }}> UBESWAP</Trans>
                  </LogoContainer>
                </H2>
                <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
                  <Body1
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '16px',
                      borderRadius: '12px',
                      width: '100%',
                      marginBottom: '32px',
                    }}
                  >
                    <h3>UBE Price</h3>
                    <h3>Market Cap</h3>
                    <h3>FDV</h3>
                  </Body1>
                  <Body1>
                    <ProtocolDescription />
                  </Body1>
                  {/* <LearnMore /> */}
                </Box>
              </Box>
            </Left>
            <Right>
              <Cards inView={inView} />
            </Right>
          </Layout>
        </HideWhenSmall>
        <HideWhenLarge maxWidth="1280px" direction="column" gap="32px">
          <H2>
            <LogoContainer>
              <img src="/images/192x192_App_Icon.png" alt="ubeswap" />
              <Trans style={{ marginBottom: '50px' }}> UBESWAP</Trans>
            </LogoContainer>
          </H2>
          <Body1
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              width: '100%',
              marginBottom: '32px',
            }}
          >
            <h3>UBE Price</h3>
            <h3>Market Cap</h3>
            <h3>FDV</h3>
          </Body1>
          <Body1>
            <ProtocolDescription />
          </Body1>
          <Cards inView={inView} />

          {/* <LearnMore /> */}
        </HideWhenLarge>
      </SectionLayout>
    </Container>
  )
}

function Cards({ inView }: { inView: boolean }) {
  const { formatNumber } = useFormatter()
  const dailyV2VolumeQuery = useDailyProtocolVolumeQuery({
    variables: {
      version: ProtocolVersion.V2,
    },
  })
  const dailyV3VolumeQuery = useDailyProtocolVolumeQuery({
    variables: {
      version: ProtocolVersion.V3,
    },
  })
  const totalVolume = useMemo(() => {
    // Second to last data point is most recent 24H period
    // Last data point is today's volume, which is still accumulating
    const v2DataPoints = dailyV2VolumeQuery?.data?.historicalProtocolVolume
    const v2Volume = v2DataPoints && v2DataPoints.length >= 2 ? v2DataPoints[v2DataPoints.length - 2].value : 0

    const v3DataPoints = dailyV3VolumeQuery?.data?.historicalProtocolVolume
    const v3Volume = v3DataPoints && v3DataPoints.length >= 2 ? v3DataPoints[v3DataPoints.length - 2].value : 0

    return v2Volume + v3Volume
  }, [dailyV2VolumeQuery?.data?.historicalProtocolVolume, dailyV3VolumeQuery?.data?.historicalProtocolVolume])

  return (
    <CardLayout>
      <LeftTop>
        <StatCard
          title={t`TVL`}
          value={formatNumber({ input: 2 * 10 ** 12, type: NumberType.FiatTokenStats })}
          delay={0}
          inView={inView}
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t`Volume`}
          value={formatNumber({ input: 16.6 * 10 ** 6, type: NumberType.TokenQuantityStats })}
          delay={0.2}
          inView={inView}
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t`Users `}
          value={formatNumber({ input: 3.4 * 10 ** 9, type: NumberType.FiatTokenStats })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t`Volume To Date`}
          value={formatNumber({ input: totalVolume || 500000000, type: NumberType.FiatTokenStats })}
          live
          delay={0.6}
          inView={inView}
        />
      </RightBottom>
    </CardLayout>
  )
}
