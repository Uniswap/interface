import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Flex, Text, TouchableArea } from 'ui/src'
import { validColor } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { LaunchItem } from '~/pages/Launches/launchesModel'
import { getLaunchpadLogoBorderRadius, LaunchpadLogo } from '~/pages/Launches/LaunchpadLogo'
import { LaunchStatPair } from '~/pages/Launches/LaunchStatPair'

const THUMBNAIL_SIZE = 48
const LAUNCHER_BADGE_SIZE = 12
// Shadow/Light/Short from the design.
const CARD_SHADOW = '0 1px 3px rgba(0,0,0,0.03), 0 1px 1px rgba(0,0,0,0.02)'
// Launcher badge background (Pink/Light from the design).
const LAUNCHER_BADGE_BACKGROUND = '#FEF4FF'

/**
 * Regular launch card (All-launches grid): surface2 card with the network conveyed by the
 * thumbnail's standard bottom-right chain badge, the launchpad by its registry icon after the
 * ticker, and the FDV / committed-vol. stat pair. No progress bar here — fill/time data only
 * exists for CCA quick launches, and the grid keeps every tile consistent.
 */
export function LaunchCard({ launch }: { launch: LaunchItem }): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <TouchableArea
      testID={TestID.LaunchCard}
      backgroundColor="$surface2"
      borderRadius="$rounded20"
      p="$spacing12"
      flexDirection="column"
      gap="$spacing12"
      hoverStyle={{ backgroundColor: '$surface2Hovered' }}
      $platform-web={{ boxShadow: CARD_SHADOW }}
      onPress={launch.detailPath ? () => navigate(launch.detailPath as string) : undefined}
    >
      <Flex row gap={10} alignItems="center">
        <TokenLogo
          size={THUMBNAIL_SIZE}
          symbol={launch.symbol}
          name={launch.name}
          url={launch.logoUrl}
          chainId={launch.logoChainId}
        />
        <Flex flex={1} minWidth={0} gap="$spacing4">
          <Text variant="body2" color="$neutral1" numberOfLines={1}>
            {launch.name}
          </Text>
          <Flex row alignItems="center" gap="$spacing6">
            <Text variant="body4" color="$neutral2" numberOfLines={1}>
              {launch.symbol}
            </Text>
            {/* Launchpad registry badge — the only per-source differentiator on the card. */}
            <Flex
              width={LAUNCHER_BADGE_SIZE}
              height={LAUNCHER_BADGE_SIZE}
              borderRadius={getLaunchpadLogoBorderRadius(LAUNCHER_BADGE_SIZE)}
              borderWidth={0.5}
              borderColor="$surface3"
              backgroundColor={validColor(LAUNCHER_BADGE_BACKGROUND)}
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
            >
              <LaunchpadLogo size={LAUNCHER_BADGE_SIZE} url={launch.launchpadLogoUrl} name={launch.launchpadLabel} />
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <LaunchStatPair
        launch={launch}
        volumeLabel={launch.isQuickLaunch ? t('launches.card.committedVol') : t('launches.card.volume24h')}
      />
    </TouchableArea>
  )
}
