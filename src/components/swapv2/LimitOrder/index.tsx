import { memo, useState } from 'react'

import useSyncTokenSymbolToUrl from 'hooks/useSyncTokenSymbolToUrl'
import { useLimitActionHandlers, useLimitState } from 'state/limit/hooks'
import { TRANSACTION_STATE_DEFAULT, TransactionFlowState } from 'types'

import LimitOrderForm from './LimitOrderForm'

type Props = {
  refreshListOrder: () => void
  setIsSelectCurrencyManual: (v: boolean) => void
  isSelectCurrencyManual: boolean
}

function LimitOrderComp({ refreshListOrder, setIsSelectCurrencyManual, isSelectCurrencyManual }: Props) {
  const { onSelectPair } = useLimitActionHandlers()

  const { currencyIn, currencyOut } = useLimitState()

  useSyncTokenSymbolToUrl(currencyIn, currencyOut, onSelectPair, isSelectCurrencyManual)

  // modal and loading
  const [flowState, setFlowState] = useState<TransactionFlowState>(TRANSACTION_STATE_DEFAULT)

  return (
    <LimitOrderForm
      flowState={flowState}
      setFlowState={setFlowState}
      refreshListOrder={refreshListOrder}
      currencyIn={currencyIn}
      currencyOut={currencyOut}
      setIsSelectCurrencyManual={setIsSelectCurrencyManual}
    />
  )
}

export default memo(LimitOrderComp)
