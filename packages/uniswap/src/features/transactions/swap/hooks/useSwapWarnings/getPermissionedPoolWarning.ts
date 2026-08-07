import type { TFunction } from 'i18next'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

export function getPermissionedPoolWarning({
  t,
  isPermissioned,
  isAllowlisted,
}: {
  t: TFunction
  isPermissioned: boolean
  isAllowlisted: boolean
}): Warning | undefined {
  if (!isPermissioned || isAllowlisted) {
    return undefined
  }

  return {
    type: WarningLabel.PermissionedPool,
    severity: WarningSeverity.Blocked,
    action: WarningAction.DisableReview,
    title: t('permissionedPool.swap.403.title'),
    message: t('permissionedPool.swap.403.message'),
  }
}
