import Modal from 'components/Modal'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import TokenSafety, { TokenSafetyProps } from '.'

interface TokenSafetyModalProps extends TokenSafetyProps {
  isOpen: boolean
}

/* TODO(WALL-4625): Clean up and remove this file; is duplicate of packages/uniswap TokenWarningModal.tsx */
export default function TokenSafetyModal({
  isOpen,
  token0,
  token1,
  onContinue,
  onCancel,
  onBlocked,
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
      onClose={onBlocked ?? onCancel}
      onAccept={onContinue}
    />
  ) : (
    <Modal isOpen={isOpen} onDismiss={onCancel} maxHeight={400}>
      <TokenSafety
        token0={token0}
        token1={token1}
        onContinue={onContinue}
        onBlocked={onBlocked}
        onCancel={onCancel}
        showCancel={showCancel}
      />
    </Modal>
  )
}
