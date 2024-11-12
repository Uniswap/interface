import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Limit } from 'components/Icons/Limit'
import { Send } from 'components/Icons/Send'
import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useLocation } from 'react-router-dom'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useTranslation } from 'uniswap/src/i18n'

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
  const isV4EverywhereEnabled = useFeatureFlag(FeatureFlags.V4Everywhere)
  const { pathname } = useLocation()
  const theme = useTheme()

  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive: pathname.startsWith('/swap') || pathname.startsWith('/limit') || pathname.startsWith('/send'),
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          quickKey: 'U',
          href: '/swap',
          internal: true,
        },
        {
          label: t('swap.limit'),
          icon: <Limit fill={theme.neutral2} />,
          quickKey: 'L',
          href: '/limit',
          internal: true,
        },
        {
          label: t('common.send.button'),
          icon: <Send fill={theme.neutral2} />,
          quickKey: 'E',
          href: '/send',
          internal: true,
        },
        {
          label: t('common.buy.label'),
          icon: <CreditCardIcon fill={theme.neutral2} />,
          quickKey: 'B',
          href: '/buy',
          internal: true,
        },
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      items: [
        { label: t('common.tokens'), quickKey: 'T', href: '/explore/tokens', internal: true },
        { label: t('common.pools'), quickKey: 'P', href: '/explore/pools', internal: true },
        {
          label: t('common.transactions'),
          quickKey: 'X',
          href: '/explore/transactions',
          internal: true,
        },
      ],
    },
    {
      title: t('common.pool'),
      href: isV4EverywhereEnabled ? '/positions' : '/pool',
      isActive: pathname.startsWith('/pool'),
      items: [
        {
          label: t('nav.tabs.viewPositions'),
          quickKey: 'V',
          href: isV4EverywhereEnabled ? '/positions' : '/pool',
          internal: true,
        },
        {
          label: t('nav.tabs.createPosition'),
          quickKey: 'V',
          href: isV4EverywhereEnabled ? '/positions/create' : '/add',
          internal: true,
        },
      ],
    },
  ]
}
