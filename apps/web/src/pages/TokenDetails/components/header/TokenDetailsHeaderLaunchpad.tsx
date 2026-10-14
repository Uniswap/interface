import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, iconSizes } from '@universe/mycelium'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'
import { getLaunchProvenanceFromAuction } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import { ProvenanceLaunchpadLogo } from '~/features/Toucan/Shared/ProvenanceLaunchpadLogo'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

/** Launchpad shown in the header, or undefined when the module is hidden. */
export function useTokenDetailsHeaderLaunchpad(): LaunchProvenance['launchpad'] | undefined {
  const tokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const auctionSource = useTDPStore((state) => state.auctionSource)

  if (!tokenProvenanceEnabled || auctionSource.status !== TokenDetailsSourceState.Found) {
    return undefined
  }

  // Canonical launchpad metadata is not served yet; resolved auctions identify Uniswap CCA.
  return getLaunchProvenanceFromAuction({ auction: auctionSource.auction }).launchpad
}

export function TokenDetailsHeaderLaunchpad({ launchpad }: { launchpad: LaunchProvenance['launchpad'] }): JSX.Element {
  return (
    <>
      <HeaderDivider alignSelf="stretch" />
      <Flex row alignItems="center" gap="$spacing6" flexShrink={0}>
        <ProvenanceLaunchpadLogo launchpad={launchpad} size={iconSizes.icon16} />
        <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
          {launchpad.name}
        </Text>
      </Flex>
    </>
  )
}
