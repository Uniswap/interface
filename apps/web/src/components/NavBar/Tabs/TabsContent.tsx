import { Limit } from 'components/Icons/Limit'
import { Send } from 'components/Icons/Send'
import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTabsVisible } from 'components/NavBar/ScreenSizes'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { useTheme } from 'styled-components'
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
  quickKey: string
}

export const useTabsContent = (): TabsSection[] => {
  const { t } = useTranslation()
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)
  const { pathname } = useLocation()
  const theme = useTheme()
  const areTabsVisible = useTabsVisible()

  return isLegacyNav
    ? [
        {
          title: t('common.swap'),
          href: '/swap',
        },
        {
          title: t('common.explore'),
          href: '/explore',
        },
        {
          title: t('common.nfts'),
          href: '/nfts',
        },
      ]
    : [
        {
          title: t('common.trade'),
          href: '/swap',
          isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
          items: [
            {
              label: t('common.swap'),
              icon: <SwapV2 fill={theme.neutral2} />,
              quickKey: t`U`,
              href: '/swap',
              internal: true,
            },
            {
              label: t('swap.limit'),
              icon: <Limit fill={theme.neutral2} />,
              quickKey: t`L`,
              href: '/limit',
              internal: true,
            },
            {
              label: t('common.send.button'),
              icon: <Send fill={theme.neutral2} />,
              quickKey: t`E`,
              href: '/send',
              internal: true,
            },
          ],
        },
        {
          title: t('common.explore'),
          href: '/explore',
          isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
          items: [
            { label: t('common.tokens'), quickKey: t`T`, href: '/explore/tokens', internal: true },
            { label: t('common.pools'), quickKey: t`P`, href: '/explore/pools', internal: true },
            { label: t('common.transactions'), quickKey: t`X`, href: '/explore/transactions', internal: true },
            { label: t('common.nfts'), quickKey: t`N`, href: '/nfts', internal: true },
          ],
        },
        {
          title: t('common.pool'),
          href: '/pool',
          isActive: pathname.startsWith('/pool'),
        },
        ...(!areTabsVisible
          ? [
              {
                title: t('common.nfts'),
                href: '/nfts',
              },
            ]
          : []),
      ]
}
