import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Limit } from 'components/Icons/Limit'
import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Compass } from 'ui/src/components/icons/Compass'
import { CreditCard } from 'ui/src/components/icons/CreditCard'
import { Pools } from 'ui/src/components/icons/Pools'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'
import { Wallet } from 'ui/src/components/icons/Wallet'

export type TabsSection = {
  title: string
  href: string
  isActive?: boolean
  items?: TabsItem[]
  closeMenu?: () => void
  icon?: JSX.Element
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const theme = useTheme()
  const isFiatOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)
  const isPortfolioPageEnabled = useFeatureFlag(FeatureFlags.PortfolioPage)
  const isToucanEnabled = useFeatureFlag(FeatureFlags.Toucan)
  const isPortfolioDefiTabEnabled = useFeatureFlag(FeatureFlags.PortfolioDefiTab)

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      icon: <CoinConvert color="$accent1" size="$icon.20" />,
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          href: '/swap',
          internal: true,
        },
        {
          label: t('swap.limit'),
          icon: <Limit fill={theme.neutral2} />,
          href: '/limit',
          internal: true,
        },
        {
          label: t('common.buy.label'),
          icon: <CreditCard size="$icon.24" color="$neutral2" />,
          href: '/buy',
          internal: true,
        },
        ...(isFiatOffRampEnabled
          ? [
              {
                label: t('common.sell.label'),
                icon: <ReceiveAlt fill={theme.neutral2} size={24} transform="rotate(180deg)" />,
                href: '/sell',
                internal: true,
              },
            ]
          : []),
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      icon: <Compass color="$accent1" size="$icon.20" />,
      items: [
        { label: t('common.tokens'), href: '/explore/tokens', internal: true },
        { label: t('common.pools'), href: '/explore/pools', internal: true },
        {
          label: t('common.transactions'),
          href: '/explore/transactions',
          internal: true,
        },
        ...(isToucanEnabled ? [{ label: 'Toucan', href: '/explore/toucan', internal: true }] : []),
      ],
    },
    {
      title: t('common.pool'),
      href: '/positions',
      isActive: pathname.startsWith('/positions'),
      icon: <Pools color="$accent1" size="$icon.20" />,
      items: [
        {
          label: t('nav.tabs.viewPositions'),
          href: '/positions',
          internal: true,
        },
        {
          label: t('nav.tabs.createPosition'),
          href: '/positions/create',
          internal: true,
        },
      ],
    },
    ...(isPortfolioPageEnabled
      ? [
          {
            title: t('common.portfolio'),
            href: '/portfolio',
            isActive: pathname.startsWith('/portfolio'),
            icon: <Wallet color="$accent1" size="$icon.20" />,
            items: [
              {
                label: t('portfolio.overview.title'),
                href: '/portfolio',
                internal: true,
              },
              {
                label: t('portfolio.tokens.title'),
                href: '/portfolio/tokens',
                internal: true,
              },
              ...(isPortfolioDefiTabEnabled
                ? [
                    {
                      label: t('portfolio.defi.title'),
                      href: '/portfolio/defi',
                      internal: true,
                    },
                  ]
                : []),
              {
                label: t('portfolio.nfts.title'),
                href: '/portfolio/nfts',
                internal: true,
              },
              {
                label: t('portfolio.activity.title'),
                href: '/portfolio/activity',
                internal: true,
              },
            ],
          },
        ]
      : []),
  ]
}
