import { t, Trans } from '@lingui/macro'
import Row from 'components/Row'
import { ProtocolVersion, useDailyProtocolVolumeQuery } from 'graphql/data/__generated__/types-and-hooks'
import { useMemo } from 'react'
import { ArrowRightCircle } from 'react-feather'
import styled from 'styled-components'
import { ClickableStyle, ExternalLink } from 'theme/components'
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
const LearnMoreButton = styled(ExternalLink)`
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
const ProtocolDescription = () => (
  <Trans>
    Uniswap products are powered by the Uniswap Protocol. The protocol is the largest onchain marketplace, with billions
    of dollars in weekly volume across thousands of tokens on Ethereum and 7+ additional chains.
  </Trans>
)
function LearnMore() {
  return (
    <LearnMoreButton href="https://info.uniswap.org">
      <Row gap="sm" align="center">
        <Trans>Learn more</Trans>
        <LearnMoreArrow />
      </Row>
    </LearnMoreButton>
  )
}
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
                  <Trans>Trusted by millions</Trans>
                </H2>
                <Box bottom="0" position="absolute" direction="column" maxWidth="480px" gap="24px">
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
        <HideWhenLarge maxWidth="1280px" direction="column" gap="32px">
          <H2>
            <Trans>Trusted by millions</Trans>
          </H2>
          <Cards inView={inView} />
          <Body1>
            <ProtocolDescription />
          </Body1>
          <LearnMore />
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
          title={t`All time volume`}
          value={formatNumber({ input: 1.8 * 10 ** 12, type: NumberType.FiatTokenStats })}
          delay={0}
          inView={inView}
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t`All time swappers`}
          value={formatNumber({ input: 14.9 * 10 ** 6, type: NumberType.TokenQuantityStats })}
          delay={0.2}
          inView={inView}
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t`All time LP fees `}
          value={formatNumber({ input: 3.2 * 10 ** 9, type: NumberType.FiatTokenStats })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t`24H volume`}
          value={formatNumber({ input: totalVolume || 500000000, type: NumberType.FiatTokenStats })}
          live
          delay={0.6}
          inView={inView}
        />
      </RightBottom>
    </CardLayout>
  )
}
