import { Platform } from '@universe/chains'
import { Flex, Text, useMedia, iconSizes } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Coachmark } from 'ui/src'
import { tokenCardShellProps } from 'uniswap/src/components/TokenCard/constants'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EARN_VAULT_CHIP_FRAME_PROPS, EarnVaultChip } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultsSortedForExplore } from 'uniswap/src/features/earn/utils'
import { CAROUSEL_CARD_GAP, CAROUSEL_FADE_WIDTH_SMALL } from '~/components/TokenCardCarousel/constants'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { LoadingBubble } from '~/components/Tokens/loading'
import { useActiveAddress } from '~/connection/accounts/hooks'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/constants/layout'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultConnectFlow } from '~/features/earn/hooks/useEarnVaultConnectFlow'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import { EXPLORE_HEADING_SIZE_CLASSES } from '~/pages/Explore/exploreHeadingStyles'
import { useExploreEarnDeepLink } from '~/pages/Explore/hooks/useExploreEarnDeepLink'

const EARN_VAULT_CHIP_SKELETON_COUNT = 3
const EARN_VAULT_CHIP_SKELETON_TITLE_HEIGHT = 18
const EARN_VAULT_CHIP_SKELETON_SUBTITLE_HEIGHT = 16
const EARN_COACHMARK_WIDTH = 215
// Two full cards plus a teaser of the third at rest on mobile web.
const EARN_VAULT_CAROUSEL_CARDS_PER_VIEW = 2.3
const EARN_VAULT_CAROUSEL_MIN_CARD_WIDTH = 120

// Not a Text variant: a responsive `$md` variant on Text re-keys the base font too.
const EarnTitle = styled('h3', {
  platform: 'web',
  base: 'm-0 text-neutral1 [font-weight:485] [font-family:var(--stext-font-book)]',
})

/** `containerWidth` is the section's content width; the full-bleed carousel also shows the right-hand gutter. */
function getEarnVaultCarouselCardWidth(containerWidth: number): number {
  const visibleWidth = containerWidth + APP_BODY_MOBILE_GUTTER_PX
  const width = Math.floor((visibleWidth - 2 * CAROUSEL_CARD_GAP) / EARN_VAULT_CAROUSEL_CARDS_PER_VIEW)
  return Math.max(width, EARN_VAULT_CAROUSEL_MIN_CARD_WIDTH)
}

