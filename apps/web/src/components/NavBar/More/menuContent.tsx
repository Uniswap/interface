import { useTranslation } from 'react-i18next'

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

export const useMenuContent = (): MenuSection[] => {
  const { t } = useTranslation()
  return [
    {
      title: t('App'),
      items: [{ label: 'Convert', href: '/claim-new-ube', internal: true }],
    },
    {
      title: t('Charts'),
      items: [
        { label: t('Analytics v3'), href: 'https://info.ubeswap.org/' },
        { label: t('Analytics v2'), href: 'https://info-v2.ubeswap.org/' },
        { label: t('Celo Tracker'), href: 'https://celotracker.com/' },
      ],
    },
    {
      title: t('Bridge'),
      items: [
        { label: t('Squid Router'), href: 'https://app.squidrouter.com/' },
        { label: t('Portal'), href: 'https://portalbridge.com/' },
      ],
    },
    {
      title: t('Need help?'),
      items: [{ label: t('Ubeswap Docs'), href: 'https://docs.ubeswap.org' }],
    },
  ]
}
