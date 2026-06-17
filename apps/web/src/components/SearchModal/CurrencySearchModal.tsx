import { Currency } from '@uniswap/sdk-core'
import { memo } from 'react'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { TOKEN_SELECTOR_WEB_MAX_WIDTH } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { CurrencySearch } from '~/components/SearchModal/CurrencySearch'
import { SwitchNetworkAction } from '~/state/popups/types'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  switchNetworkAction: SwitchNetworkAction
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  currencyField?: CurrencyField
  /**
   * Parent-controlled initial network filter. Pass a chain to pin the selector's default network,
   * `null` to default to All Networks, or omit (`undefined`) to fall back to the default
   * account/multichain resolution.
   */
  chainId?: UniverseChainId | null
  chainIds?: UniverseChainId[]
  variation?: TokenSelectorVariation
  flow?: TokenSelectorFlow
  swapTab?: SwapTab
}

export const CurrencySearchModal = memo(function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  currencyField = CurrencyField.INPUT,
  switchNetworkAction,
  chainId,
  chainIds,
  variation,
  flow,
  swapTab,
}: CurrencySearchModalProps) {
  return (
    <Modal
      isModalOpen={isOpen}
      onClose={onDismiss}
      maxHeight={700}
      height="100vh"
      maxWidth={TOKEN_SELECTOR_WEB_MAX_WIDTH}
      padding={0}
      flex={1}
      name={ModalName.CurrencySearch}
    >
      <CurrencySearch
        currencyField={currencyField}
        onCurrencySelect={onCurrencySelect}
        switchNetworkAction={switchNetworkAction}
        onDismiss={onDismiss}
        chainId={chainId}
        chainIds={chainIds}
        variation={variation}
        flow={flow}
        swapTab={swapTab}
      />
    </Modal>
  )
})
