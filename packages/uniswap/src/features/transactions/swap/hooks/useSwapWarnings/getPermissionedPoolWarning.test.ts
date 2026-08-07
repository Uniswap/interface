import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getPermissionedPoolWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getPermissionedPoolWarning'

describe('getPermissionedPoolWarning', () => {
  const t = i18next.t.bind(i18next)

  it('returns undefined when token is not permissioned', () => {
    expect(getPermissionedPoolWarning({ t, isPermissioned: false, isAllowlisted: false })).toBeUndefined()
    expect(getPermissionedPoolWarning({ t, isPermissioned: false, isAllowlisted: true })).toBeUndefined()
  })

  it('returns blocked warning when token is permissioned and user is not allowlisted', () => {
    const result = getPermissionedPoolWarning({ t, isPermissioned: true, isAllowlisted: false })
    expect(result).toEqual({
      type: WarningLabel.PermissionedPool,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      title: t('permissionedPool.swap.403.title'),
      message: t('permissionedPool.swap.403.message'),
    })
  })

  it('returns undefined when token is permissioned but user is allowlisted', () => {
    expect(getPermissionedPoolWarning({ t, isPermissioned: true, isAllowlisted: true })).toBeUndefined()
  })
})