export function EarnVaultsSection() {
  const { t } = useTranslation()
  const { dismissCoachmark, earnSectionRef, shouldShowCoachmark } = useExploreEarnDeepLink()
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const { isLoadingVaults, positionsByVaultId, vaults } = useEarnVaults({ account: evmAccountAddress })
  const exploreVaults = useMemo(() => getEarnVaultsSortedForExplore(vaults), [vaults])
  const { closeModal, openModal, selectedVaultState } = useEarnVaultModalState()
  const media = useMedia()
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, containerWidth } = useCarouselLayout(layoutRef)
  const carouselCardWidth = getEarnVaultCarouselCardWidth(containerWidth)
  const carousel = useHorizontalSnapCarousel({
    cardWidth: carouselCardWidth,
    itemCount: exploreVaults.length,
    isLoading: isLoadingVaults,
  })
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.ExploreChip,
    isVisible: !isLoadingVaults && exploreVaults.length > 0,
    surface: EarnAnalyticsSurface.Web,
  })

  const selectedVault = selectedVaultState?.vault ?? null
  const setSelectedVault = useCallback(
    (vault: EarnVaultInfo | null) => {
      if (vault) {
        openModal(vault)
      } else {
        closeModal()
      }
    },
    [closeModal, openModal],
  )
  const { onConnectWallet } = useEarnVaultConnectFlow({ selectedVault, setSelectedVault })

  return (
    <>
      <Flex
        ref={layoutRef}
        width="100%"
        my="$spacing24"
        $md={{ my: '$spacing12' }}
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        row
        flexWrap="wrap"
        alignItems="center"
        gap="$spacing16"
        // A wrapping column sizes its line to the content, which would stop the full-bleed carousel stretching.
        $xl={{ row: false, flexDirection: 'column', alignItems: 'flex-start', flexWrap: 'nowrap' }}
      >
        <Flex ref={earnSectionRef} minWidth={200} gap="$spacing4" $xl={{ width: '100%' }}>
          <Coachmark
            open={shouldShowCoachmark}
            onDismiss={dismissCoachmark}
            placement="top-start"
            offset={{ mainAxis: 8 }}
            title={t('explore.earn.startEarning')}
            text={t('explore.earn.coachmark.body')}
            width={EARN_COACHMARK_WIDTH}
            testID={TestID.ExploreEarnCoachmark}
          >
            <EarnTitle className={EXPLORE_HEADING_SIZE_CLASSES}>{t('explore.earn.title')}</EarnTitle>
          </Coachmark>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {t('explore.earn.subtitle')}
          </Text>
        </Flex>
        {media.md ? (
          // Bleeds through the app body gutter so cards scroll to the viewport edges.
          <Flex alignSelf="stretch" mx={-APP_BODY_MOBILE_GUTTER_PX}>
            <TokenCardCarousel
              items={exploreVaults}
              getItemKey={(vault) => vault.id}
              renderItem={(vault) => (
                <EarnVaultChip
                  layout="vertical"
                  vault={vault}
                  width={carouselCardWidth}
                  borderRadius={tokenCardShellProps.borderRadius}
                  onPress={() => openModal(vault)}
                />
              )}
              isLoading={isLoadingVaults}
              skeletonCount={EARN_VAULT_CHIP_SKELETON_COUNT}
              skeletonLayout="vertical"
              carousel={carousel}
              cardWidth={carouselCardWidth}
              fadeWidth={CAROUSEL_FADE_WIDTH_SMALL}
              showArrowButtons={false}
              edgeInset={APP_BODY_MOBILE_GUTTER_PX}
              edgeFade="mask"
            />
          </Flex>
        ) : (
          <Flex
            row
            flexWrap="wrap"
            flex={1}
            gap={CAROUSEL_CARD_GAP}
            justifyContent="flex-end"
            $xl={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {isLoadingVaults
              ? Array.from({ length: EARN_VAULT_CHIP_SKELETON_COUNT }, (_, index) => (
                  <Flex key={index} flexShrink={0}>
                    <EarnVaultChipSkeleton index={index} width={cardWidth} />
                  </Flex>
                ))
              : exploreVaults.map((vault) => (
                  <Flex key={vault.id} flexShrink={0}>
                    <EarnVaultChip
                      vault={vault}
                      width={cardWidth}
                      borderRadius={tokenCardShellProps.borderRadius}
                      onPress={() => openModal(vault)}
                    />
                  </Flex>
                ))}
          </Flex>
        )}
      </Flex>
      <EarnVaultModal
        analyticsEntryPoint={EarnEntryPoint.ExploreChip}
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState?.vault ? positionsByVaultId.get(selectedVaultState.vault.id) : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
        onConnectWallet={onConnectWallet}
      />
    </>
  )
}

function EarnVaultChipSkeleton({ index, width }: { index: number; width: number }): JSX.Element {
  const delay = `${index * 0.1}s`

  return (
    <Flex
      {...EARN_VAULT_CHIP_FRAME_PROPS}
      width={width}
      maxWidth={width}
      borderRadius={tokenCardShellProps.borderRadius}
    >
      <LoadingBubble
        round
        height={iconSizes.icon32}
        width={iconSizes.icon32}
        delay={delay}
        containerProps={{ width: iconSizes.icon32, height: iconSizes.icon32, flexShrink: 0 }}
      />
      <Flex flex={1} gap="$spacing4" minWidth={0}>
        <LoadingBubble
          height={EARN_VAULT_CHIP_SKELETON_TITLE_HEIGHT}
          width="45%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
        <LoadingBubble
          height={EARN_VAULT_CHIP_SKELETON_SUBTITLE_HEIGHT}
          width="70%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
    </Flex>
  )
}
