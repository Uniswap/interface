import { useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionSettingsStoreContext,
  useGetTransactionSettingsContextValue,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContext'
import { TransactionSettingsModalContent } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/TransactionSettingsModalContent/TransactionSettingsModalContent'
import type { TransactionSettingsModalProps } from 'uniswap/src/features/transactions/components/settings/TransactionSettingsModal/types'
import { SwapFormStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContext'
import { useSwapFormStoreBase } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isExtensionApp } from 'utilities/src/platform'

export function TransactionSettingsModalWallet({
  settings,
  initialSelectedSetting,
  onClose,
  isOpen,
}: TransactionSettingsModalProps): JSX.Element {
  const transactionSettingsContext = useGetTransactionSettingsContextValue()
  const colors = useSporeColors()
  const swapFormStore = useSwapFormStoreBase()

  return (
    <Modal
      alignment={isExtensionApp ? 'top' : undefined}
      backgroundColor={colors.surface1.val}
      isModalOpen={isOpen}
      name={ModalName.SwapSettings}
      onClose={onClose}
    >
      {/* Re-create the TransactionSettingsStoreContext.Provider, since Portal can cause its children to be in a separate component tree. */}
      <TransactionSettingsStoreContext.Provider value={transactionSettingsContext}>
        {/* Re-create a new SwapFormStoreContext.Provider, since Portal can cause its children to be in a separate component tree. */}
        <SwapFormStoreContext.Provider value={swapFormStore}>
          <TransactionSettingsModalContent
            initialSelectedSetting={initialSelectedSetting}
            settings={settings}
            onClose={onClose}
          />
        </SwapFormStoreContext.Provider>
      </TransactionSettingsStoreContext.Provider>
    </Modal>
  )
}
