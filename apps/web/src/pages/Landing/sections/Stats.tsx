import { Body1, H2 } from 'pages/Landing/components/Generics'
import { StatCard } from 'pages/Landing/components/StatCard'
import { useInView } from 'pages/Landing/sections/useInView'
import { useMemo } from 'react'
import { ArrowRightCircle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text, styled, useSporeColors } from 'ui/src'
import {
  ProtocolVersion,
  useDailyProtocolVolumeQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Container = styled(Flex, {
  width: '100%',
  maxWidth: 1360,
  alignItems: 'center',
  p: 40,

  $lg: {
    p: 48,
  },

  $sm: {
    p: 24,
  },
})

const SectionLayout = styled(Flex, {
  width: '100%',
  maxWidth: 1280,
})

const HideWhenAboveMedium = styled(Flex, {
  display: 'none',

  $md: {
    display: 'flex',
  },
})

const HideWhenMedium = styled(Flex, {
  display: 'flex',

  $md: {
    display: 'none',
  },
})

const GridArea = styled(Flex, {
  className: 'grid-area',
  height: '100%',

  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gridColumnGap: '16px',
    gridRowGap: '16px',
  },

  $xs: {
    height: 320,

    '$platform-web': {
      gridColumnGap: '12px',
      gridRowGap: '12px',
    },
  },

  $xxs: {
    '$platform-web': {
      gridColumnGap: '8px',
      gridRowGap: '8px',
    },
  },
})

const Layout = styled(Flex, {
  width: '100%',

  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 234px)',
    gridColumnGap: '24px',
    gridRowGap: '16px',
    gap: '16px',
  },

  $md: {
    '$platform-web': {
      gridTemplateRows: 'repeat(2, 160px)',
    },
  },

  $lg: {
    '$platform-web': {
      gridTemplateRows: 'repeat(2, 200px)',
    },
  },
})

const LearnMoreButton = styled(Flex, {
  p: 12,
  px: 16,
  borderRadius: 24,
  backgroundColor: '$surface2',
  alignSelf: 'flex-start',
})

const ProtocolDescription = () => <Trans i18nKey="landing.protocolDescription" />

function LearnMore() {
  const colors = useSporeColors()

  return (
    <LearnMoreButton href="/explore">
      <ExternalLink href="/explore">
        <Flex row gap="$gap8" alignItems="center">
          <Text fontSize={20} lineHeight={24} color="$neutral1">
            <Trans i18nKey="common.button.learn" />
          </Text>
          <ArrowRightCircle size={24} stroke={colors.surface2.val} fill={colors.neutral1.val} />
        </Flex>
      </ExternalLink>
    </LearnMoreButton>
  )
}

export function Stats() {
  const { ref, inView } = useInView()

  return (
    <Container>
      <SectionLayout ref={ref}>
        <HideWhenMedium>
          <Layout>
            <Flex start={1} end={3} gridRowStart={1} gridRowEnd={3} height="100%">
              <Flex justifyContent="space-between" height="100%">
                <H2>
                  <Trans i18nKey="landing.trusted" />
                </H2>
                <Flex bottom={0} position="absolute" maxWidth={480} gap="$spacing24">
                  <Body1>
                    <ProtocolDescription />
                  </Body1>
                  <LearnMore />
                </Flex>
              </Flex>
            </Flex>
            <Flex start={2} end={3} gridRowStart={1} gridRowEnd={3} height="100%">
              <Cards inView={inView} />
            </Flex>
          </Layout>
        </HideWhenMedium>
        <HideWhenAboveMedium maxWidth={1280} gap="$spacing32">
          <Text fontSize={32}>
            <Trans i18nKey="landing.trusted" />
          </Text>
          <Cards inView={inView} />
          <Body1>
            <ProtocolDescription />
          </Body1>
          <LearnMore />
        </HideWhenAboveMedium>
      </SectionLayout>
    </Container>
  )
}

const LeftTop = styled(Flex, {
  '$platform-web': {
    gridColumnStart: 1,
    gridColumnEnd: 3,
    gridRowStart: 1,
    gridRowEnd: 3,
  },
})

const RightTop = styled(Flex, {
  '$platform-web': {
    gridColumnStart: 3,
    gridColumnEnd: 5,
    gridRowStart: 1,
    gridRowEnd: 3,
  },
})

const LeftBottom = styled(Flex, {
  '$platform-web': {
    gridColumnStart: 1,
    gridColumnEnd: 3,
    gridRowStart: 3,
    gridRowEnd: 5,
  },
})

const RightBottom = styled(Flex, {
  '$platform-web': {
    gridColumnStart: 3,
    gridColumnEnd: 5,
    gridRowStart: 3,
    gridRowEnd: 5,
  },
})

function Cards({ inView }: { inView: boolean }) {
  const { t } = useTranslation()
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
    <GridArea>
      <LeftTop>
        <StatCard
          title={t('stats.allTimeVolume')}
          value={formatNumber({ input: 2.2 * 10 ** 12, type: NumberType.FiatTokenStats })}
          delay={0}
          inView={inView}
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t('stats.allTimeSwappers')}
          value={formatNumber({ input: 16.6 * 10 ** 6, type: NumberType.TokenQuantityStats })}
          delay={0.2}
          inView={inView}
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t('stats.allTimeFees')}
          value={formatNumber({ input: 3.4 * 10 ** 9, type: NumberType.FiatTokenStats })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t('stats.24volume')}
          value={formatNumber({ input: totalVolume || 500000000, type: NumberType.FiatTokenStats })}
          live
          delay={0.6}
          inView={inView}
        />
      </RightBottom>
    </GridArea>
  )
}
