import { type Currency } from '@uniswap/sdk-core'
import type { TFunction } from 'i18next'
import { type ElementRef, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, type ButtonProps, Flex, styled, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useCurrencyInputFontSize } from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputFontSize'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { PortfolioLogo } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { AlternateCurrencyDisplay } from '~/components/AlternateCurrencyDisplay/AlternateCurrencyDisplay'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  StyledNumericalInput,
} from '~/components/NumericalInput/LargeAmountInput'
import { isInputGreaterThanDecimals } from '~/components/NumericalInput/NumericalInput'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import type { CurrencyState } from '~/features/Swap/state/types'
import { SendInputError } from '~/pages/Swap/Send/state/hooks'
import { useSendContext } from '~/pages/Swap/Send/state/SendContext'
import { SwitchNetworkAction } from '~/state/popups/types'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

// Hidden-mimic width measurement can land fractions of a pixel short of the real input's
// required width, which is enough for `text-overflow: ellipsis` to clip the last character.
const ROUNDING_BUFFER = 1

const Wrapper = styled(Flex, {
  opacity: 1,

  variants: {
    disabled: {
      true: {
        opacity: 0.4,
        pointerEvents: 'none',
      },
    },
  },
})

const CurrencyInputWrapper = styled(Flex, {
  backgroundColor: '$surface1',
  px: '$spacing16',
  borderBottomRightRadius: '$rounded16',
  borderBottomLeftRadius: '$rounded16',
  height: '64px',
  justifyContent: 'center',
  position: 'relative',
  borderColor: '$surface3',
  borderWidth: '$spacing1',
})

const InputWrapper = styled(Flex, {
  position: 'relative',
  backgroundColor: '$surface1',
  alignItems: 'center',
  justifyContent: 'flex-end',
  borderTopLeftRadius: '$rounded16',
  borderTopRightRadius: '$rounded16',
  borderColor: '$surface3',
  borderWidth: '$spacing1',
  borderBottomWidth: '$none',
})

const ErrorContainer = styled(Flex, {
  position: 'absolute',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  left: '0',
  bottom: '32px',
})

function getSendInputErrorMessage(t: TFunction, inputError: SendInputError): string {
  switch (inputError) {
    case SendInputError.INSUFFICIENT_FUNDS:
      return t('common.insufficient.funds')
    case SendInputError.INSUFFICIENT_FUNDS_FOR_GAS:
      return t('common.insufficientFundsForNetworkFee.error')
    default:
      return ''
  }
}

const MaxButton = ({ onPress }: { onPress: ButtonProps['onPress'] }) => {
  const { t } = useTranslation()
  return (
    <Button variant="branded" emphasis="secondary" size="xxsmall" onPress={onPress}>
      {t('common.max')}
    </Button>
  )
}

const InputError = () => {
  const { t } = useTranslation()
  const { derivedSendInfo } = useSendContext()
  const { inputError } = derivedSendInfo

  if (!inputError) {
    return null
  }

  return (
    <ErrorContainer>
      <Text variant="body4" color="$statusCritical">
        {getSendInputErrorMessage(t, inputError)}
      </Text>
    </ErrorContainer>
  )
}

