import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { CandlestickChart } from '@universe/mycelium/icons/CandlestickChart'
import { ChartBar } from '@universe/mycelium/icons/ChartBar'
import { CoinConvert } from '@universe/mycelium/icons/CoinConvert'
import { Compass } from '@universe/mycelium/icons/Compass'
import { CreditCard } from '@universe/mycelium/icons/CreditCard'
import { Pools } from '@universe/mycelium/icons/Pools'
import { ReceiveAlt } from '@universe/mycelium/icons/ReceiveAlt'
import { Rocket } from '@universe/mycelium/icons/Rocket'
import { Wallet } from '@universe/mycelium/icons/Wallet'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import Badge, { BadgeVariant } from 'uniswap/src/components/badge/Badge'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { MenuItem } from '~/components/NavBar/CompanyMenu/Content'
import { PageType } from '~/hooks/useIsPage'
import { ADD_LIQUIDITY_PATH } from '~/pages/AddLiquidity/poolLinkParams'
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
  /** Small pill rendered next to the tab label (e.g. the Launches "Beta" tag). */
  badge?: JSX.Element
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
  const isMarginEnabled = useFeatureFlag(FeatureFlags.Margin)
  const entryPoint = resolveEntryPoint({ search, state })
  const isPortfolioPoolsEntryPointActive = entryPoint.kind === EntryPointKind.PortfolioPools

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive:
        pathname.startsWith('/swap') ||
        pathname.startsWith('/limit') ||
        pathname.startsWith('/send') ||
        (isMarginEnabled && pathname.startsWith('/margin')),
      icon: <CoinConvert color="$accent1" size="$icon.24" />,
      elementName: ElementName.NavbarTradeTab,
      items: [
        {
          label: t('common.swap'),
          icon: <CoinConvert size="$icon.24" color="$neutral2" />,
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
        ...(isMarginEnabled
          ? [
              {
                label: t('margin.tab.label'),
                icon: <CandlestickChart size="$icon.24" color="$neutral2" />,
                href: '/margin',
                internal: true,
                elementName: ElementName.NavbarTradeDropdownMargin,
              },
            ]
          : []),
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      icon: <Compass color="$accent1" size="$icon.24" />,
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
      title: t('common.launches'),
      href: '/launches',
      isActive: pathname.startsWith('/launches'),
      icon: <Rocket color="$accent1" size="$icon.24" />,
      badge: (
        <Badge badgeVariant={BadgeVariant.SOFT} size="small" placement="only">
          {t('common.beta')}
        </Badge>
      ),
      elementName: ElementName.NavbarLaunchesTab,
    },
    {
      title: t('common.pool'),
      href: '/positions',
      isActive:
        !isPortfolioPoolsEntryPointActive && (pathname.startsWith('/positions') || pathname.startsWith('/liquidity')),
      icon: <Pools color="$accent1" size="$icon.24" />,
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
          href: ADD_LIQUIDITY_PATH,
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
      icon: <Wallet color="$accent1" size="$icon.24" />,
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
