import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { HookModal } from '~/features/Liquidity/HookModal'
import { needsHookReview } from '~/features/Liquidity/utils/hookReview'
import { normalizeHookForMatch } from '~/features/Liquidity/utils/normalizeHookForMatch'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

/**
 * Runs the hook review on any step past token selection while the hook is unreviewed. SelectTokensStep
 * owns the review on its own step and its Continue records the approval, so a user who walks through
 * the flow never sees this one. It catches the paths that skip that step: the existing-pool add route,
 * which never renders it, and `?step=` deep links into the create page (SECURE-333). Mounted from
 * SharedCreateModals so every consumer of the create-position provider is covered by construction.
 *
 * The exits are Continue and declining. Declining (Go back, the header X) means whatever the surface
 * says it means; the backdrop is locked because this is the only review on these paths.
 */
export function HookReviewGate({ onDecline }: { onDecline: () => void }): JSX.Element | null {
  const { t } = useTranslation()
  const { positionState, setPositionState, step } = useCreateLiquidityContext()
  const { hook } = positionState

  const approveHook = useCallback(() => {
    setPositionState((state) => ({ ...state, userApprovedHook: state.hook }))
  }, [setPositionState])

  if (step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER || !hook || !normalizeHookForMatch(hook)) {
    return null
  }

  return (
    <HookModal
      isOpen={needsHookReview(positionState)}
      isDismissible={false}
      address={hook}
      cancelLabel={t('common.button.goBack')}
      onClose={onDecline}
      onCancel={onDecline}
      onContinue={approveHook}
    />
  )
}
