import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { TabButton } from 'components/AccountDrawer/MiniPortfolio/shared'
import { Clock } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

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
  const { t } = useTranslation()
  const { openLimitOrders } = useOpenLimitOrders(account)
  const colors = useSporeColors()
  const extraWarning = getExtraWarning(openLimitOrders)

  if (!openLimitOrders || openLimitOrders.length < 1) {
    return null
  }

  return (
    <TabButton
      text={t('limit.open.count', { count: openLimitOrders.length })}
      icon={<Clock fill={colors.neutral2.val} color={colors.surface2.val} size="20px" />}
      extraWarning={extraWarning}
      onClick={openLimitsMenu}
      disabled={disabled}
      className={className}
    />
  )
}
