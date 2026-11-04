import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { styled } from '@universe/mycelium/styled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { parseToRgb } from 'polished'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { use24hProtocolVolume, useDailyTVLWithChange } from '~/features/Explore/state/protocolStats'
import { LiveIcon, StatCard } from '~/pages/Landing/components/StatCard'
import { useInView } from '~/pages/Landing/sections/useInView'
import { ExternalLink } from '~/theme/components/Links'

// Class universes parity-pinned against the legacy styled() configs in
// packages/tailwind/src/parity/styled-factory (buildStatsContainer / buildStatsGridArea).
const Container = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 w-full max-w-[1360px] items-center p-[40px] media-lg:p-[48px] media-sm:px-[24px] media-sm:pt-[24px] media-sm:pb-0',
})

const SectionLayout = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 w-full max-w-[1280px]',
})

const GridArea = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 grid [grid-template-columns:repeat(4,1fr)] [grid-template-rows:repeat(4,1fr)] [grid-column-gap:12px] [grid-row-gap:12px] media-xs:h-[320px] media-xxs:[grid-column-gap:8px] media-xxs:[grid-row-gap:8px]',
})

const LearnMoreButtonBase = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 p-[12px] px-[16px] rounded-[24px] bg-surface2 self-start',
})

// The legacy Flex forwarded its (inert) `href` straight to the div; keep the attribute.
const LearnMoreButton = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof LearnMoreButtonBase> & { href?: string }
>(function LearnMoreButton(props, ref) {
  return <LearnMoreButtonBase ref={ref} {...props} />
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
          <ArrowRight size="$icon.16" color="$neutral1" />
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

const LeftTop = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 col-start-1 col-end-3 row-start-1 row-end-3',
})

const RightTop = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 col-start-3 col-end-5 row-start-1 row-end-3',
})

const LeftBottom = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 col-start-1 col-end-3 row-start-3 row-end-5',
})

const RightBottom = styled('div', {
  platform: 'web',
  base: 'flex flex-col items-stretch basis-auto box-border relative min-h-[0px] min-w-[0px] shrink-0 col-start-3 col-end-5 row-start-3 row-end-5',
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
    <GridArea className="grid-area">
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
