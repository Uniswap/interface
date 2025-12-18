import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { LiveIcon, StatCard } from 'pages/Landing/components/StatCard'
import { useInView } from 'pages/Landing/sections/useInView'
import { parseToRgb } from 'polished'
import { useTranslation } from 'react-i18next'
import { use24hProtocolVolume, useDailyTVLWithChange } from 'state/explore/protocolStats'
import { ExternalLink } from 'theme/components/Links'
import { Flex, styled, Text, useSporeColors } from 'ui/src'
import { RightArrow } from 'ui/src/components/icons/RightArrow'

import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

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

const GridArea = styled(Flex, {
  className: 'grid-area',

  '$platform-web': {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gridColumnGap: '12px',
    gridRowGap: '12px',
  },

  $xs: {
    height: 320,
  },

  $xxs: {
    '$platform-web': {
      gridColumnGap: '8px',
      gridRowGap: '8px',
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

function GetStarted() {
  const { t } = useTranslation()
  const isUnificationCopyEnabled = useFeatureFlag(FeatureFlags.UnificationCopy)

  return (
    <LearnMoreButton href="/explore">
      <ExternalLink href="/explore" style={{ stroke: 'unset' }}>
        <Flex row gap="$gap8" alignItems="center">
          <Text variant="buttonLabel1">
            {isUnificationCopyEnabled ? t('landing.getStarted') : t('landing.getStarted.old')}
          </Text>
          <RightArrow size="$icon.24" color="$neutral1" />
        </Flex>
      </ExternalLink>
    </LearnMoreButton>
  )
}

export function Stats() {
  const { t } = useTranslation()
  const { ref, inView } = useInView()
  const colors = useSporeColors()
  const { red, green, blue } = parseToRgb(colors.neutral2.val)
  const isUnificationCopyEnabled = useFeatureFlag(FeatureFlags.UnificationCopy)

  return (
    <Container>
      <SectionLayout ref={ref}>
        <Flex row justifyContent="space-between" gap="$gap24" $lg={{ flexDirection: 'column', gap: '$gap32' }}>
          <Flex justifyContent="space-between" flex={0} gap="$gap32">
            <Text variant="heading1" $md={{ variant: 'heading2' }}>
              {t('landing.trusted')}
            </Text>
            <Flex gap="$spacing24">
              <Text variant="heading2" $lg={{ variant: 'heading3' }} $md={{ fontSize: 18, lineHeight: 24 }}>
                {isUnificationCopyEnabled ? t('landing.protocolDescription') : t('landing.protocolDescription.old')}
              </Text>
              <GetStarted />
            </Flex>
          </Flex>
          <Flex gap="$gap12" maxWidth="50%" $lg={{ maxWidth: '100%' }}>
            <Flex
              backgroundColor="$surface2"
              borderRadius="$rounded20"
              py="$spacing16"
              px="$spacing20"
              gap="$spacing8"
              alignItems="center"
              row
              backgroundImage={`radial-gradient(rgba(${red}, ${green}, ${blue}, 0.25) 0.5px, transparent 0)`}
              backgroundSize="12px 12px"
              backgroundPosition="-8.5px -8.5px"
            >
              <LiveIcon display="block" />
              <Text
                variant="heading3"
                color="$neutral2"
                fontWeight="$medium"
                $xl={{ fontSize: 18, lineHeight: 24 }}
                $lg={{ lineHeight: 20 }}
              >
                {t('landing.protocolStats')}
              </Text>
            </Flex>
            <Cards inView={inView} />
          </Flex>
        </Flex>
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
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { totalVolume } = use24hProtocolVolume()
  const { totalTVL } = useDailyTVLWithChange()
  // Currently hardcoded, BE task [DAT-1435] to make this data available
  const allTimeVolume = 4.0 * 10 ** 12
  const allTimeSwappers = 119 * 10 ** 6

  return (
    <GridArea>
      <LeftTop>
        <StatCard
          title={t('stats.allTimeVolume')}
          value={convertFiatAmountFormatted(allTimeVolume, NumberType.FiatTokenStats)}
          delay={0}
          inView={inView}
        />
      </LeftTop>
      <RightTop>
        <StatCard
          title={t('stats.tvl')}
          value={convertFiatAmountFormatted(totalTVL, NumberType.FiatTokenStats)}
          delay={0.2}
          inView={inView}
        />
      </RightTop>
      <LeftBottom>
        <StatCard
          title={t('stats.allTimeSwappers')}
          value={formatNumberOrString({
            value: allTimeSwappers,
            type: NumberType.TokenQuantityStats,
          })}
          delay={0.4}
          inView={inView}
        />
      </LeftBottom>
      <RightBottom>
        <StatCard
          title={t('stats.24swapVolume')}
          value={convertFiatAmountFormatted(totalVolume, NumberType.FiatTokenStats)}
          live
          delay={0.6}
          inView={inView}
        />
      </RightBottom>
    </GridArea>
  )
}
