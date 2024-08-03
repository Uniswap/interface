import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { TabButton } from 'components/AccountDrawer/MiniPortfolio/shared'
import { Plural, Trans, t } from 'i18n'
import { useTheme } from 'lib/styled-components'
import { Clock } from 'react-feather'

function getExtraWarning(openLimitOrders: any[]) {
  if (openLimitOrders.length >= 100) {
    return <Trans i18nKey="common.limits.cancelProceed" />
  }
  if (openLimitOrders.length >= 90) {
    return <Trans i18nKey="common.limits.approachMax" />
  }
  return undefined
}

export function OpenLimitOrdersButton({
  openLimitsMenu,
  account,
  disabled,
  className,
}: {
  account: string
  openLimitsMenu: () => void
  disabled?: boolean
  className?: string
}) {
  const { openLimitOrders } = useOpenLimitOrders(account)
  const theme = useTheme()
  const extraWarning = getExtraWarning(openLimitOrders)

  if (!openLimitOrders || openLimitOrders.length < 1) {
    return null
  }

  return (
    <TabButton
      text={
        <Plural
          value={openLimitOrders.length}
          one={t('limit.open.one')}
          other={t('limit.open.count', { count: openLimitOrders.length })}
        />
      }
      icon={<Clock fill={theme.neutral2} color={theme.surface2} size="20px" />}
      extraWarning={extraWarning}
      onClick={openLimitsMenu}
      disabled={disabled}
      className={className}
    />
  )
}
