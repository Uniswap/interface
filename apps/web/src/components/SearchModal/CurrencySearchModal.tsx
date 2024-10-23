import { Currency, Token } from '@uniswap/sdk-core'
import { CurrencyRow } from 'components/SearchModal//CurrencyList'
import { CurrencySearch } from 'components/SearchModal/CurrencySearch'
import TokenSafety from 'components/TokenSafety'
import useLast from 'hooks/useLast'
import styled from 'lib/styled-components'
import { memo, useCallback, useEffect, useState } from 'react'
import { useSelectActiveSmartPool } from 'state/application/hooks'
import { useUserAddedTokens } from 'state/user/userAddedTokens'
import { AdaptiveWebModal } from 'ui/src'
import { TOKEN_SELECTOR_WEB_MAX_WIDTH } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { INTERFACE_NAV_HEIGHT } from 'uniswap/src/theme/heights'
import { CurrencyField } from 'uniswap/src/types/currency'

const PoolListWrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const PoolListContainer = styled.div`
  width: 100%;
  padding: 32px 25px;
  display: flex;
  flex-flow: column;
  align-items: left;
`

interface CurrencySearchModalProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  currencyField?: CurrencyField
  operatedPools?: Token[]
}

enum CurrencyModalView {
  search,
  importToken,
  tokenSafety,
  poolsList,
}

export default memo(function CurrencySearchModal({
  isOpen,
  onDismiss,
  onCurrencySelect,
  currencyField = CurrencyField.INPUT,
  operatedPools,
}: CurrencySearchModalProps) {
  const [modalView, setModalView] = useState<CurrencyModalView>(CurrencyModalView.search)
  const lastOpen = useLast(isOpen)
  const userAddedTokens = useUserAddedTokens()

  useEffect(() => {
    if (isOpen && !lastOpen && operatedPools?.length === 0) {
      setModalView(CurrencyModalView.search)
    } else {
      setModalView(CurrencyModalView.poolsList)
    }
  }, [isOpen, lastOpen, operatedPools?.length])

  const showTokenSafetySpeedbump = (token: Token) => {
    setWarningToken(token)
    setModalView(CurrencyModalView.tokenSafety)
  }

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      if (
        operatedPools?.length === 0 &&
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
    [onDismiss, onCurrencySelect, userAddedTokens, operatedPools],
  )
  // used for token safety
  const [warningToken, setWarningToken] = useState<Token | undefined>()

  const onPoolSelect = useSelectActiveSmartPool()

  // TODO: update default pool in store
  let content = null
  switch (modalView) {
    // we use DeprecatedCurrencySearch without multichain flag and for pool select
    case CurrencyModalView.search:
      content = (
        <CurrencySearch
          currencyField={currencyField}
          onCurrencySelect={onCurrencySelect}
          onDismiss={onDismiss}
        />
      )
      break
    case CurrencyModalView.poolsList:
      content = (
        <PoolListWrapper>
          <PoolListContainer>
            {operatedPools?.map((pool) => (
              <CurrencyRow
                key={pool.address}
                currency={pool}
                onSelect={() => {
                  onPoolSelect(pool)
                  onCurrencySelect(pool)
                }}
                isSelected={false} // Adjust as needed
                balance={undefined}
                isSmartPool={true}
                eventProperties={{}}
                otherSelected={false}
              />
            ))}
          </PoolListContainer>
        </PoolListWrapper>
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
