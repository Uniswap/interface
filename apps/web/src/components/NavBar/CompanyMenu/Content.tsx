import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayerGroup } from 'ui/src/components/icons/LayerGroup'
import { Unichain } from 'ui/src/components/icons/Unichain'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapXGeneric } from 'ui/src/components/icons/UniswapXGeneric'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
  icon?: React.ReactNode
  body?: string
}

export interface MenuSection {
  title: string
  items: MenuItem[]
  closeMenu?: () => void
}

export enum MenuSectionTitle {
  Products = 'Products',
  Protocol = 'Protocol',
  Company = 'Company',
  NeedHelp = 'NeedHelp',
}

const MENU_ICONS = {
  wallet: <UniswapLogo size="$icon.20" color="$accent1" />,
  uniswapX: <UniswapXGeneric size="$icon.20" color="$accent1" />,
  tradingApi: <LayerGroup size="$icon.20" color="$accent1" />,
  unichain: <Unichain size="$icon.20" color="$accent1" />,
} as const

export const useMenuContent = (args?: {
  keys?: MenuSectionTitle[]
}): Partial<{ [key in MenuSectionTitle]: MenuSection }> => {
  const { t } = useTranslation()
  const { keys } = args || {}

  return useMemo(() => {
    const menuContent = {
      [MenuSectionTitle.Products]: {
        title: t('common.products'),
        items: [
          {
            label: t('common.wallet.label'),
            href: uniswapUrls.downloadWalletUrl,
            icon: MENU_ICONS.wallet,
            body: t('nav.products.wallet'),
          },
          {
            label: t('common.uniswapX'),
            href: uniswapUrls.uniswapXUrl,
            icon: MENU_ICONS.uniswapX,
            body: t('nav.products.uniswapX'),
          },
          {
            label: t('landing.api'),
            href: uniswapUrls.tradingApiDocsUrl,
            icon: MENU_ICONS.tradingApi,
            body: t('nav.products.tradingApi'),
          },
          {
            label: t('common.unichain'),
            href: uniswapUrls.unichainUrl,
            icon: MENU_ICONS.unichain,
            body: t('nav.products.unichain'),
          },
        ],
      },
      [MenuSectionTitle.Protocol]: {
        title: t('common.protocol'),
        items: [
          { label: t('common.vote'), href: uniswapUrls.voteUrl },
          { label: t('common.governance'), href: uniswapUrls.governanceUrl },
          { label: t('common.developers'), href: uniswapUrls.developersUrl },
        ],
      },
      [MenuSectionTitle.Company]: {
        title: t('common.company'),
        items: [
          { label: t('common.about'), href: uniswapUrls.aboutUrl },
          { label: t('common.careers'), href: uniswapUrls.careersUrl },
          { label: t('common.blog'), href: uniswapUrls.blogUrl },
        ],
      },
      [MenuSectionTitle.NeedHelp]: {
        title: t('common.needHelp'),
        items: [
          { label: t('common.helpCenter'), href: uniswapUrls.helpCenterUrl },
          { label: t('common.contactUs.button'), href: uniswapUrls.helpRequestUrl },
        ],
      },
    }

    if (keys) {
      const filteredEntries = Object.entries(menuContent).filter(([key]) => keys.includes(key as MenuSectionTitle))
      return Object.fromEntries(filteredEntries) as Partial<{ [key in MenuSectionTitle]: MenuSection }>
    }

    return menuContent
  }, [t, keys])
}
