import { Currency, Token } from '@uniswap/sdk-core'
import { CurrencySearch, CurrencySearchFilters } from 'components/SearchModal/CurrencySearch'
import TokenSafety from 'components/TokenSafety'
import useLast from 'hooks/useLast'
import { memo, useCallback, useEffect, useState } from 'react'
import { useUserAddedTokens } from 'state/user/userAddedTokens'
import { AdaptiveWebModal } from 'ui/src'
import { TOKEN_SELECTOR_WEB_MAX_WIDTH } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { INTERFACE_NAV_HEIGHT } from 'uniswap/src/theme/heights'
import { CurrencyField } from 'uniswap/src/types/currency'

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  currencyField?: CurrencyField
  currencySearchFilters?: CurrencySearchFilters
  operatedPools?: Token[]
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
  currencySearchFilters,
  operatedPools,
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
      if (
        !currencySearchFilters?.onlyDisplaySmartPools &&
        hasWarning &&
        currency.isToken &&
        !userAddedTokens.find((token) => token.equals(currency))
      ) {
        showTokenSafetySpeedbump(currency)
      } else {
        onCurrencySelect(currency)
        onDismiss()
      }
    },
    [onDismiss, onCurrencySelect, userAddedTokens, currencySearchFilters?.onlyDisplaySmartPools],
  )
  // used for token safety
  const [warningToken, setWarningToken] = useState<Token | undefined>()

  let content = null
  switch (modalView) {
    // we use DeprecatedCurrencySearch without multichain flag and for pool select
    case CurrencyModalView.search:
      content = (
        <CurrencySearch
          currencyField={currencyField}
          onCurrencySelect={onCurrencySelect}
          onDismiss={onDismiss}
          onlyDisplaySmartPools={currencySearchFilters?.onlyDisplaySmartPools}
          operatedPools={operatedPools}
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
    <AdaptiveWebModal
      isOpen={isOpen}
      onClose={onDismiss}
      maxHeight={modalView === CurrencyModalView.tokenSafety ? 400 : 700}
      maxWidth={TOKEN_SELECTOR_WEB_MAX_WIDTH}
      px={0}
      py={0}
      flex={1}
      $sm={{ height: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)` }}
    >
      {content}
    </AdaptiveWebModal>
  )
})
