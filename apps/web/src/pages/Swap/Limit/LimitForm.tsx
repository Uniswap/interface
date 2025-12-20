/* eslint-disable max-lines */
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { OpenLimitOrdersButton } from 'components/AccountDrawer/MiniPortfolio/Limits/OpenLimitOrdersButton'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { ConfirmSwapModal } from 'components/ConfirmSwapModal'
import { LimitPriceInputPanel } from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceInputPanel'
import {
  LimitPriceErrorType,
  useCurrentPriceAdjustment,
} from 'components/CurrencyInputPanel/LimitPriceInputPanel/useCurrentPriceAdjustment'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import DelegationMismatchModal from 'components/delegation/DelegationMismatchModal'
import Column from 'components/deprecated/Column'
import { ArrowContainer, ArrowWrapper, SwapSection } from 'components/swap/styled'
import { ZERO_PERCENT } from 'constants/misc'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { useAccount } from 'hooks/useAccount'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { LimitExpirySection } from 'pages/Swap/Limit/LimitExpirySection'
import LimitOrdersNotSupportedBanner from 'pages/Swap/Limit/LimitOrdersNotSupportedBanner'
import { LimitPriceError } from 'pages/Swap/Limit/LimitPriceError'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { getDefaultPriceInverted } from 'state/limit/hooks'
import { LimitContextProvider, useLimitContext } from 'state/limit/LimitContext'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { LimitOrderTrade, TradeFillType } from 'state/routing/types'
import { useOnSwitchTokens } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Anchor, Button, Flex, styled, Text, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { LIMIT_SUPPORTED_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isEVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useIsMismatchAccountQuery } from 'uniswap/src/features/smartWallet/mismatch/hooks'
import { ElementName, InterfacePageName, SectionName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
// biome-ignore lint/style/noRestrictedImports: We need to import this directly so we can format with `en-US` locale
import { formatCurrencyAmount as formatCurrencyAmountRaw } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const CustomHeightSwapSection = styled(SwapSection, {
  height: 'unset',
})

const ShortArrowWrapper = styled(ArrowWrapper, {
  mt: -22,
  mb: -22,
})

const LearnMore = styled(Text, {
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
  const isSupportedChain = useIsSupportedChainId(chainId) && isEVMChain(chainId)
  const isLimitSupportedChain = chainId && LIMIT_SUPPORTED_CHAINS.includes(chainId)

  const { limitState, setLimitState, derivedLimitInfo } = useLimitContext()
  const { currencyBalances, parsedAmounts, parsedLimitPrice, limitOrderTrade, marketPrice } = derivedLimitInfo
  const [showConfirm, setShowConfirm] = useState(false)
  const [swapResult, setSwapResult] = useState<SwapResult>()
  const [swapError, setSwapError] = useState()

  const onSwitchTokens = useOnSwitchTokens()
  const colors = useSporeColors()
  const { formatCurrencyAmount } = useLocalizationContext()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  const isPermitMismatchUxEnabled = useFeatureFlag(FeatureFlags.EnablePermitMismatchUX)
  const { data: isDelegationMismatch } = useIsMismatchAccountQuery({ chainId: LIMIT_SUPPORTED_CHAINS[0] })
  const displayDelegationMismatchUI = isPermitMismatchUxEnabled && isDelegationMismatch

  const [displayDelegationMismatchModal, setDisplayDelegationMismatchModal] = useState(false)

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

    const amount = limitState.limitPriceInverted
      ? marketPrice.invert().quote(CurrencyAmount.fromRawAmount(outputCurrency, 10 ** outputCurrency.decimals))
      : marketPrice.quote(CurrencyAmount.fromRawAmount(inputCurrency, 10 ** inputCurrency.decimals))

    // This is being formatted to reduce the number of decimal places.
    // The value will be used for the internal state, so we want to always use `.` as decimal separator.
    // When displaying the value to the user, we wil then call `formatCurrencyAmount` with the user's locale.
    const normalizedMarketPrice = formatCurrencyAmountRaw({
      amount,
      locale: 'en-US',
      type: NumberType.SwapTradeAmount,
      placeholder: '',
    })

    setLimitState((prev) => ({
      ...prev,
      limitPrice: normalizedMarketPrice,
    }))
  }, [
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
    onSwitchTokens()
    setLimitState((prev) => {
      // Reset limit price settings when switching tokens
      return {
        ...prev,
        limitPriceEdited: false,
        limitPriceInverted: getDefaultPriceInverted(outputCurrency, inputCurrency),
      }
    })
  }, [inputCurrency, onSwitchTokens, outputCurrency, setLimitState])

  const onSelectCurrency = useCallback(
    // eslint-disable-next-line max-params
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
              newCurrencyState.inputCurrency,
              newCurrencyState.outputCurrency,
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
      const stablecoinCurrency = getPrimaryStablecoin(chainId)
      onSelectCurrency(
        'outputCurrency',
        inputCurrency?.equals(stablecoinCurrency) ? nativeOnChain(chainId) : stablecoinCurrency,
      )
    }
  }, [onSelectCurrency, outputCurrency, isSupportedChain, chainId, inputCurrency])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Currency state reset only on currency change
  useEffect(() => {
    // If the initial pair is eth <> weth, replace the output currency with a stablecoin
    if (isSupportedChain && inputCurrency && outputCurrency && (inputCurrency.isNative || outputCurrency.isNative)) {
      const [nativeCurrency, nonNativeCurrency] = inputCurrency.isNative
        ? [inputCurrency, outputCurrency]
        : [outputCurrency, inputCurrency]
      if (nativeCurrency.wrapped.equals(nonNativeCurrency)) {
        onSelectCurrency('outputCurrency', getPrimaryStablecoin(chainId))
      }
    }
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

  const allowance = usePermit2Allowance({
    amount: parsedAmounts.input?.currency.isNative ? undefined : (parsedAmounts.input as CurrencyAmount<Token>),
    spender: isSupportedChain ? UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, chainId) : undefined,
    tradeFillType: TradeFillType.UniswapX,
  })

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
          value: derivedLimitInfo.parsedAmounts[CurrencyField.INPUT],
          type: NumberType.SwapTradeAmount,
          placeholder: '',
        })
    const formattedOutput = limitState.isInputAmountFixed
      ? formatCurrencyAmount({
          value: derivedLimitInfo.parsedAmounts[CurrencyField.OUTPUT],
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

  const swapCallback = useSwapCallback({
    trade: limitOrderTrade,
    fiatValues,
    allowedSlippage: ZERO_PERCENT,
    permitSignature: allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined,
  })

  const handleSubmit = useCallback(async () => {
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
        <Trace section={SectionName.SwapCurrencyInput}>
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
            id={SectionName.SwapCurrencyInput}
          />
        </Trace>
      </SwapSection>
      <ShortArrowWrapper clickable={isSupportedChain}>
        <Trace
          logPress
          eventOnTrigger={SwapEventName.SwapTokensReversed}
          element={ElementName.SwapTokensReverseArrowButton}
        >
          <ArrowContainer data-testid="swap-currency-button" onPress={switchTokens}>
            <ArrowDown size="16" color={colors.neutral1.val} />
          </ArrowContainer>
        </Trace>
      </ShortArrowWrapper>
      <SwapSection>
        <Trace section={SectionName.SwapCurrencyOutput}>
          <SwapCurrencyInputPanel
            label={<Trans i18nKey="common.buy.label" />}
            value={formattedAmounts[CurrencyField.OUTPUT]}
            showMaxButton={false}
            currency={outputCurrency ?? null}
            currencyField={CurrencyField.OUTPUT}
            onUserInput={onTypeInput('outputAmount')}
            onCurrencySelect={(currency) => onSelectCurrency('outputCurrency', currency)}
            otherCurrency={inputCurrency}
            id={SectionName.SwapCurrencyOutput}
          />
        </Trace>
      </SwapSection>
      {parsedLimitPrice && <LimitExpirySection />}
      {displayDelegationMismatchUI ? (
        <LimitOrdersNotSupportedBanner onMoreDetails={() => setDisplayDelegationMismatchModal(true)} />
      ) : (
        <SubmitOrderButton
          inputCurrency={inputCurrency}
          handleContinueToReview={() => {
            setShowConfirm(true)
          }}
          trade={limitOrderTrade}
          hasInsufficientFunds={hasInsufficientFunds}
          limitPriceError={priceError}
        />
      )}
      {isLimitSupportedChain && !!priceError && inputCurrency && outputCurrency && limitOrderTrade && (
        <LimitPriceError
          priceError={priceError}
          priceAdjustmentPercentage={currentPriceAdjustment}
          inputCurrency={inputCurrency}
          outputCurrency={outputCurrency}
          priceInverted={limitState.limitPriceInverted}
        />
      )}
      {!displayDelegationMismatchUI && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" p="$padding12" mt="$padding12">
          <AlertTriangleFilled
            size="$icon.20"
            mr="$spacing12"
            alignSelf="flex-start"
            color={!isLimitSupportedChain ? '$critical' : '$neutral2'}
          />
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
        </Flex>
      )}
      {account.address && (
        <OpenLimitOrdersButton
          account={account.address}
          openLimitsMenu={() => {
            setMenu({ variant: MenuStateVariant.LIMITS })
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
          // eslint-disable-next-line max-params
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
      {displayDelegationMismatchModal && (
        <DelegationMismatchModal onClose={() => setDisplayDelegationMismatchModal(false)} />
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

  const { isConnected } = useConnectionStatus()
  const { chainId } = useMultichainContext()
  const isLimitSupportedChain = chainId && LIMIT_SUPPORTED_CHAINS.includes(chainId)
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const isDisabled = (!isLimitSupportedChain || hasInsufficientFunds || !!limitPriceError || !trade) && isConnected

  const buttonText = useMemo(() => {
    if (!isLimitSupportedChain) {
      return t('limits.selectSupportedTokens')
    }

    if (!isConnected) {
      return t('common.connectWallet.button')
    }

    if (hasInsufficientFunds) {
      return inputCurrency
        ? t('common.insufficientTokenBalance.error.simple', { tokenSymbol: inputCurrency.symbol })
        : t('common.insufficientBalance.error')
    }
    return t('common.confirm')
  }, [isLimitSupportedChain, isConnected, hasInsufficientFunds, inputCurrency, t])

  return (
    <Trace logPress element={ElementName.LimitOrderButton}>
      <Flex row>
        <Button
          variant="branded"
          emphasis={isConnected ? 'primary' : 'secondary'}
          size={isShortMobileDevice ? 'small' : 'large'}
          isDisabled={isDisabled}
          onPress={!isConnected ? accountDrawer.open : handleContinueToReview}
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
    <Trace page={InterfacePageName.Limit}>
      <LimitContextProvider>
        <LimitForm {...props} />
      </LimitContextProvider>
    </Trace>
  )
}
