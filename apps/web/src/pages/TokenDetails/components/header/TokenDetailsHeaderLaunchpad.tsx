import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Text, iconSizes } from '@universe/mycelium'
import { TestID } from '@universe/test'
import type { LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName, ElementName } from 'uniswap/src/features/telemetry/constants'
import type { TokenProvenanceAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { useEvent } from 'utilities/src/react/hooks'
import { HeaderDivider } from '~/components/StickyCollapsibleHeader/HeaderDivider'
import { getAnalyticsLaunchMethod } from '~/features/Toucan/Auction/utils/provenanceAnalytics'
import {
  getLaunchpadDestination,
  type LaunchpadDestination,
  ProvenanceLaunchpadLink,
} from '~/features/Toucan/Shared/ProvenanceLaunchpadLink'
import { ProvenanceLaunchpadLogo } from '~/features/Toucan/Shared/ProvenanceLaunchpadLogo'
import { useTokenDetailsAuctionDisplay } from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { sendTokenDetailsProvenanceEvent } from '~/pages/TokenDetails/utils/tokenDetailsProvenanceAnalytics'

export type TokenDetailsHeaderLaunchpadModel = LaunchpadDestination & {
  launchpad: LaunchProvenance['launchpad']
  launchMethod: NonNullable<TokenProvenanceAnalyticsProperties['launch_method']>
  /** Reports the in-app launches-list navigation; only the hook reads the display state it needs. */
  onLaunchesPress: () => void
}

/** Launchpad shown in the header, or undefined when the token has no attributed launch. */
export function useTokenDetailsHeaderLaunchpad(): TokenDetailsHeaderLaunchpadModel | undefined {
  const tokenProvenanceEnabled = useFeatureFlag(FeatureFlags.TokenProvenance)
  const display = useTokenDetailsAuctionDisplay()
  const { provenance } = display

  const onLaunchesPress = useEvent(() => {
    sendTokenDetailsProvenanceEvent({
      eventName: AuctionEventName.TokenDetailsToLaunchesClicked,
      display,
      entry_point: 'tdp_header_launchpad',
      destination: 'explore_auctions',
    })
  })

  if (!tokenProvenanceEnabled || !provenance) {
    return undefined
  }

  return {
    launchpad: provenance.launchpad,
    ...getLaunchpadDestination({ provenance }),
    launchMethod: getAnalyticsLaunchMethod(provenance.method),
    onLaunchesPress,
  }
}

export function TokenDetailsHeaderLaunchpad({
  launchpad,
  href,
  isExternal,
  launchMethod,
  onLaunchesPress,
}: TokenDetailsHeaderLaunchpadModel): JSX.Element {
  return (
    <>
      <HeaderDivider alignSelf="stretch" />
      <ProvenanceLaunchpadLink
        launchpad={launchpad}
        href={href}
        isExternal={isExternal}
        element={ElementName.ProvenanceHeaderLaunchpad}
        launchMethod={launchMethod}
        onPress={onLaunchesPress}
      >
        <Flex row alignItems="center" gap="$spacing6" flexShrink={0} testID={TestID.TokenDetailsHeaderLaunchpad}>
          <ProvenanceLaunchpadLogo launchpad={launchpad} size={iconSizes.icon16} />
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {launchpad.name}
          </Text>
        </Flex>
      </ProvenanceLaunchpadLink>
    </>
  )
}
