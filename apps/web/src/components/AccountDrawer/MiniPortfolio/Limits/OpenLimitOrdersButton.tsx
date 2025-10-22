import { useOpenLimitOrders } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { TabButton } from 'components/AccountDrawer/MiniPortfolio/shared'
import { Clock } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { Flex } from 'ui/src/components/layout/Flex'
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
  const { openLimitOrders, loading } = useOpenLimitOrders(account)
  const colors = useSporeColors()
  const extraWarning = getExtraWarning(openLimitOrders)

  if (openLimitOrders.length < 1) {
    return null
  }

  return (
    <Flex mx="$spacing4" mb="$spacing8">
      <TabButton
        text={loading ? t('common.loading') : t('limit.open.count', { count: openLimitOrders.length })}
        icon={<Clock fill={colors.neutral2.val} color={colors.surface2.val} size="20px" />}
        extraWarning={extraWarning}
        onClick={openLimitsMenu}
        disabled={disabled || loading}
        className={className}
      />
    </Flex>
  )
}
