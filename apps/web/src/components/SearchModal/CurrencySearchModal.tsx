import { Currency } from '@uniswap/sdk-core'
import { CurrencySearch } from 'components/SearchModal/CurrencySearch'
import { memo } from 'react'
import { TOKEN_SELECTOR_WEB_MAX_WIDTH } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  currencyField?: CurrencyField
  chainIds?: UniverseChainId[]
}

export default memo(function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  currencyField = CurrencyField.INPUT,
  chainIds,
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
        onDismiss={onDismiss}
        chainIds={chainIds}
      />
    </Modal>
  )
})
