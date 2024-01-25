import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceSectionName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import { Trace } from 'analytics'
import Column from 'components/Column'
import { LimitPriceInputPanel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputPanel'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { Field } from 'components/swap/constants'
import { ArrowContainer, ArrowWrapper, SwapSection } from 'components/swap/styled'
import { isSupportedChain } from 'constants/chains'
import { useCallback, useMemo } from 'react'
import { ArrowDown } from 'react-feather'
import { LimitContextProvider, LimitState, useLimitContext } from 'state/limit/LimitContext'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { CurrencyState, useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled, { useTheme } from 'styled-components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { LimitExpirySection } from './LimitExpirySection'

const CustomHeightSwapSection = styled(SwapSection)`
  height: unset;
  padding-bottom: 26px;
`

const ShortArrowWrapper = styled(ArrowWrapper)`
  margin-top: -22px;
  margin-bottom: -22px;
`

type LimitFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
}

function LimitForm({ onCurrencyChange }: LimitFormProps) {
  const { chainId } = useWeb3React()
  const {
    currencyState: { inputCurrency, outputCurrency },
    setCurrencyState,
  } = useSwapAndLimitContext()

  const { limitState, setLimitState, derivedLimitInfo } = useLimitContext()
  const { currencyBalances, parsedAmounts, parsedLimitPrice } = derivedLimitInfo
  const theme = useTheme()
  const { onSwitchTokens } = useSwapActionHandlers()

  const onTypeInput = useCallback(
    (type: keyof LimitState) => (newValue: string) => {
      setLimitState((prev) => ({
        ...prev,
        [type]: newValue,
        isInputAmountFixed: type !== 'outputAmount',
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

  const { formatCurrencyAmount } = useFormatter()

  const formattedAmounts = useMemo(() => {
    // if there is no Price field, then just default to user-typed amounts
    if (!limitState.limitPrice) {
      return {
        [Field.INPUT]: limitState.inputAmount,
        [Field.OUTPUT]: limitState.outputAmount,
      }
    }

    const formattedInput = limitState.isInputAmountFixed
      ? limitState.inputAmount
      : formatCurrencyAmount({
          amount: derivedLimitInfo.parsedAmounts[Field.INPUT],
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        })
    const formattedOutput = limitState.isInputAmountFixed
      ? formatCurrencyAmount({
          amount: derivedLimitInfo.parsedAmounts[Field.OUTPUT],
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        })
      : limitState.outputAmount

    return {
      [Field.INPUT]: formattedInput,
      [Field.OUTPUT]: formattedOutput,
    }
  }, [
    limitState.limitPrice,
    limitState.isInputAmountFixed,
    limitState.inputAmount,
    limitState.outputAmount,
    formatCurrencyAmount,
    derivedLimitInfo.parsedAmounts,
  ])

  return (
    <Column gap="xs">
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans>You pay</Trans>}
            value={formattedAmounts[Field.INPUT]}
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
      <CustomHeightSwapSection>
        <LimitPriceInputPanel />
      </CustomHeightSwapSection>
      <ShortArrowWrapper clickable={isSupportedChain(chainId)}>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SwapEventName.SWAP_TOKENS_REVERSED}
          element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
        >
          <ArrowContainer
            data-testid="swap-currency-button"
            onClick={() => {
              onSwitchTokens({ newOutputHasTax: false, previouslyEstimatedOutput: limitState.outputAmount })
            }}
            color={theme.neutral1}
          >
            <ArrowDown size="16" color={theme.neutral1} />
          </ArrowContainer>
        </TraceEvent>
      </ShortArrowWrapper>
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans>You receive</Trans>}
            value={formattedAmounts[Field.OUTPUT]}
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
      {parsedLimitPrice && <LimitExpirySection />}
    </Column>
  )
}

export function LimitFormWrapper(props: LimitFormProps) {
  return (
    <LimitContextProvider>
      <LimitForm {...props} />
    </LimitContextProvider>
  )
}
