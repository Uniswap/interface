import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { WrapType } from 'hooks/useWrapCallback'
import { formattedNum } from 'utils'

type Props = {
  wrapType: WrapType
  parsedAmountIn: CurrencyAmount<Currency> | undefined
  parsedAmountOut: CurrencyAmount<Currency> | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  amountOutUsd: string | undefined

  onChangeCurrencyOut: (c: Currency) => void
}
const OutputCurrencyPanel: React.FC<Props> = ({
  wrapType,
  parsedAmountIn,
  parsedAmountOut,
  currencyIn,
  currencyOut,
  amountOutUsd,
  onChangeCurrencyOut,
}) => {
  // showWrap = true if this swap is either WRAP or UNWRAP
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const getFormattedAmount = () => {
    if (showWrap) {
      return parsedAmountIn?.toExact() || ''
    }

    return parsedAmountOut?.toSignificant(6) || ''
  }

  const getEstimatedUsd = () => {
    if (showWrap) {
      return undefined
    }

    return amountOutUsd ? `${formattedNum(amountOutUsd.toString(), true)}` : undefined
  }

  return (
    <CurrencyInputPanel
      disabledInput
      value={getFormattedAmount()}
      onMax={null}
      onHalf={null}
      currency={currencyOut}
      onCurrencySelect={onChangeCurrencyOut}
      otherCurrency={currencyIn}
      id="swap-currency-output"
      showCommonBases={true}
      estimatedUsd={getEstimatedUsd()}
    />
  )
}

export default OutputCurrencyPanel
