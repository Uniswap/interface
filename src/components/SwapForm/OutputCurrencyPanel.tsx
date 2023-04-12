import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { MouseoverTooltip } from 'components/Tooltip'
import { RESERVE_USD_DECIMALS } from 'constants/index'
import { WrapType } from 'hooks/useWrapCallback'
import { formattedNum } from 'utils'

export const Label = styled.div`
  font-weight: 500;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px dashed ${({ theme }) => theme.border};
`

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
    if (!parsedAmountOut) return ''
    return parsedAmountOut.toSignificant(RESERVE_USD_DECIMALS)
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
      label={
        <Label>
          <MouseoverTooltip
            placement="right"
            width="200px"
            text={
              <Text fontSize={12}>
                <Trans>
                  This is the estimated output amount. Do review the actual output amount in the confirmation stage.
                </Trans>
              </Text>
            }
          >
            <Trans>Est. Output</Trans>
          </MouseoverTooltip>
        </Label>
      }
      positionLabel="in"
    />
  )
}

export default OutputCurrencyPanel
