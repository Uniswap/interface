import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayerGroup } from 'ui/src/components/icons/LayerGroup'
import { Unichain } from 'ui/src/components/icons/Unichain'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapXGeneric } from 'ui/src/components/icons/UniswapXGeneric'
import { UniswapHelpUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

export interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
  icon?: React.ReactNode
  body?: string
  elementName: ElementName
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
            href: UniswapStaticUrls.downloadWalletUrl,
            icon: MENU_ICONS.wallet,
            body: t('nav.products.wallet'),
            elementName: ElementName.NavbarCompanyMenuWallet,
          },
          {
            label: t('common.uniswapX'),
            href: UniswapStaticUrls.uniswapXUrl,
            icon: MENU_ICONS.uniswapX,
            body: t('nav.products.uniswapX'),
            elementName: ElementName.NavbarCompanyMenuUniswapX,
          },
          {
            label: t('landing.api'),
            href: UniswapStaticUrls.tradingApiDocsUrl,
            icon: MENU_ICONS.tradingApi,
            body: t('nav.products.tradingApi'),
            elementName: ElementName.NavbarCompanyMenuTradingApi,
          },
          {
            label: t('common.unichain'),
            href: UniswapStaticUrls.unichainUrl,
            icon: MENU_ICONS.unichain,
            body: t('nav.products.unichain'),
            elementName: ElementName.NavbarCompanyMenuUnichain,
          },
        ],
      },
      [MenuSectionTitle.Protocol]: {
        title: t('common.protocol'),
        items: [
          { label: t('common.vote'), href: UniswapStaticUrls.voteUrl, elementName: ElementName.NavbarCompanyMenuVote },
          {
            label: t('common.governance'),
            href: UniswapStaticUrls.governanceUrl,
            elementName: ElementName.NavbarCompanyMenuGovernance,
          },
          {
            label: t('common.developers'),
            href: UniswapStaticUrls.developersUrl,
            elementName: ElementName.NavbarCompanyMenuDevelopers,
          },
        ],
      },
      [MenuSectionTitle.Company]: {
        title: t('common.company'),
        items: [
          {
            label: t('common.about'),
            href: UniswapStaticUrls.aboutUrl,
            elementName: ElementName.NavbarCompanyMenuAbout,
          },
          {
            label: t('common.careers'),
            href: UniswapStaticUrls.careersUrl,
            elementName: ElementName.NavbarCompanyMenuCareers,
          },
          { label: t('common.blog'), href: UniswapStaticUrls.blogUrl, elementName: ElementName.NavbarCompanyMenuBlog },
        ],
      },
      [MenuSectionTitle.NeedHelp]: {
        title: t('common.needHelp'),
        items: [
          {
            label: t('common.helpCenter'),
            href: UniswapStaticUrls.helpCenterUrl,
            elementName: ElementName.NavbarCompanyMenuHelpCenter,
          },
          {
            label: t('common.contactUs.button'),
            href: UniswapHelpUrls.requestUrl,
            elementName: ElementName.NavbarCompanyMenuContactUs,
          },
          {
            label: t('common.bugBounty'),
            href: UniswapStaticUrls.bugBountyUrl,
            elementName: ElementName.NavbarCompanyMenuBugBounty,
          },
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
