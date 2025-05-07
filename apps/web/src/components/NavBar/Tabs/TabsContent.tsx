import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Limit } from 'components/Icons/Limit'
import { Send } from 'components/Icons/Send'
import { SwapV2 } from 'components/Icons/SwapV2'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

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
      href: '/positions',
      isActive: pathname.startsWith('/positions'),
      items: [
        {
          label: t('nav.tabs.viewPositions'),
          quickKey: 'V',
          href: '/positions',
          internal: true,
        },
        {
          label: t('nav.tabs.createPosition'),
          quickKey: 'V',
          href: '/positions/create',
          internal: true,
        },
      ],
    },
  ]
}
