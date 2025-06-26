import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export type TabsSection = {
  title: string
  href: string
  isActive?: boolean
  items?: TabsItem[]
  closeMenu?: () => void
}

export type TabsItem = MenuItem & {
  icon?: JSX.Element
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const theme = useTheme()
  const isFiatOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)

  return [
    {
      title: t('swap'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          href: '/swap',
          internal: true,
        },
      ],
    },
    // {
    //   title: t('common.explore'),
    //   href: '/explore',
    //   isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
    //   items: [
    //     { label: t('common.tokens'), href: '/explore/tokens', internal: true },
    //     { label: t('common.pools'), href: '/explore/pools', internal: true },
    //     {
    //       label: t('common.transactions'),
    //       href: '/explore/transactions',
    //       internal: true,
    //     },
    //   ],
    // },
    // {
    //   title: t('common.pool'),
    //   href: '/positions',
    //   isActive: pathname.startsWith('/positions'),
    //   items: [
    //     {
    //       label: t('nav.tabs.viewPositions'),
    //       href: '/positions',
    //       internal: true,
    //     },
    //     {
    //       label: t('nav.tabs.createPosition'),
    //       href: '/positions/create',
    //       internal: true,
    //     },
    //   ],
    // },
  ]
}
