import { useTranslation } from 'react-i18next'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)

  const legacyAppLinks = {
    title: t('common.app'),
    key: 'App',
    items: [
      { label: t('common.pool'), href: '/pool', internal: true, overflow: true },
      { label: t('common.vote'), href: '/vote', internal: true },
      { label: t('common.analytics'), href: 'https://defillama.com/protocol/rigoblock' },
    ],
  }
  const companyLinks = {
    title: t('common.company'),
    key: 'Company',
    items: [
      { label: t('common.website'), href: 'https://rigoblock.com/' },
      { label: t('common.blog'), href: 'https://medium.com/rigoblock' },
    ],
  }
  const protocolLinks = {
    title: t('common.protocol'),
    key: 'Protocol',
    items: [
      { label: t('common.governance'), href: 'https://docs.rigoblock.com/governance' },
      { label: t('common.developers'), href: 'https://docs.rigoblock.com/introduction-to-rigoblock' },
      { label: t('common.analytics'), href: 'https://defillama.com/protocol/rigoblock' },
    ],
  }
  const helpLinks = {
    title: t('common.needHelp'),
    key: 'Help',
    items: [
      { label: t('common.helpCenter'), href: 'https://discord.gg/FXd8EU8' },
    ],
  }

  return [...(isLegacyNav ? [legacyAppLinks] : []), companyLinks, protocolLinks, helpLinks]
}
