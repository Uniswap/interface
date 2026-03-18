import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { useSporeColors } from 'ui/src'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Compass } from 'ui/src/components/icons/Compass'
import { CreditCard } from 'ui/src/components/icons/CreditCard'
import { Pools } from 'ui/src/components/icons/Pools'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { Wallet } from 'ui/src/components/icons/Wallet'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Limit } from '~/components/Icons/Limit'
import { SwapV2 } from '~/components/Icons/SwapV2'
import { MenuItem } from '~/components/NavBar/CompanyMenu/Content'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'

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
  const { pathname } = useLocation()
  const { chainId: portfolioChainId, isExternalWallet } = usePortfolioRoutes()
  const colors = useSporeColors()
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)
  const isToucanLaunchAuctionEnabled = useFeatureFlag(FeatureFlags.ToucanLaunchAuction)

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
          icon: <SwapV2 fill={colors.neutral2.val} />,
          href: '/swap',
          internal: true,
          elementName: ElementName.NavbarTradeDropdownSwap,
        },
        {
          label: t('swap.limit'),
          icon: <Limit fill={colors.neutral2.val} />,
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
          label: t('common.tokens'),
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
      isActive: pathname.startsWith('/positions') || pathname.startsWith('/liquidity'),
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
          href: '/positions/create',
          internal: true,
          elementName: ElementName.NavbarPoolDropdownCreatePosition,
        },
        ...(isToucanLaunchAuctionEnabled
          ? [
              {
                label: t('toucan.createAuction.launchAuction'),
                href: '/liquidity/launch-auction',
                internal: true,
                elementName: ElementName.NavbarPoolDropdownLaunchAuction,
              },
            ]
          : []),
      ],
    },
    {
      title: t('common.portfolio'),
      href: buildPortfolioUrl({
        tab: PortfolioTab.Overview,
        chainId: portfolioChainId,
      }),
      isActive: pathname.startsWith('/portfolio') && !isExternalWallet,
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
          label: t('portfolio.tokens.title'),
          href: buildPortfolioUrl({
            tab: PortfolioTab.Tokens,
            chainId: portfolioChainId,
          }),
          internal: true,
          elementName: ElementName.NavbarPortfolioDropdownTokens,
        },
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
          label: t('portfolio.activity.title'),
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
