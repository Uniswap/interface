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
      items: [
        { label: t('Pool'), href: '/pool', internal: true, overflow: true },
        { label: 'Farm', href: '/farm', internal: true, overflow: true },
        { label: 'Convert', href: '/claim-new-ube', internal: true },
        // { label: 'Explore', href: '/explore/celo' },
        { label: t('Analytics'), href: 'https://info.ubeswap.org/' },
      ],
    },
    {
      title: t('Need help?'),
      items: [
        { label: t('Contact us'), href: '' },
        { label: t('Help Center'), href: 'https://docs.ubeswap.org' },
      ],
    },
  ]
}
