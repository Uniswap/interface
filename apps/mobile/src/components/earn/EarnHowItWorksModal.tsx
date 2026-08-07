import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnDepositAmountModalState } from 'src/components/earn/EarnDepositAmountModalState'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import {
  EarnAnalyticsSurface,
  EarnEntryPoint,
  getEarnVaultAnalyticsProperties,
} from 'uniswap/src/features/earn/analytics'
import { EarnHowItWorksView } from 'uniswap/src/features/earn/EarnHowItWorksView'
import { useAcknowledgeEarnHowItWorks } from 'uniswap/src/features/earn/hooks/useAcknowledgeEarnHowItWorks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

export function EarnHowItWorksModal({
  isOpen,
  onClose,
  ...routeState
}: EarnDepositAmountModalState & BaseModalProps): JSX.Element | null {
  const { analyticsEntryPoint = EarnEntryPoint.GlobalModal, vault, position } = routeState
  const navigation = useAppStackNavigation()

  const continueDeposit = useEvent(() => {
    if (!vault) {
      return
    }

    navigation.replace(ModalName.EarnDepositAmount, {
      ...routeState,
      analyticsEntryPoint,
      vault,
    })
  })
  const handleContinue = useAcknowledgeEarnHowItWorks({
    analyticsProperties: vault
      ? getEarnVaultAnalyticsProperties({
          entryPoint: analyticsEntryPoint,
          position,
          surface: EarnAnalyticsSurface.Mobile,
          vault,
        })
      : undefined,
    onContinue: continueDeposit,
    vaultId: vault?.id,
  })

  if (!vault) {
    return null
  }

  return (
    <Modal
      overrideInnerContainer
      enableContentPanningGesture={false}
      name={ModalName.EarnHowItWorks}
      isModalOpen={isOpen}
      onClose={onClose}
    >
      <BottomSheetScrollView showsVerticalScrollIndicator={false}>
        <EarnHowItWorksView onContinue={handleContinue} />
      </BottomSheetScrollView>
    </Modal>
  )
}
