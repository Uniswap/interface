import { InterfaceSectionName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { nativeOnChain } from 'constants/tokens'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { maxAmountSpend } from 'utils/maxAmountSpend'

// only exact-in for now
// TODO: generalize this form for exact in vs exact out
type LimitOrderFormState = {
  inputToken?: Currency
  outputToken?: Currency
  inputAmount: string // what the user types
  outputAmount: string // what the user types
}

// only works on mainnet for now
const DEFAULT_STATE = {
  inputToken: nativeOnChain(1),
  outputToken: undefined,
  inputAmount: '',
  outputAmount: '',
}

export function LimitOrderForm() {
  const { account } = useWeb3React()
  const [{ inputToken, outputToken, inputAmount, outputAmount }, setLimitOrder] =
    useState<LimitOrderFormState>(DEFAULT_STATE)

  const userTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputToken, outputToken], [inputToken, outputToken])
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(userTokenBalances[0]),
    [userTokenBalances]
  )

  const setLimitOrderField = (field: string) => (newValue: any) =>
    setLimitOrder((prev) => ({
      ...prev,
      [field]: newValue,
    }))

  const onMax = () => setLimitOrderField('inputAmount')(maxInputAmount?.toExact())

  return (
    <div>
      <SwapSection>
        <SwapCurrencyInputPanel
          label={`You're selling`}
          value={inputAmount}
          showMaxButton
          currency={inputToken}
          onUserInput={setLimitOrderField('inputAmount')}
          onMax={onMax}
          // TODO: show USD value
          // fiatValue={showFiatValueInput ? fiatValueInput : undefined}
          onCurrencySelect={setLimitOrderField('inputToken')}
          otherCurrency={outputToken}
          showCommonBases
          id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
          // ref={inputCurrencyNumericalInputRef}
        />
      </SwapSection>
    </div>
  )
}

const SwapSection = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  font-weight: 500;
  height: 120px;
  line-height: 20px;
  padding: 16px;
  position: relative;

  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.surface2};
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.deprecated_stateOverlayPressed};
  }
`

const OutputSwapSection = styled(SwapSection)`
  border-bottom: ${({ theme }) => `1px solid ${theme.surface1}`};
`
