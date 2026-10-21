import { UniverseChainId } from '@universe/chains'
import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilter/useNetworkSelectorOptions'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioData } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { DataApiOutageBanner } from 'uniswap/src/features/dataApi/outage/DataApiOutageBanner'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { ElementName, InterfacePageName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { buildNetworkFilterSelectedChainFields } from 'uniswap/src/features/telemetry/utils/buildNetworkFilterSelectedChainFields'
import { useEvent } from 'utilities/src/react/hooks'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useDataApiOutageModal } from '~/hooks/useDataApiOutageModal'
import { useScrollCompact } from '~/hooks/useScrollCompact'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioAddressDisplay } from '~/pages/Portfolio/Header/PortfolioAddressDisplay/PortfolioAddressDisplay'
import { PortfolioMoreMenu } from '~/pages/Portfolio/Header/PortfolioMoreMenu'
import { SharePortfolioButton } from '~/pages/Portfolio/Header/SharePortfolioButton'
import { PortfolioTabs } from '~/pages/Portfolio/Header/Tabs'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'
import { usePortfolioOutageContext } from '~/pages/Portfolio/PortfolioOutageContext'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

function getPageNameFromTab(tab: PortfolioTab | undefined): InterfacePageName {
  switch (tab) {
    case PortfolioTab.Overview:
      return InterfacePageName.PortfolioPage
    case PortfolioTab.Tokens:
      return InterfacePageName.PortfolioTokensPage
    case PortfolioTab.Pools:
      return InterfacePageName.PortfolioPoolsPage
    case PortfolioTab.Defi:
      return InterfacePageName.PortfolioDefiPage
    case PortfolioTab.Nfts:
      return InterfacePageName.PortfolioNftsPage
    case PortfolioTab.Activity:
      return InterfacePageName.PortfolioActivityPage
    default:
      return InterfacePageName.PortfolioPage
  }
}

function getOutageState({
  tab,
  activityError,
  activityDataUpdatedAt,
  portfolioError,
  portfolioDataUpdatedAt,
}: {
  tab: PortfolioTab | undefined
  activityError: Error | undefined
  activityDataUpdatedAt: number | undefined
  portfolioError: Error | undefined
  portfolioDataUpdatedAt: number | undefined
}): DataApiOutageState {
  switch (tab) {
    case PortfolioTab.Activity:
      return { error: activityError, dataUpdatedAt: activityDataUpdatedAt }
    case PortfolioTab.Nfts:
      return { error: undefined, dataUpdatedAt: undefined }
    default:
      return { error: portfolioError, dataUpdatedAt: portfolioDataUpdatedAt }
  }
}

interface PortfolioHeaderProps {
  enableScrollCompact?: boolean
  isCompact?: boolean
}

export function PortfolioHeader({ enableScrollCompact = false, isCompact: isCompactProp }: PortfolioHeaderProps) {
  const scrollCompact = useScrollCompact({})
  const isCompact = isCompactProp ?? (enableScrollCompact && scrollCompact)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const media = useMedia()
  const { tab, chainId: currentChainId, externalAddress, isExternalWallet } = usePortfolioRoutes()
  const activeAddresses = useActiveAddresses()
  const showDemoView = useShowDemoView()
  const headerHeight = useAppHeaderHeight()
  const buttonSize = media.md || isCompact ? 'small' : 'medium'

  const hasConnectedAddresses = Boolean(activeAddresses.evmAddress || activeAddresses.svmAddress)
  const showShareButton = !showDemoView && (isExternalWallet || hasConnectedAddresses)

  const { chains: enabledChains } = useEnabledChains()
  const tieredNetworkOptions = useNetworkSelectorOptions({
    addresses: activeAddresses,
    chainIds: enabledChains,
  })

  const { error: portfolioError, dataUpdatedAt: portfolioDataUpdatedAt } = usePortfolioData({
    evmAddress: activeAddresses.evmAddress,
    svmAddress: activeAddresses.svmAddress,
    skip: !activeAddresses.evmAddress && !activeAddresses.svmAddress,
  })

  // Activity outage (Activity tab) — reported by the Activity component via context
  const { activityError, activityDataUpdatedAt } = usePortfolioOutageContext()

  const isActivityTab = tab === PortfolioTab.Activity
  const { error: outageError, dataUpdatedAt: outageDataUpdatedAt } = getOutageState({
    tab,
    activityError,
    activityDataUpdatedAt,
    portfolioError,
    portfolioDataUpdatedAt,
  })

  const isOutage = !!outageError
  const { openOutageModal } = useDataApiOutageModal({
    dataUpdatedAt: outageDataUpdatedAt,
  })

  const onNetworkPress = useEvent((chainId: UniverseChainId | null) => {
    const currentPageName = getPageNameFromTab(tab)
    const networkFilterChainFields = buildNetworkFilterSelectedChainFields(chainId)

    sendAnalyticsEvent(UniswapEventName.NetworkFilterSelected, {
      element: ElementName.PortfolioNetworkFilter,
      page: currentPageName,
      ...networkFilterChainFields,
    })

    navigate(buildPortfolioUrl({ tab, chainId: chainId ?? undefined, externalAddress: externalAddress?.address }))
  })

  return (
    <Flex
      testID={TestID.PortfolioHeader}
      backgroundColor="$surface1"
      mt="$spacing8"
      pt="$spacing16"
      $md={{ mx: -APP_BODY_MOBILE_GUTTER_PX, px: APP_BODY_MOBILE_GUTTER_PX }}
      zIndex="$header"
      $platform-web={{
        position: 'sticky',
        top: headerHeight,
      }}
      gap={isCompact ? '$gap12' : '$spacing40'}
      transition="gap 200ms ease"
    >
      <Flex gap="$spacing16">
        <Flex row gap="$spacing12" justifyContent="space-between" alignItems="center">
          <PortfolioAddressDisplay isCompact={isCompact} />

          <Flex row gap="$spacing8" alignItems="center">
            {!showDemoView && <PortfolioMoreMenu size={buttonSize} transition={HEADER_TRANSITION} />}
            {showShareButton && (
              <SharePortfolioButton size={buttonSize} showLabel={!media.sm} transition={HEADER_TRANSITION} />
            )}
            <NetworkFilter
              trigger={{ variant: 'pill', size: buttonSize, showLabel: !media.md, transition: HEADER_TRANSITION }}
              includeAllNetworks
              chainIds={enabledChains}
              selectedChain={currentChainId ?? null}
              tieredOptions={tieredNetworkOptions}
              selectionAnalytics={{ page: getPageNameFromTab(tab) }}
              onPressChain={onNetworkPress}
            />
          </Flex>
        </Flex>
      </Flex>

      <Flex gap={isCompact ? '$spacing12' : '$spacing24'} transition="gap 200ms ease">
        <PortfolioTabs />
        {isOutage ? (
          <DataApiOutageBanner
            title={isActivityTab ? t('dataApi.outage.banner.activity.title') : undefined}
            onPress={openOutageModal}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
