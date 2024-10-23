import { useTranslation } from 'uniswap/src/i18n'

export interface MenuItem {
  label: string
  href: string
  internal?: boolean
  overflow?: boolean
  closeMenu?: () => void
}

export interface MenuSection {
  title: string
  items: MenuItem[]
  closeMenu?: () => void
}

export const useMenuContent = (): MenuSection[] => {
  const { t } = useTranslation()

  return [
    {
      title: t('common.company'),
      items: [
        { label: t('common.website'), href: 'https://rigoblock.com/' },
        { label: t('common.blog'), href: 'https://mirror.xyz/rigoblock.eth' },
      ],
    },
    {
      title: t('common.protocol'),
      items: [
        { label: t('common.vote'), href: '/vote' },
        { label: t('common.governance'), href: 'https://docs.rigoblock.com/governance' },
        { label: t('common.developers'), href: 'https://docs.rigoblock.com/introduction-to-rigoblock' },
        { label: t('common.analytics'), href: 'https://defillama.com/protocol/rigoblock' },
      ],
    },
    {
      title: t('common.needHelp'),
      items: [
        { label: t('common.helpCenter'), href: 'https://discord.gg/invite/FXd8EU8' },
      ],
    },
  ]
}
