import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'uniswap/src/features/telemetry/constants'

/**
 * HookSwap docs. Replaces the Uniswap product/company/help links that the
 * upstream interface shipped here. HookSwap ships no separate wallet, no
 * UniswapX, no Unichain and no UNI governance, so those product/protocol/company
 * entries are removed rather than repointed at pages that do not exist.
 */
const HOOKSWAP_DOCS_URL = 'https://docs.hookswap.org'

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

// Kept intact: consumers (MenuDropdown, MobileMenuDrawer, Landing Footer) still
// reference every member. Sections not populated below simply resolve to
// `undefined` and are skipped by those callers (all guard with `&&`).
export enum MenuSectionTitle {
  Products = 'Products',
  Protocol = 'Protocol',
  Company = 'Company',
  NeedHelp = 'NeedHelp',
}

export const useMenuContent = (args?: {
  keys?: MenuSectionTitle[]
}): Partial<{ [key in MenuSectionTitle]: MenuSection }> => {
  const { t } = useTranslation()
  const { keys } = args || {}

  return useMemo(() => {
    const menuContent = {
      [MenuSectionTitle.Protocol]: {
        title: t('common.protocol'),
        items: [
          {
            label: t('common.docs'),
            href: HOOKSWAP_DOCS_URL,
            elementName: ElementName.NavbarCompanyMenuDevelopers,
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
