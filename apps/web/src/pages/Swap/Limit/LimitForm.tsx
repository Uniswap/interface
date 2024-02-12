import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceSectionName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { Trace, TraceEvent } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonError, ButtonLight } from 'components/Button'
import Column from 'components/Column'
import ConfirmSwapModalV2 from 'components/ConfirmSwapModalV2'
import { LimitPriceInputPanel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputPanel'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { Field } from 'components/swap/constants'
import { ArrowContainer, ArrowWrapper, SwapSection } from 'components/swap/styled'
import { isSupportedChain } from 'constants/chains'
import { ZERO_PERCENT } from 'constants/misc'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useCallback, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { LimitContextProvider, LimitState, useLimitContext } from 'state/limit/LimitContext'
import { LimitOrderTrade, TradeFillType } from 'state/routing/types'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { CurrencyState, useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
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
  const { currencyBalances, parsedAmounts, parsedLimitPrice, limitOrderTrade } = derivedLimitInfo
  const [showConfirm, setShowConfirm] = useState(false)
  const [swapResult, setSwapResult] = useState<SwapResult>()
  const [swapError, setSwapError] = useState()

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

  const hasInsufficientFunds =
    parsedAmounts.INPUT && currencyBalances.INPUT ? currencyBalances.INPUT.lessThan(parsedAmounts.INPUT) : false

  const allowance = usePermit2Allowance(
    parsedAmounts.INPUT?.currency?.isNative ? undefined : (parsedAmounts.INPUT as CurrencyAmount<Token>),
    isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined,
    TradeFillType.UniswapX
  )

  const fiatValueTradeInput = useUSDPrice(parsedAmounts.INPUT)
  const fiatValueTradeOutput = useUSDPrice(parsedAmounts.OUTPUT)
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

  const swapCallback = useSwapCallback(
    limitOrderTrade,
    { amountIn: undefined, amountOut: undefined },
    ZERO_PERCENT,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )

  const handleSubmit = useCallback(async () => {
    if (!swapCallback) {
      return
    }
    try {
      const result = await swapCallback()
      setSwapResult(result)
    } catch (error) {
      setSwapError(error)
    }
  }, [swapCallback])

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
      <SubmitOrderButton
        handleContinueToReview={() => {
          setShowConfirm(true)
        }}
        trade={limitOrderTrade}
        hasInsufficientFunds={hasInsufficientFunds}
      />
      {limitOrderTrade && showConfirm && (
        <ConfirmSwapModalV2
          allowance={allowance}
          trade={limitOrderTrade}
          inputCurrency={inputCurrency}
          allowedSlippage={ZERO_PERCENT}
          clearSwapState={() => {
            setLimitState((prev) => ({
              ...prev,
              inputAmount: '',
              outputAmount: '',
            }))
          }}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
          onCurrencySelection={(field: Field, currency) => {
            onSelectCurrency(field === Field.INPUT ? 'inputCurrency' : 'outputCurrency')(currency)
          }}
          onConfirm={handleSubmit}
          onDismiss={() => setShowConfirm(false)}
          swapResult={swapResult}
          swapError={swapError}
        />
      )}
    </Column>
  )
}

function SubmitOrderButton({
  trade,
  handleContinueToReview,
  hasInsufficientFunds,
}: {
  trade?: LimitOrderTrade
  handleContinueToReview: () => void
  hasInsufficientFunds: boolean
}) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const { account } = useWeb3React()

  if (!account) {
    return (
      <ButtonLight onClick={toggleWalletDrawer} fontWeight={535} $borderRadius="16px">
        <Trans>Connect wallet</Trans>
      </ButtonLight>
    )
  }

  if (hasInsufficientFunds) {
    return (
      <ButtonError disabled>
        <ThemedText.HeadlineSmall fontSize={20}>Insufficient balance</ThemedText.HeadlineSmall>
      </ButtonError>
    )
  }

  return (
    <ButtonError
      onClick={handleContinueToReview}
      id="submit-order-button"
      data-testid="submit-order-button"
      disabled={!trade}
    >
      <ThemedText.HeadlineSmall fontSize={20}>Submit order</ThemedText.HeadlineSmall>
    </ButtonError>
  )
}

export function LimitFormWrapper(props: LimitFormProps) {
  return (
    <LimitContextProvider>
      <LimitForm {...props} />
    </LimitContextProvider>
  )
}
