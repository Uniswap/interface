import { t } from '@lingui/macro'

export interface MenuSection {
  title: string
  items: MenuItem[]
  closeMenu?: () => void
}

export interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
}

export const menuContent: MenuSection[] = [
  {
    title: t`App`,
    items: [
      { label: t`Pool`, href: '/pool', internal: true, overflow: true },
      { label: t`Vote`, href: '/vote', internal: true },
      { label: t`Analytics`, href: 'https://info.uniswap.org/' },
    ],
  },
  {
    title: t`Company`,
    items: [
      { label: t`Careers`, href: 'https://boards.greenhouse.io/uniswaplabs' },
      { label: t`Blog`, href: 'https://blog.uniswap.org/' },
    ],
  },
  {
    title: t`Protocol`,
    items: [
      { label: t`Governance`, href: 'https://uniswap.org/governance' },
      { label: t`Developers`, href: 'https://uniswap.org/developers' },
    ],
  },
  {
    title: t`Need help?`,
    items: [
      { label: t`Contact us`, href: 'https://support.uniswap.org/hc/en-us/requests/new' },
      { label: t`Help Center`, href: 'https://support.uniswap.org/hc/en-us' },
    ],
  },
]
