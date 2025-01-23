import { Currency, Token } from '@uniswap/sdk-core'
import { CurrencySearch } from 'components/SearchModal/CurrencySearch'
import TokenSafety from 'components/TokenSafety'
import useLast from 'hooks/useLast'
import { memo, useCallback, useEffect, useState } from 'react'
import { useUserAddedTokens } from 'state/user/userAddedTokens'
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

enum CurrencyModalView {
  search,
  importToken,
  tokenSafety,
}

export default memo(function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  currencyField = CurrencyField.INPUT,
  chainIds,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)
  const lastOpen = useLast(isOpen)
  const userAddedTokens = useUserAddedTokens()

  useEffect(() => {
    if (isOpen && !lastOpen) {
      setModalView(CurrencyModalView.search)
    }
  }, [isOpen, lastOpen])

  const showTokenSafetySpeedbump = (token: Token) => {
    setWarningToken(token)
    setModalView(CurrencyModalView.tokenSafety)
  }

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      if (hasWarning && currency.isToken && !userAddedTokens.find((token) => token.equals(currency))) {
        showTokenSafetySpeedbump(currency)
      } else {
        onCurrencySelect(currency)
        onDismiss()
      }
    },
    [onDismiss, onCurrencySelect, userAddedTokens],
  )
  // used for token safety
  const [warningToken, setWarningToken] = useState<Token | undefined>()

  let content = null
  switch (modalView) {
    case CurrencyModalView.search:
      content = (
        <CurrencySearch
          currencyField={currencyField}
          onCurrencySelect={onCurrencySelect}
          onDismiss={onDismiss}
          chainIds={chainIds}
        />
      )
      break
    case CurrencyModalView.tokenSafety:
      if (warningToken) {
        content = (
          <TokenSafety
            token0={warningToken}
            onAcknowledge={() => handleCurrencySelect(warningToken)}
            closeModalOnly={() => setModalView(CurrencyModalView.search)}
            showCancel={true}
          />
        )
      }
      break
  }
  return (
    <Modal
      isModalOpen={isOpen}
      onClose={onDismiss}
      maxHeight={modalView === CurrencyModalView.tokenSafety ? 400 : 700}
      maxWidth={TOKEN_SELECTOR_WEB_MAX_WIDTH}
      padding={0}
      flex={1}
      name={ModalName.CurrencySearch}
    >
      {content}
    </Modal>
  )
})
