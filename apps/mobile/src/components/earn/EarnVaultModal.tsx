import { useState } from 'react'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import type { EarnPositionInfo, EarnVaultInfo, EarnVaultTab } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { noop } from 'utilities/src/react/noop'

// Route param types in AppStackParamList must have only optional fields — the generic
// ReactNavigationModal wrapper can't narrow ModalName correctly when any entry has a
// required field, so we mirror the convention used by every other modal in the registry.
export type EarnVaultModalProps = {
  vault?: EarnVaultInfo
  position?: EarnPositionInfo
}

export function EarnVaultModal({
  vault,
  position,
  isOpen,
  onClose,
}: EarnVaultModalProps & BaseModalProps): JSX.Element | null {
  const currencyInfo = useCurrencyInfo(vault?.currencyId)
  const hasPosition = position !== undefined
  const [selectedTab, setSelectedTab] = useState<EarnVaultTab>(hasPosition ? 'balance' : 'details')

  if (!vault) {
    return null
  }

  return (
    <Modal name={ModalName.EarnVault} isModalOpen={isOpen} maxWidth={420} onClose={onClose}>
      <Flex gap="$spacing16" px="$spacing16" pb="$spacing16">
        <EarnVaultOverview
          // Modal is only reachable from an active position, so a connected wallet is guaranteed.
          isConnected
          showCloseIcon={false}
          vault={vault}
          currencyInfo={currencyInfo}
          hasPosition={hasPosition}
          position={position}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          symbol={currencyInfo?.currency.symbol ?? ''}
          onClose={onClose}
          onConnectWallet={noop}
          onDeposit={noop}
          onWithdraw={noop}
        />
      </Flex>
    </Modal>
  )
}
