import { InterfaceElementName, InterfaceSectionName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { MenuState, miniPortfolioMenuStateAtom } from 'components/AccountDrawer'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ConfirmSwapModal } from 'components/ConfirmSwapModal'
import { LimitPriceInputPanel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputPanel'
import {
  LimitPriceErrorType,
  useCurrentPriceAdjustment,
} from 'components/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { ArrowContainer, ArrowWrapper, SwapSection } from 'components/swap/styled'
import { ZERO_PERCENT } from 'constants/misc'
import { useAccount } from 'hooks/useAccount'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useAtom } from 'jotai'
import styled, { useTheme } from 'lib/styled-components'
import { LimitExpirySection } from 'pages/Swap/Limit/LimitExpirySection'
import { LimitPriceError } from 'pages/Swap/Limit/LimitPriceError'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { LimitContextProvider, useLimitContext } from 'state/limit/LimitContext'
import { getDefaultPriceInverted } from 'state/limit/hooks'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { LimitOrderTrade, TradeFillType } from 'state/routing/types'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Anchor, Button, Flex, Text, styled as tamaguiStyled, useIsShortMobileDevice } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Locale } from 'uniswap/src/features/language/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/types/currency'
import {
  NumberType,
  formatCurrencyAmount as formatCurrencyAmountWithoutUserLocale,
  useFormatter,
} from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const LIMIT_SUPPORTED_CHAINS = [UniverseChainId.Mainnet]

const CustomHeightSwapSection = styled(SwapSection)`
  height: unset;
`

const ShortArrowWrapper = styled(ArrowWrapper)`
  margin-top: -22px;
  margin-bottom: -22px;
`

const StyledAlertIcon = styled(AlertTriangleFilled)`
  align-self: flex-start;
  flex-shrink: 0;
  margin-right: 12px;
`

const LimitDisclaimerContainer = styled(Row)`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
`

const LearnMore = tamaguiStyled(Text, {
  variant: 'body3',
  color: '$accent1',
  animation: '100ms',
  hoverStyle: {
    opacity: 0.6,
  },
  focusStyle: {
    opacity: 0.4,
  },
})

type LimitFormProps = {
  onCurrencyChange?: (selected: CurrencyState) => void
}

