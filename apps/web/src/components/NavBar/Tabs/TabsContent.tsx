import { CreditCardIcon } from 'components/Icons/CreditCard'
import { Limit } from 'components/Icons/Limit'
import { Send } from 'components/Icons/Send'
import { StockIcon } from 'components/Icons/Stock'
import { SwapV2 } from 'components/Icons/SwapV2'
import { Wrap } from 'components/Icons/Wrap'
import { MenuItem } from 'components/NavBar/CompanyMenu/Content'
import { useTheme } from 'lib/styled-components'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { ReceiveAlt } from 'ui/src/components/icons/ReceiveAlt'

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
  const isSellEnabled = useFeatureFlag(FeatureFlags.ShowSell)
  const isBuyEnabled = useFeatureFlag(FeatureFlags.ShowBuy)
  return [
    {
      title: t('common.trade'),
      href: '/swap',
      isActive:
        pathname.startsWith('/swap') ||
        pathname.startsWith('/limit') ||
        pathname.startsWith('/limit-order') ||
        pathname.startsWith('/send'),
      items: [
        {
          label: t('common.swap'),
          icon: <SwapV2 fill={theme.neutral2} />,
          href: '/swap',
          internal: true,
        },
        {
          label: 'Limit Order',
          icon: <Limit fill={theme.neutral2} />,
          href: '/limit-order',
          internal: true,
        },
        ...(isSellEnabled || isFiatOffRampEnabled
          ? []
          : [
              {
                label: t('common.send.button'),
                icon: <Send fill={theme.neutral2} />,
                href: '/send',
                internal: true,
              },
            ]),
        ...(isBuyEnabled
          ? [
              {
                label: t('common.buy.label'),
                icon: <CreditCardIcon fill={theme.neutral2} />,
                href: '/buy',
                internal: true,
              },
            ]
          : []),
        ...(isFiatOffRampEnabled && isSellEnabled
          ? [
              {
                label: t('common.sell.label'),
                icon: <ReceiveAlt fill={theme.neutral2} size={24} transform="rotate(180deg)" />,
                href: '/sell',
                internal: true,
              },
            ]
          : []),
        {
          label: t('swap.stock'),
          icon: <StockIcon fill={theme.neutral2} />,
          href: '/stock',
          internal: true,
        },
        {
          label: t('common.wrap', { symbol: '' }),
          icon: <Wrap fill={theme.neutral2} />,
          href: '/wrap',
          internal: true,
        },
      ],
    },
    {
      title: t('common.explore'),
      href: '/explore',
      isActive: pathname.startsWith('/explore') || pathname.startsWith('/nfts'),
      items: [
        { label: t('common.tokens'), href: '/explore/tokens', internal: true },
        { label: t('common.pools'), href: '/explore/pools', internal: true },
        {
          label: t('common.transactions'),
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
    {
      title: t('referral.tabs.referrals'),
      href: '/referral',
      isActive: pathname.startsWith('/referral'),
    },
  ]
}