export function SendCurrencyInputForm({
  disabled = false,
  onCurrencyChange,
}: {
  disabled?: boolean
  onCurrencyChange?: (selected: CurrencyState) => void
}) {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const appFiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(appFiatCurrency)

  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { inputInFiat, exactAmountToken, exactAmountFiat, inputCurrency } = sendState
  const chainId = inputCurrency?.chainId
  const supportedChainId = useSupportedChainId(chainId)
  const { currencyBalance, exactAmountOut, parsedTokenAmount } = derivedSendInfo
  const maxInputAmount = useMaxAmountSpend({
    currencyAmount: currencyBalance,
    txType: TransactionType.Send,
  })
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedTokenAmount?.equalTo(maxInputAmount))

  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const fiatCurrency = useMemo(
    () => getPrimaryStablecoin(supportedChainId ?? defaultChainId),
    [defaultChainId, supportedChainId],
  )
  const fiatCurrencyEqualsTransferCurrency = !!inputCurrency && fiatCurrency.equals(inputCurrency)

  const formattedBalance = formatCurrencyAmount({
    value: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  const fiatBalanceValue = useUSDCValue(currencyBalance)
  const displayValue = inputInFiat ? exactAmountFiat : exactAmountToken
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const prefixObserver = useResizeObserver<HTMLElement>()
  const amountInputRef = useRef<ElementRef<typeof StyledNumericalInput>>(null)

  const focusAmountInput = useCallback(() => {
    if (disabled) {
      return
    }
    amountInputRef.current?.focus()
  }, [disabled])

  const { fontSize, lineHeight, onLayout, onExtraElementLayout } = useCurrencyInputFontSize({
    value: displayValue,
    focus: undefined,
    options: {
      maxFontSize: 70,
      minFontSize: 48,
      maxCharWidthAtMaxFontSize: 28,
    },
  })

  const handleUserInput = useCallback(
    (newValue: string) => {
      const hasMoreThanTwoDecimals = inputInFiat && newValue.includes('.') && newValue.split('.')[1]?.length > 2

      // Omit parsing errors by checking if amount has more than two decimals or exceeds Number range limit
      if (hasMoreThanTwoDecimals || !isSafeNumber(newValue)) {
        return
      }

      setSendState((prev) => ({
        ...prev,
        [inputInFiat ? 'exactAmountFiat' : 'exactAmountToken']: newValue,
      }))
    },
    [inputInFiat, setSendState],
  )

  const handleSelectCurrency = useCallback(
    (currency: Currency) => {
      onCurrencyChange?.({ inputCurrency: currency, outputCurrency: undefined })

      if (fiatCurrency.equals(currency)) {
        setSendState((prev) => {
          let updatedExactAmountToken = exactAmountToken ?? exactAmountFiat
          const maxDecimals = inputInFiat ? 6 : currency.decimals
          if (isInputGreaterThanDecimals(updatedExactAmountToken, maxDecimals)) {
            updatedExactAmountToken = parseFloat(updatedExactAmountToken).toFixed(maxDecimals)
          }
          return {
            ...prev,
            exactAmountToken: updatedExactAmountToken,
            exactAmountFiat: undefined,
            inputInFiat: false,
            inputCurrency: currency,
          }
        })
        return
      }

      setSendState((prev) => ({
        ...prev,
        inputCurrency: currency,
      }))
    },
    [exactAmountFiat, exactAmountToken, fiatCurrency, inputInFiat, onCurrencyChange, setSendState],
  )

  const toggleFiatInputAmountEnabled = useCallback(() => {
    if (inputInFiat) {
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: exactAmountOut ?? '',
        exactAmountFiat: undefined,
        inputInFiat: false,
      }))
    } else {
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: undefined,
        exactAmountFiat: exactAmountOut ?? '',
        inputInFiat: true,
      }))
    }
  }, [exactAmountOut, inputInFiat, setSendState])

  const handleMaxInput = useCallback(
    (e: Parameters<NonNullable<ButtonProps['onPress']>>[0]) => {
      e.stopPropagation()

      if (maxInputAmount) {
        setSendState((prev) => ({
          ...prev,
          exactAmountToken: maxInputAmount.toExact(),
          exactAmountFiat: undefined,
          inputInFiat: false,
        }))
      }
    },
    [maxInputAmount, setSendState],
  )

  const adjustedWidth = displayValue && hiddenObserver.width ? hiddenObserver.width + ROUNDING_BUFFER : undefined

  return (
    <Wrapper disabled={disabled}>
      <InputWrapper>
        <Flex width="100%" alignItems="center">
          <TouchableArea width="100%" cursor="text" disabled={disabled} onPress={focusAmountInput}>
            <Flex width="100%" pt="$spacing16" px="$spacing16">
              <Text>{t('send.youAreSending')}</Text>
            </Flex>
            <Flex px="$spacing16" pt="$spacing60" width="100%" alignItems="center" onLayout={onLayout}>
              <Flex row maxWidth="100%" position="relative" width="max-content">
                {inputInFiat && (
                  <Flex onLayout={onExtraElementLayout}>
                    <NumericalInputSymbolContainer
                      ref={prefixObserver.ref}
                      showPlaceholder={!displayValue}
                      numericalFontSize={fontSize}
                      style={{ lineHeight: `${lineHeight}px`, fontSize: `${fontSize}px` }}
                    >
                      {fiatSymbol}
                    </NumericalInputSymbolContainer>
                  </Flex>
                )}
                <StyledNumericalInput
                  ref={amountInputRef}
                  value={displayValue}
                  disabled={disabled}
                  onUserInput={handleUserInput}
                  placeholder="0"
                  hasPrefix={inputInFiat}
                  fieldWidth={adjustedWidth}
                  maxDecimals={inputInFiat ? 6 : inputCurrency?.decimals}
                  numericalFontSize={fontSize}
                  lineHeight={lineHeight}
                  prefixWidth={prefixObserver.width}
                  testId={TestID.SendFormAmountInput}
                />
                <NumericalInputMimic
                  ref={hiddenObserver.ref}
                  numericalFontSize={fontSize}
                  style={{ lineHeight: `${lineHeight}px`, fontSize: `${fontSize}px` }}
                >
                  {displayValue}
                </NumericalInputMimic>
              </Flex>
            </Flex>
          </TouchableArea>
          <Flex px="$spacing16" pt="$spacing16" pb="$spacing60" gap="$spacing16" width="100%" alignItems="center">
            {isTestnetModeEnabled ? null : (
              <Trace logPress element={ElementName.SendFiatToggle}>
                <AlternateCurrencyDisplay
                  inputCurrency={inputCurrency}
                  inputInFiat={inputInFiat}
                  exactAmountOut={exactAmountOut}
                  disabled={fiatCurrencyEqualsTransferCurrency}
                  onToggle={toggleFiatInputAmountEnabled}
                />
              </Trace>
            )}
            <InputError />
          </Flex>
        </Flex>
      </InputWrapper>
      <CurrencyInputWrapper>
        <Flex row justifyContent="space-between" {...ClickableTamaguiStyle} onPress={() => setTokenSelectorOpen(true)}>
          <Flex row alignItems="center" gap="$gap12">
            <Flex alignItems="center" row width="100%" gap="$gap12" onPress={() => setTokenSelectorOpen(true)}>
              {inputCurrency && (
                <PortfolioLogo currencies={[inputCurrency]} size={36} chainId={chainId ?? UniverseChainId.Mainnet} />
              )}
              <Flex row width="100%">
                <Flex>
                  <Text variant="body2">{inputCurrency?.symbol ?? inputCurrency?.name}</Text>
                  <Flex row gap="$gap4" width="100%">
                    {currencyBalance && (
                      <Text variant="body4" color="$neutral2">
                        {t('swap.balance.amount', { amount: formattedBalance })}
                      </Text>
                    )}
                    {Boolean(fiatBalanceValue) && (
                      <Text variant="body4" color="$neutral3">
                        {`(${convertFiatAmountFormatted(fiatBalanceValue?.toExact(), NumberType.FiatTokenPrice)})`}
                      </Text>
                    )}
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Flex row>
            {showMaxButton && (
              <Trace logPress element={ElementName.SendMaxButton}>
                <Flex centered>
                  <Flex row mr="$spacing4">
                    <MaxButton onPress={handleMaxInput} />
                  </Flex>
                </Flex>
              </Trace>
            )}
            <RotatableChevron direction="down" />
          </Flex>
        </Flex>
      </CurrencyInputWrapper>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={handleSelectCurrency}
        selectedCurrency={inputCurrency}
        switchNetworkAction={SwitchNetworkAction.Send}
        variation={TokenSelectorVariation.BalancesOnly}
        swapTab={SwapTab.Send}
      />
    </Wrapper>
  )
}