function LimitForm({ onCurrencyChange }: LimitFormProps) {
  const account = useAccount()
  const { chainId } = useMultichainContext()
  const {
    currencyState: { inputCurrency, outputCurrency },
    setCurrencyState,
  } = useSwapAndLimitContext()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const isLimitSupportedChain = chainId && LIMIT_SUPPORTED_CHAINS.includes(chainId)

  const { limitState, setLimitState, derivedLimitInfo } = useLimitContext()
  const { currencyBalances, parsedAmounts, parsedLimitPrice, limitOrderTrade, marketPrice } = derivedLimitInfo
  const [showConfirm, setShowConfirm] = useState(false)
  const [swapResult, setSwapResult] = useState<SwapResult>()
  const [swapError, setSwapError] = useState()

  const theme = useTheme()
  const { onSwitchTokens } = useSwapActionHandlers()
  const { formatCurrencyAmount } = useFormatter()
  const accountDrawer = useAccountDrawer()
  const [, setMenu] = useAtom(miniPortfolioMenuStateAtom)

  const { currentPriceAdjustment, priceError } = useCurrentPriceAdjustment({
    parsedLimitPrice,
    marketPrice: limitState.limitPriceInverted ? marketPrice?.invert() : marketPrice,
    baseCurrency: limitState.limitPriceInverted ? outputCurrency : inputCurrency,
    quoteCurrency: limitState.limitPriceInverted ? inputCurrency : outputCurrency,
    limitPriceInverted: limitState.limitPriceInverted,
  })

  useEffect(() => {
    if (limitState.limitPriceEdited || !marketPrice || !inputCurrency || !outputCurrency) {
      return
    }

    const marketPriceString = formatCurrencyAmountWithoutUserLocale({
      amount: (() => {
        if (limitState.limitPriceInverted) {
          return marketPrice.invert().quote(CurrencyAmount.fromRawAmount(outputCurrency, 10 ** outputCurrency.decimals))
        } else {
          return marketPrice.quote(CurrencyAmount.fromRawAmount(inputCurrency, 10 ** inputCurrency.decimals))
        }
      })(),
      type: NumberType.SwapTradeAmount,
      placeholder: '',
      locale: Locale.EnglishUnitedStates,
    })

    setLimitState((prev) => ({
      ...prev,
      limitPrice: marketPriceString,
    }))
  }, [
    formatCurrencyAmount,
    inputCurrency,
    limitState.limitPriceEdited,
    limitState.limitPriceInverted,
    marketPrice,
    outputCurrency,
    setLimitState,
  ])

  const onTypeInput = useCallback(
    (type: 'inputAmount' | 'outputAmount') => (newValue: string) => {
      setLimitState((prev) => ({
        ...prev,
        [type]: newValue,
        isInputAmountFixed: type !== 'outputAmount',
      }))
    },
    [setLimitState],
  )

  const switchTokens = useCallback(() => {
    onSwitchTokens({ newOutputHasTax: false, previouslyEstimatedOutput: limitState.outputAmount })
    setLimitState((prev) => {
      // Reset limit price settings when switching tokens
      return {
        ...prev,
        limitPriceEdited: false,
        limitPriceInverted: getDefaultPriceInverted(outputCurrency, inputCurrency),
      }
    })
  }, [inputCurrency, limitState.outputAmount, onSwitchTokens, outputCurrency, setLimitState])

  const onSelectCurrency = useCallback(
    (type: keyof CurrencyState, newCurrency: Currency, isResettingWETHAfterWrap?: boolean) => {
      if ((type === 'inputCurrency' ? outputCurrency : inputCurrency)?.equals(newCurrency)) {
        switchTokens()
        return
      }
      const [newInput, newOutput] =
        type === 'inputCurrency' ? [newCurrency, outputCurrency] : [inputCurrency, newCurrency]
      const newCurrencyState = {
        inputCurrency: newInput,
        outputCurrency: newOutput,
      }
      const [otherCurrency, currencyToBeReplaced] =
        type === 'inputCurrency' ? [outputCurrency, inputCurrency] : [inputCurrency, outputCurrency]
      // Checking if either of the currencies are native, then checking if there also exists a wrapped version of the native currency.
      // If so, then we remove the currency that wasn't selected and put back in the one that was going to be replaced.
      // Ex: Initial state: inputCurrency: USDC, outputCurrency: WETH. Select ETH for input currency. Final state: inputCurrency: ETH, outputCurrency: USDC
      if (otherCurrency && (newCurrency.isNative || otherCurrency.isNative)) {
        const [nativeCurrency, nonNativeCurrency] = newCurrency.isNative
          ? [newCurrency, otherCurrency]
          : [otherCurrency, newCurrency]
        if (nativeCurrency.wrapped.equals(nonNativeCurrency)) {
          newCurrencyState[type === 'inputCurrency' ? 'outputCurrency' : 'inputCurrency'] = currencyToBeReplaced
        }
      }
      // If the user selects 2 currencies on different chains we should set the other field to undefined
      if (newCurrency.chainId !== otherCurrency?.chainId) {
        newCurrencyState[type === 'inputCurrency' ? 'outputCurrency' : 'inputCurrency'] = undefined
      }

      // Reset limit price settings when selecting new token, except when we're just changing ETH>WETH because we're wrapping an ETH limit to an WETH limit
      if (!isResettingWETHAfterWrap) {
        setLimitState((prev) => {
          return {
            ...prev,
            limitPriceEdited: false,
            limitPriceInverted: getDefaultPriceInverted(
              newCurrencyState['inputCurrency'],
              newCurrencyState['outputCurrency'],
            ),
          }
        })
      }
      onCurrencyChange?.(newCurrencyState)
      setCurrencyState(newCurrencyState)
    },
    [inputCurrency, onCurrencyChange, outputCurrency, setCurrencyState, setLimitState, switchTokens],
  )

  useEffect(() => {
    // If outputCurrency is undefined, we should default it to the chain's stablecoin or native currency
    if (!outputCurrency && isSupportedChain) {
      const stablecoinCurrency = getChainInfo(chainId).spotPriceStablecoinAmount.currency
      onSelectCurrency(
        'outputCurrency',
        inputCurrency?.equals(stablecoinCurrency) ? nativeOnChain(chainId) : stablecoinCurrency,
      )
    }
  }, [onSelectCurrency, outputCurrency, isSupportedChain, chainId, inputCurrency])

  useEffect(() => {
    // If the initial pair is eth <> weth, replace the output currency with a stablecoin
    if (isSupportedChain && inputCurrency && outputCurrency && (inputCurrency.isNative || outputCurrency.isNative)) {
      const [nativeCurrency, nonNativeCurrency] = inputCurrency.isNative
        ? [inputCurrency, outputCurrency]
        : [outputCurrency, inputCurrency]
      if (nativeCurrency.wrapped.equals(nonNativeCurrency)) {
        onSelectCurrency('outputCurrency', getChainInfo(chainId).spotPriceStablecoinAmount.currency)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[CurrencyField.INPUT]),
    [currencyBalances],
  )
  const showMaxButton = Boolean(
    maxInputAmount?.greaterThan(0) && !parsedAmounts[CurrencyField.INPUT]?.equalTo(maxInputAmount),
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onTypeInput('inputAmount')(maxInputAmount.toExact())
  }, [maxInputAmount, onTypeInput])

  const hasInsufficientFunds =
    parsedAmounts.input && currencyBalances.input ? currencyBalances.input.lessThan(parsedAmounts.input) : false

  const allowance = usePermit2Allowance(
    parsedAmounts.input?.currency?.isNative ? undefined : (parsedAmounts.input as CurrencyAmount<Token>),
    isSupportedChain ? UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId) : undefined,
    TradeFillType.UniswapX,
  )

  const fiatValueTradeInput = useUSDPrice(parsedAmounts.input)
  const fiatValueTradeOutput = useUSDPrice(parsedAmounts.output)

  const formattedAmounts = useMemo(() => {
    // if there is no Price field, then just default to user-typed amounts
    if (!limitState.limitPrice) {
      return {
        [CurrencyField.INPUT]: limitState.inputAmount,
        [CurrencyField.OUTPUT]: limitState.outputAmount,
      }
    }

    const formattedInput = limitState.isInputAmountFixed
      ? limitState.inputAmount
      : formatCurrencyAmount({
          amount: derivedLimitInfo.parsedAmounts[CurrencyField.INPUT],
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        })
    const formattedOutput = limitState.isInputAmountFixed
      ? formatCurrencyAmount({
          amount: derivedLimitInfo.parsedAmounts[CurrencyField.OUTPUT],
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        })
      : limitState.outputAmount

    return {
      [CurrencyField.INPUT]: formattedInput,
      [CurrencyField.OUTPUT]: formattedOutput,
    }
  }, [
    limitState.limitPrice,
    limitState.isInputAmountFixed,
    limitState.inputAmount,
    limitState.outputAmount,
    formatCurrencyAmount,
    derivedLimitInfo.parsedAmounts,
  ])

  const fiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput.data, fiatValueTradeOutput.data])

  const swapCallback = useSwapCallback(
    limitOrderTrade,
    fiatValues,
    ZERO_PERCENT,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined,
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
      <CustomHeightSwapSection>
        <LimitPriceInputPanel onCurrencySelect={onSelectCurrency} />
      </CustomHeightSwapSection>
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans i18nKey="common.sell.label" />}
            value={formattedAmounts[CurrencyField.INPUT]}
            showMaxButton={showMaxButton}
            currency={inputCurrency ?? null}
            currencyField={CurrencyField.INPUT}
            onUserInput={onTypeInput('inputAmount')}
            onCurrencySelect={(currency) => onSelectCurrency('inputCurrency', currency)}
            otherCurrency={outputCurrency}
            onMax={handleMaxInput}
            id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
          />
        </Trace>
      </SwapSection>
      <ShortArrowWrapper clickable={isSupportedChain}>
        <Trace
          logPress
          eventOnTrigger={SwapEventName.SWAP_TOKENS_REVERSED}
          element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
        >
          <ArrowContainer data-testid="swap-currency-button" onClick={switchTokens} color={theme.neutral1}>
            <ArrowDown size="16" color={theme.neutral1} />
          </ArrowContainer>
        </Trace>
      </ShortArrowWrapper>
      <SwapSection>
        <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
          <SwapCurrencyInputPanel
            label={<Trans i18nKey="common.buy.label" />}
            value={formattedAmounts[CurrencyField.OUTPUT]}
            showMaxButton={false}
            currency={outputCurrency ?? null}
            currencyField={CurrencyField.OUTPUT}
            onUserInput={onTypeInput('outputAmount')}
            onCurrencySelect={(currency) => onSelectCurrency('outputCurrency', currency)}
            otherCurrency={inputCurrency}
            id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
          />
        </Trace>
      </SwapSection>
      {parsedLimitPrice && <LimitExpirySection />}
      <SubmitOrderButton
        inputCurrency={inputCurrency}
        handleContinueToReview={() => {
          setShowConfirm(true)
        }}
        trade={limitOrderTrade}
        hasInsufficientFunds={hasInsufficientFunds}
        limitPriceError={priceError}
      />
      {isLimitSupportedChain && !!priceError && inputCurrency && outputCurrency && limitOrderTrade && (
        <LimitPriceError
          priceError={priceError}
          priceAdjustmentPercentage={currentPriceAdjustment}
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          priceInverted={limitState.limitPriceInverted}
        />
      )}
      <LimitDisclaimerContainer>
        <StyledAlertIcon size={20} color={!isLimitSupportedChain ? theme.critical : theme.neutral2} />
        <Text variant="body3">
          {!isLimitSupportedChain ? (
            <Trans
              i18nKey="limits.form.disclaimer.mainnet"
              components={{
                link: (
                  <Anchor
                    textDecorationLine="none"
                    href={uniswapUrls.helpArticleUrls.limitsNetworkSupport}
                    target="_blank"
                  >
                    <LearnMore>
                      <Trans i18nKey="common.button.learn" />
                    </LearnMore>
                  </Anchor>
                ),
              }}
            />
          ) : (
            <Trans
              i18nKey="limits.form.disclaimer.uniswapx"
              components={{
                link: (
                  <Anchor textDecorationLine="none" href={uniswapUrls.helpArticleUrls.limitsFailure} target="_blank">
                    <LearnMore>
                      <Trans i18nKey="common.button.learn" />
                    </LearnMore>
                  </Anchor>
                ),
              }}
            />
          )}
        </Text>
      </LimitDisclaimerContainer>
      {account.address && (
        <OpenLimitOrdersButton
          account={account.address}
          openLimitsMenu={() => {
            setMenu(MenuState.LIMITS)
            accountDrawer.open()
          }}
        />
      )}
      {limitOrderTrade && showConfirm && (
        <ConfirmSwapModal
          allowance={allowance}
          trade={limitOrderTrade}
          inputCurrency={inputCurrency}
          allowedSlippage={ZERO_PERCENT}
          clearSwapState={() => {
            setSwapError(undefined)
            setSwapResult(undefined)
          }}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
          onCurrencySelection={(field: CurrencyField, currency, isResettingWETHAfterWrap) =>
            onSelectCurrency(
              field === CurrencyField.INPUT ? 'inputCurrency' : 'outputCurrency',
              currency,
              isResettingWETHAfterWrap,
            )
          }
          onConfirm={handleSubmit}
          onDismiss={() => {
            setShowConfirm(false)
            setSwapResult(undefined)
          }}
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
  inputCurrency,
  hasInsufficientFunds,
  limitPriceError,
}: {
  trade?: LimitOrderTrade
  handleContinueToReview: () => void
  inputCurrency?: Currency
  hasInsufficientFunds: boolean
  limitPriceError?: LimitPriceErrorType
}) {
  const accountDrawer = useAccountDrawer()
  const account = useAccount()
  const { chainId } = useMultichainContext()
  const isLimitSupportedChain = chainId && LIMIT_SUPPORTED_CHAINS.includes(chainId)
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const isDisabled =
    (!isLimitSupportedChain || hasInsufficientFunds || !!limitPriceError || !trade) && account.isConnected

  const buttonText = useMemo(() => {
    if (!isLimitSupportedChain) {
      return t('limits.selectSupportedTokens')
    }

    if (!account.isConnected) {
      return <ConnectWalletButtonText />
    }

    if (hasInsufficientFunds) {
      return inputCurrency
        ? t('common.insufficientTokenBalance.error.simple', { tokenSymbol: inputCurrency.symbol })
        : t('common.insufficientBalance.error')
    }
    return t('common.confirm')
  }, [isLimitSupportedChain, account.isConnected, hasInsufficientFunds, inputCurrency, t])

  return (
    <Trace logPress element={ElementName.LimitOrderButton}>
      <Flex row>
        <Button
          variant="branded"
          emphasis={account.isConnected ? 'primary' : 'secondary'}
          size={isShortMobileDevice ? 'small' : 'large'}
          isDisabled={isDisabled}
          onPress={!account.isConnected ? accountDrawer.open : handleContinueToReview}
          id={trade ? 'submit-order-button' : undefined}
          data-testid={trade ? 'submit-order-button' : undefined}
        >
          {buttonText}
        </Button>
      </Flex>
    </Trace>
  )
}

export function LimitFormWrapper(props: LimitFormProps) {
  return (
    <Trace page={InterfacePageNameLocal.Limit}>
      <LimitContextProvider>
        <LimitForm {...props} />
      </LimitContextProvider>
    </Trace>
  )
}
