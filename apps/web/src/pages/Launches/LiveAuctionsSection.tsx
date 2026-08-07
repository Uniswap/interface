import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { GridView } from 'ui/src/components/icons/GridView'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import {
  AuctionQuickFilter,
  ExploreTablesFilterStoreContextProvider,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { TOUCAN_AUCTION_SUPPORTED_CHAINS } from '~/features/Toucan/supportedChains'
import { ExploreFilterChip } from '~/pages/Explore/categories/ExploreCategoryChips'
import { ToucanTable } from '~/pages/Explore/tables/Auctions/TopAuctionsTable'
import { useLaunchpads } from '~/pages/Launches/data/useLaunchpads'
import { getLaunchpadDisplay, UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'

/** All / Verified quick-select chips for Live auctions, driving the shared auction filter store. */
function LiveAuctionsQuickSelects(): JSX.Element {
  const { t } = useTranslation()
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter } = useExploreTablesFilterStoreActions()

  const chips = useMemo(
    () => [
      {
        value: AuctionQuickFilter.All,
        label: t('common.all'),
        renderIcon: (color: '$neutral1' | '$neutral2') => <GridView size="$icon.20" color={color} />,
      },
      {
        value: AuctionQuickFilter.Verified,
        label: t('toucan.filter.verified'),
        renderIcon: (color: '$neutral1' | '$neutral2') => <CheckmarkCircle size="$icon.20" color={color} />,
      },
    ],
    [t],
  )

  return (
    <Flex row gap="$gap4" flexWrap="wrap">
      {chips.map((chip) => (
        <ExploreFilterChip
          key={chip.value}
          active={quickFilter === chip.value}
          label={chip.label}
          renderIcon={chip.renderIcon}
          onPress={() => setQuickFilter(chip.value)}
        />
      ))}
    </Flex>
  )
}

/** Live-auctions controls + table (shares the Explore auctions store within this subtree). */
function LiveAuctionsInner(): JSX.Element {
  const [chainId, setChainId] = useState<UniverseChainId | undefined>(undefined)

  // Every live auction is a Uniswap CCA auction, so the table's Launchpad column shows one
  // launchpad — resolved through the same ListLaunchpads registry lookup the launch feed uses.
  const { launchpadById, isLoading: launchpadsLoading } = useLaunchpads()
  const { label: ccaLabel, logoUrl: ccaLogoUrl } = getLaunchpadDisplay({
    launchpadId: UNISWAP_CCA_LAUNCHPAD_ID,
    launchpadById,
  })
  // Memoized on the resolved primitives (not the registry map) so registry refetches can't churn
  // the object identity — an identity change would rebuild the table's column defs and remount the
  // logo, flashing it. While the registry is still resolving, the logo renders as a skeleton
  // instead of flashing the letter fallback and then swapping to the Uniswap mark.
  const ccaLaunchpad = useMemo(
    () => ({ label: ccaLabel, logoUrl: ccaLogoUrl, logoLoading: launchpadsLoading && ccaLogoUrl === undefined }),
    [ccaLabel, ccaLogoUrl, launchpadsLoading],
  )

  return (
    <Flex gap="$spacing16">
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        width="100%"
        gap="$spacing16"
        $lg={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <LiveAuctionsQuickSelects />
        <Flex row gap="$spacing8" justifyContent="flex-start" $md={{ width: '100%' }}>
          <NetworkFilter
            position="right"
            currentChainId={chainId}
            networks={TOUCAN_AUCTION_SUPPORTED_CHAINS}
            tracePage={InterfacePageName.LaunchesPage}
            onPress={setChainId}
          />
        </Flex>
      </Flex>
      {/* liveOnly keeps only in-progress + upcoming auctions (server-side); chainId drives the fetch off URL params. */}
      <ToucanTable chainId={chainId} liveOnly pageSize={50} launchpad={ccaLaunchpad} />
    </Flex>
  )
}

/**
 * Live-auctions view: the exact Explore auctions table (ToucanTable), scoped to its own filter
 * store so the shared search/quick-filter state doesn't leak between surfaces.
 */
export function LiveAuctionsSection(): JSX.Element {
  return (
    <ExploreTablesFilterStoreContextProvider>
      <LiveAuctionsInner />
    </ExploreTablesFilterStoreContextProvider>
  )
}
