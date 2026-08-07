import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Flex, Image, Text, useIsDarkMode, useSporeColors } from 'ui/src'
import { ROBINHOOD_LOGO } from 'ui/src/assets'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { PoolsLogo } from 'ui/src/components/icons/PoolsLogo'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { DeltaArrow, getDeltaTextColor } from '~/components/DeltaArrow/DeltaArrow'
import { POOLS_URL } from '~/pages/Launches/constants'
import { LaunchItem } from '~/pages/Launches/launchesModel'
import { usePoolsBrandGreen } from '~/pages/Launches/usePoolsBrandGreen'

const HERO_ICON_SIZE = 48
const HERO_ARROW_SIZE = 44
const HERO_PADDING = 24
const HERO_PADDING_MD = 16
const QUICK_LAUNCH_PILL_LOGO_SIZE = 24

// The strip is rendered twice, so animating 0 -> -50% scrolls the pills right-to-left in a seamless loop.
const quickLaunchScrollKeyframes = `
  @keyframes launches-quick-scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
`

/** Rounded pill for one quick launch: token logo, name, and 24h delta (arrow + percent). */
function QuickLaunchPill({ launch }: { launch: LaunchItem }): JSX.Element {
  const { formatPercent } = useLocalizationContext()
  const delta = launch.priceChangePercent24h

  return (
    <Flex
      row
      alignItems="center"
      gap="$spacing8"
      py="$spacing8"
      px="$spacing12"
      mr="$spacing12"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface2"
    >
      <TokenLogo
        chainId={launch.logoChainId}
        size={QUICK_LAUNCH_PILL_LOGO_SIZE}
        symbol={launch.symbol}
        name={launch.name}
        url={launch.logoUrl}
      />
      <Text variant="body3" color="$neutral1" numberOfLines={1}>
        {launch.name}
      </Text>
      {delta !== undefined && (
        <Flex row alignItems="center" gap="$gap4">
          <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} size={iconSizes.icon16} />
          <Text variant="body3" color={getDeltaTextColor(delta)}>
            {formatPercent(Math.abs(delta))}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

/** Auto-scrolling, edge-faded marquee of quick-launch pills that bleeds to the hero card's edges. */
function QuickLaunchMarquee({ launches }: { launches: LaunchItem[] }): JSX.Element {
  const colors = useSporeColors()

  // One pill per distinct token; the strip is duplicated below purely for the seamless loop.
  const strip = useMemo(() => {
    const byId = new Map(launches.map((launch) => [launch.id, launch]))
    return Array.from(byId.values())
  }, [launches])

  return (
    <Flex
      alignSelf="stretch"
      mt="$spacing16"
      mx={-HERO_PADDING}
      $md={{ mx: -HERO_PADDING_MD }}
      position="relative"
      overflow="hidden"
    >
      <style>{quickLaunchScrollKeyframes}</style>
      <Flex row style={{ animation: 'launches-quick-scroll 60s linear infinite' }}>
        {strip.map((launch) => (
          <QuickLaunchPill key={`quick-a-${launch.id}`} launch={launch} />
        ))}
        {strip.map((launch) => (
          <QuickLaunchPill key={`quick-b-${launch.id}`} launch={launch} />
        ))}
      </Flex>
      <Flex
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        right={0}
        pointerEvents="none"
        zIndex={1}
        $platform-web={{
          background: `linear-gradient(90deg, ${colors.surface1.val} 0%, transparent 8%, transparent 92%, ${colors.surface1.val} 100%)`,
        }}
      />
    </Flex>
  )
}

/**
 * Promo hero linking out to pools.trade: Robinhood tile + "Launch and trade" heading, a
 * "Pools is live" subtitle, and a trailing round arrow. When there are Robinhood Chain quick
 * launches, a looping marquee of their pills scrolls along the foot of the card. The whole card
 * is the link.
 */
export function LaunchesHero({ quickLaunches }: { quickLaunches: LaunchItem[] }): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const dotColor = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  const poolsBrandGreen = usePoolsBrandGreen()

  return (
    <Trace logPress element={ElementName.LaunchesHero}>
      <Anchor
        testID={TestID.LaunchesHero}
        href={POOLS_URL}
        target="_blank"
        rel="noopener noreferrer"
        textDecorationLine="none"
        display="flex"
        flexDirection="column"
        gap="$spacing16"
        p="$spacing24"
        borderRadius="$rounded24"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        overflow="hidden"
        hoverStyle={{ borderColor: '$surface3Hovered' }}
        $platform-web={{
          backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
        $md={{ p: '$spacing16' }}
      >
        <Flex row alignItems="center" justifyContent="space-between" gap="$spacing16" width="100%">
          <Flex row alignItems="center" gap="$spacing16" flexShrink={1} minWidth={0}>
            <Image
              source={ROBINHOOD_LOGO}
              width={HERO_ICON_SIZE}
              height={HERO_ICON_SIZE}
              borderRadius="$rounded12"
              alignSelf="flex-start"
            />
            <Flex flexShrink={1} minWidth={0} gap="$spacing2">
              <Text variant="heading3" color="$neutral1" numberOfLines={1} $md={{ variant: 'subheading1' }}>
                {t('launches.hero.title')}
              </Text>
              <Flex row alignItems="center" gap="$gap4" flexWrap="wrap">
                <Text variant="body1" color="$neutral2" $md={{ variant: 'body2' }}>
                  {t('launches.hero.subtitle')}
                </Text>
                <Flex row alignItems="center" gap="$gap4">
                  <PoolsLogo size="$icon.20" color={poolsBrandGreen} />
                  <Text variant="body1" color={poolsBrandGreen} $md={{ variant: 'body2' }}>
                    {t('common.pools')}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Flex
            width={HERO_ARROW_SIZE}
            height={HERO_ARROW_SIZE}
            borderRadius="$roundedFull"
            backgroundColor="$surface3"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <ArrowRight size="$icon.20" color="$neutral1" />
          </Flex>
        </Flex>
        {quickLaunches.length > 0 && <QuickLaunchMarquee launches={quickLaunches} />}
      </Anchor>
    </Trace>
  )
}
