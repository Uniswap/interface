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
        { label: t('Stake'), href: '/stake', internal: true, overflow: true },
        { label: t('Vote'), href: '/vote', internal: true },
        { label: t('Analytics'), href: 'https://defillama.com/protocol/rigoblock' },
      ],
    },
    {
      title: t('Company'),
      items: [{ label: t('Website'), href: 'https://rigoblock.com' }],
    },
    {
      title: t('Protocol'),
      items: [
        { label: t('Governance'), href: 'https://docs.rigoblock.com/governance' },
        { label: t('Developers'), href: 'https://docs.rigoblock.com/introduction-to-rigoblock' },
      ],
    },
    {
      title: t('Need help?'),
      items: [{ label: t('Get in touch'), href: 'https://discord.gg/FXd8EU8' }],
    },
  ]
}
