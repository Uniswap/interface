import { useCallback, useState } from 'react'
import { useAppStackNavigation } from 'src/app/navigation/types'
import type { EarnVaultModalProps } from 'src/components/earn/EarnVaultModalState'
import { Flex } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { BaseModalProps } from 'uniswap/src/components/modals/ModalProps'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { EarnAction } from 'uniswap/src/features/earn/types'
import type { EarnVaultTab } from 'uniswap/src/features/earn/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

export function EarnVaultModal({
  vault,
  position,
  isOpen,
  onClose,
}: EarnVaultModalProps & BaseModalProps): JSX.Element | null {
  const navigation = useAppStackNavigation()
  const currencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const hasPosition = position !== undefined
  const [selectedTab, setSelectedTab] = useState<EarnVaultTab>(hasPosition ? 'balance' : 'details')

  const walletAddress = useActiveAccountAddress()
  const { balanceLookupSettled, hasSupportedBalanceForUnderlying } = useEarnDepositSources({
    vault,
    walletAddress: walletAddress ?? undefined,
    isOpen,
  })

  const handleDeposit = useCallback(() => {
    // Wait for the balance lookup to settle — without this, a tap during the loading window
    // would silently fall through to the deposit sheet for a user who actually has no balance.
    if (!vault || !balanceLookupSettled) {
      return
    }
    // Use `replace` (not `navigate` + onClose) so the vault sheet is atomically swapped for
    // the next modal — calling onClose after navigate is a no-op because the vault has
    // already lost focus, leaving both sheets stacked.
    if (!hasSupportedBalanceForUnderlying) {
      navigation.replace(ModalName.EarnYouNeedToken, {
        currencyId: vault.displayCurrencyId,
      })
    } else {
      navigation.replace(ModalName.EarnDepositAmount, {
        vault,
        initialAction: EarnAction.Deposit,
      })
    }
  }, [balanceLookupSettled, hasSupportedBalanceForUnderlying, navigation, vault])

  const handleWithdraw = useCallback(() => {
    if (!vault) {
      return
    }
    navigation.replace(ModalName.EarnDepositAmount, {
      vault,
      position,
      initialAction: EarnAction.Withdraw,
    })
  }, [navigation, position, vault])

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
          onDeposit={handleDeposit}
          onWithdraw={handleWithdraw}
        />
      </Flex>
    </Modal>
  )
}
