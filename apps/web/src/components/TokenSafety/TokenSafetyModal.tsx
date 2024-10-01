import Modal from 'components/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import TokenSafety, { TokenSafetyProps } from '.'

interface TokenSafetyModalProps extends TokenSafetyProps {
  isOpen: boolean
  onReject?: () => void
  onToken0BlockAcknowledged: () => void
  onToken1BlockAcknowledged?: () => void
}

/* TODO(WALL-4625): Clean up and remove this file; is duplicate of packages/uniswap TokenWarningModal.tsx */
export default function TokenSafetyModal({
  isOpen,
  token0,
  token1,
  onAcknowledge,
  closeModalOnly,
  onReject,
  onToken0BlockAcknowledged,
  onToken1BlockAcknowledged,
  showCancel,
}: TokenSafetyModalProps) {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)

  const currencyInfo0 = useCurrencyInfo(token0 && currencyId(token0))
  const currencyInfo1 = useCurrencyInfo(token1 && currencyId(token1)) ?? undefined

  if (!currencyInfo0) {
    // typecheck if no tokens filled
    return null
  }

  return tokenProtectionEnabled ? (
    <TokenWarningModal
      isVisible={isOpen}
      currencyInfo0={currencyInfo0}
      currencyInfo1={currencyInfo1 ?? undefined}
      onReject={onReject}
      onAcknowledge={onAcknowledge}
      closeModalOnly={closeModalOnly}
      onToken0BlockAcknowledged={onToken0BlockAcknowledged}
      onToken1BlockAcknowledged={onToken1BlockAcknowledged}
    />
  ) : (
    <Modal isOpen={isOpen} onDismiss={closeModalOnly} maxHeight={400}>
      <TokenSafety
        token0={token0}
        token1={token1}
        onAcknowledge={onAcknowledge}
        onBlocked={() => {
          onToken0BlockAcknowledged()
          onToken1BlockAcknowledged?.()
          closeModalOnly()
        }}
        closeModalOnly={closeModalOnly}
        showCancel={showCancel}
      />
    </Modal>
  )
}
