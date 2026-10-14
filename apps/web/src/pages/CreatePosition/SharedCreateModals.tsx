import type { UniverseChainId } from '@universe/chains'
import { useCallback } from 'react'
import { DynamicFeeTierSpeedbump } from '~/features/Liquidity/Create/DynamicFeeTierSpeedbump'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { FeeTierSearchModal } from '~/features/Liquidity/FeeTierSearchModal'
import { HookSearchModal } from '~/features/Liquidity/HookSearchModal'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { HookReviewGate } from '~/pages/CreatePosition/HookReviewGate'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'

/**
 * The modals every create-position flow shares (create, migrate, pool route): the hook review gate, and
 * the ones the select step opens — fee-tier search, hook search, and the dynamic-fee speedbump the
 * fee-tier search raises.
 */
export const SharedCreateModals = ({
  onDeclineHookReview,
}: {
  /**
   * Where declining the hook review (Go back, the header X) sends the user. Defaults to the
   * token-select step, which is right for the create and migrate flows; the existing-pool add route
   * has no such step and leaves the pool instead.
   */
  onDeclineHookReview?: () => void
}) => {
  const {
    positionState: { fee: selectedFee, protocolVersion, hook },
    currencies,
    step,
    setStep,
    setPositionState,
    setSelectedHookEntry,
    feeTierSearchModalOpen,
    setFeeTierSearchModalOpen,
    hookSearchModalOpen,
    setHookSearchModalOpen,
    setDynamicFeeTierSpeedbumpData,
  } = useCreateLiquidityContext()
  const { chainId } = useMultichainContext()

  const returnToSelectStep = useCallback(() => {
    setStep(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  }, [setStep])

  // Only the select step opens the three modals below, and a closed FeeTierSearchModal / HookSearchModal
  // still runs its ListPools / hook-registry query while mounted — a wasted request on the range and
  // deposit steps, and on the pool route, which never shows the select step. Unmount them once the step
  // is behind us. The hook review gate is the opposite: it covers the later steps, so it stays.
  const onSelectStep = step === PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER

  return (
    <>
      <HookReviewGate onDecline={onDeclineHookReview ?? returnToSelectStep} />
      {onSelectStep && (
        <>
          <FeeTierSearchModal
            isOpen={feeTierSearchModalOpen}
            onClose={() => setFeeTierSearchModalOpen(false)}
            chainId={chainId}
            protocolVersion={protocolVersion}
            hook={hook}
            sdkCurrencies={currencies.sdk}
            selectedFee={selectedFee}
            onSelectFee={(fee) => setPositionState((prev) => ({ ...prev, fee }))}
            onSelectDynamicFee={(fee) => setDynamicFeeTierSpeedbumpData({ open: true, wishFeeData: fee })}
          />
          <HookSearchModal
            isOpen={hookSearchModalOpen}
            onClose={() => setHookSearchModalOpen(false)}
            // Hooks are chain-specific: use the chain of the tokens the user has selected, not the app-level chain
            chainId={(currencies.display.TOKEN0?.chainId ?? currencies.display.TOKEN1?.chainId) as UniverseChainId}
            selectedHook={hook}
            onSelectHook={(entry) => {
              // A different hook exposes a different set of pools/tiers, so drop the fee to let the
              // fee-tier auto-select re-run (matches clear-hook / chain-change / recommended-hook).
              setPositionState((prev) => ({
                ...prev,
                hook: entry.address,
                fee: prev.hook === entry.address ? prev.fee : undefined,
              }))
              setSelectedHookEntry(entry)
            }}
            onSelectAddress={(address) => {
              setPositionState((prev) => ({
                ...prev,
                hook: address,
                fee: prev.hook === address ? prev.fee : undefined,
              }))
              setSelectedHookEntry(undefined)
            }}
          />
          <DynamicFeeTierSpeedbump />
        </>
      )}
    </>
  )
}
