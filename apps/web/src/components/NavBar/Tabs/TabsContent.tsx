import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useSporeColors } from 'ui/src'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Compass } from 'ui/src/components/icons/Compass'
import { CreditCard } from 'ui/src/components/icons/CreditCard'
import { Pools } from 'ui/src/components/icons/Pools'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { SwapDotted } from 'ui/src/components/icons/SwapDotted'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { MenuItem } from '~/components/NavBar/CompanyMenu/Content'
import { PageType } from '~/hooks/useIsPage'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { EntryPointKind, resolveEntryPoint } from '~/utils/createPositionEntryPoint'

export type TabsSection = {
  title: string
  href: string
  isActive?: boolean
  items?: TabsItem[]
  closeMenu?: () => void
  icon?: JSX.Element
  elementName: ElementName
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const { pathname, search, state } = useLocation()
  const { chainId: portfolioChainId, isExternalWallet } = usePortfolioRoutes()
  const colors = useSporeColors()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)
  const portfolioPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const entryPoint = resolveEntryPoint({ search, state })
  const isPortfolioPoolsEntryPointActive = entryPoint.kind === EntryPointKind.PortfolioPools

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      icon: <CoinConvert color="$accent1" size="$icon.20" />,
      elementName: ElementName.NavbarTradeTab,
      items: [
        {
          label: t('common.swap'),
          icon: <SwapDotted size="$icon.24" color="$neutral2" />,
          href: '/swap',
          internal: true,
          elementName: ElementName.NavbarTradeDropdownSwap,
        },
        {
          label: t('swap.limit'),
          icon: <ChartBar size="$icon.24" color="$neutral2" />,
          href: '/limit',
          internal: true,
          elementName: ElementName.NavbarTradeDropdownLimit,
        },
        {
          label: t('common.buy.label'),
          icon: <CreditCard size="$icon.24" color="$neutral2" />,
          href: '/buy',
          internal: true,
          elementName: ElementName.NavbarTradeDropdownBuy,
        },
        {
          label: t('common.sell.label'),
          icon: <ReceiveAlt fill={colors.neutral2.val} size={24} transform="rotate(180deg)" />,
          href: '/sell',
          internal: true,
          elementName: ElementName.NavbarTradeDropdownSell,
        },
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      icon: <Compass color="$accent1" size="$icon.20" />,
      elementName: ElementName.NavbarExploreTab,
      items: [
        {
          label: t('common.token.plural'),
          href: '/explore/tokens',
          internal: true,
          elementName: ElementName.NavbarExploreDropdownTokens,
        },
        {
          label: t('toucan.auctions'),
          href: '/explore/auctions',
          internal: true,
          elementName: ElementName.NavbarExploreDropdownToucan,
        },
        {
          label: t('common.pools'),
          href: '/explore/pools',
          internal: true,
          elementName: ElementName.NavbarExploreDropdownPools,
        },
        {
          label: t('common.transactions'),
          href: '/explore/transactions',
          internal: true,
          elementName: ElementName.NavbarExploreDropdownTransactions,
        },
      ],
    },
    {
      title: t('common.pool'),
      href: '/positions',
      isActive:
        !isPortfolioPoolsEntryPointActive && (pathname.startsWith('/positions') || pathname.startsWith('/liquidity')),
      icon: <Pools color="$accent1" size="$icon.20" />,
      elementName: ElementName.NavbarPoolTab,
      items: [
        {
          label: t('nav.tabs.viewPositions'),
          href: '/positions',
          internal: true,
          elementName: ElementName.NavbarPoolDropdownViewPositions,
        },
        {
          label: t('nav.tabs.createPosition'),
          href: isAddLiquidityRevamp ? '/positions/add' : '/positions/create',
          internal: true,
          elementName: ElementName.NavbarPoolDropdownCreatePosition,
        },
        {
          label: t('toucan.createAuction.launchAuction'),
          href: '/liquidity/launch-auction',
          internal: true,
          elementName: ElementName.NavbarPoolDropdownLaunchAuction,
        },
      ],
    },
    {
      title: t('common.portfolio'),
      href: buildPortfolioUrl({
        tab: PortfolioTab.Overview,
        chainId: portfolioChainId,
      }),
      isActive: (pathname.startsWith(PageType.PORTFOLIO) && !isExternalWallet) || isPortfolioPoolsEntryPointActive,
      icon: <Wallet color="$accent1" size="$icon.20" />,
      elementName: ElementName.NavbarPortfolioTab,
      items: [
        {
          label: t('portfolio.overview.title'),
          href: buildPortfolioUrl({
            tab: PortfolioTab.Overview,
            chainId: portfolioChainId,
          }),
          internal: true,
          elementName: ElementName.NavbarPortfolioDropdownOverview,
        },
        {
          label: t('common.token.plural'),
          href: buildPortfolioUrl({
            tab: PortfolioTab.Tokens,
            chainId: portfolioChainId,
          }),
          internal: true,
          elementName: ElementName.NavbarPortfolioDropdownTokens,
        },
        ...(portfolioPoolsBalancesEnabled
          ? [
              {
                label: t('common.pools'),
                href: buildPortfolioUrl({
                  tab: PortfolioTab.Pools,
                  chainId: portfolioChainId,
                }),
                internal: true,
                elementName: ElementName.NavbarPortfolioDropdownPools,
              },
            ]
          : []),
        ...(isPortfolioDefiTabEnabled
          ? [
              {
                label: t('portfolio.defi.title'),
                href: buildPortfolioUrl({
                  tab: PortfolioTab.Defi,
                  chainId: portfolioChainId,
                }),
                internal: true,
                elementName: ElementName.NavbarPortfolioDropdownDefi,
              },
            ]
          : []),
        {
          label: t('portfolio.nfts.title'),
          href: buildPortfolioUrl({
            tab: PortfolioTab.Nfts,
            chainId: portfolioChainId,
          }),
          internal: true,
          elementName: ElementName.NavbarPortfolioDropdownNfts,
        },
        {
          label: t('common.activity'),
          href: buildPortfolioUrl({
            tab: PortfolioTab.Activity,
            chainId: portfolioChainId,
          }),
          internal: true,
          elementName: ElementName.NavbarPortfolioDropdownActivity,
        },
      ],
    },
  ]
}
