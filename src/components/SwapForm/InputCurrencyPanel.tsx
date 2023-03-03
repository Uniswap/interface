import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { useEffect } from 'react'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { useActiveWeb3React } from 'hooks'
import { WrapType } from 'hooks/useWrapCallback'
import { formattedNum } from 'utils'
import { halfAmountSpend, maxAmountSpend } from 'utils/maxAmountSpend'

type Props = {
  wrapType: WrapType
  typedValue: string
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  balanceIn: CurrencyAmount<Currency> | undefined
  onChangeCurrencyIn: (c: Currency) => void
  setTypedValue: React.Dispatch<React.SetStateAction<string>>
}
const InputCurrencyPanel: React.FC<Props> = ({
  wrapType,
  typedValue,
  setTypedValue,
  currencyIn,
  currencyOut,
  balanceIn,
  onChangeCurrencyIn,
}) => {
  const { isSolana } = useActiveWeb3React()

  const { routeSummary } = useSwapFormContext()
  const isSolanaUnwrap = isSolana && wrapType === WrapType.UNWRAP
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : routeSummary

  const handleMaxInput = () => {
    const max = maxAmountSpend(balanceIn)?.toExact()
    setTypedValue(max || '')
  }

  const handleHalfInput = () => {
    const half = halfAmountSpend(balanceIn)?.toExact()
    setTypedValue(half || '')
  }

  useEffect(() => {
    // reset value for unwrapping WSOL
    // because on Solana, unwrap WSOL is closing WSOL account,
    // which mean it will unwrap all WSOL at once and we can't unwrap partial amount of WSOL
    if (isSolanaUnwrap) setTypedValue(balanceIn?.toExact() ?? '')
  }, [balanceIn, isSolanaUnwrap, setTypedValue])

  return (
    <CurrencyInputPanel
      value={typedValue}
      positionMax="top"
      currency={currencyIn}
      onUserInput={setTypedValue}
      onMax={isSolanaUnwrap ? null : handleMaxInput}
      onHalf={isSolanaUnwrap ? null : handleHalfInput}
      onCurrencySelect={onChangeCurrencyIn}
      otherCurrency={currencyOut}
      id="swap-currency-input"
      showCommonBases={true}
      estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd.toString(), true)}` : undefined}
    />
  )
}

export default InputCurrencyPanel
