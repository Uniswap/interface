import { Trans } from '@lingui/macro'
import { InterfaceSectionName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Trace } from 'analytics'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { Field } from 'components/swap/constants'
import { SwapSection } from 'components/swap/styled'
import { useCallback, useMemo } from 'react'
import { LimitContextProvider, LimitState, useLimitContext } from 'state/limit/LimitContext'
import { CurrencyState, useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { maxAmountSpend } from 'utils/maxAmountSpend'

type LimitFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
}

function LimitForm({ onCurrencyChange }: LimitFormProps) {
  const {
    currencyState: { inputCurrency, outputCurrency },
    setCurrencyState,
  } = useSwapAndLimitContext()
  const { limitState, setLimitState, derivedLimitInfo } = useLimitContext()
  const { currencyBalances, parsedAmounts } = derivedLimitInfo

  const onTypeInput = useCallback(
    (type: keyof LimitState) => (newValue: string) => {
      setLimitState((prev) => ({
        ...prev,
        [type]: newValue,
      }))
    },
    [setLimitState]
  )

  const onSelectCurrency = (type: keyof CurrencyState) => (newCurrency: Currency) => {
    const [newInput, newOutput] =
      type === 'inputCurrency' ? [newCurrency, outputCurrency] : [inputCurrency, newCurrency]
    const newCurrencyState = {
      inputCurrency: newInput,
      outputCurrency: newOutput,
    }
    onCurrencyChange?.(newCurrencyState)
    setCurrencyState(newCurrencyState)
  }

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onTypeInput('inputAmount')(maxInputAmount.toExact())
  }, [maxInputAmount, onTypeInput])

  return (
    <Container>
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans>You pay</Trans>}
            value={limitState.inputAmount}
            showMaxButton={showMaxButton}
            currency={inputCurrency ?? null}
            onUserInput={onTypeInput('inputAmount')}
            onCurrencySelect={onSelectCurrency('inputCurrency')}
            otherCurrency={outputCurrency}
            onMax={handleMaxInput}
            showCommonBases
            id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
          />
        </Trace>
      </SwapSection>
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans>You receive</Trans>}
            value={limitState.outputAmount}
            showMaxButton={false}
            currency={outputCurrency ?? null}
            onUserInput={onTypeInput('outputAmount')}
            onCurrencySelect={onSelectCurrency('outputCurrency')}
            otherCurrency={inputCurrency}
            showCommonBases
            id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
          />
        </Trace>
      </SwapSection>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 4px;
`

export function LimitFormWrapper(props: LimitFormProps) {
  return (
    <LimitContextProvider>
      <LimitForm {...props} />
    </LimitContextProvider>
  )
}
