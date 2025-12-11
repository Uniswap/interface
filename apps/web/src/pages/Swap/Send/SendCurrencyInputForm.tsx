import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { type Currency } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { isInputGreaterThanDecimals } from 'components/NumericalInput'
import { SwitchNetworkAction } from 'components/Popups/types'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { AlternateCurrencyDisplay } from 'pages/Swap/common/AlternateCurrencyDisplay'
import { NumericalInputMimic, NumericalInputSymbolContainer, StyledNumericalInput } from 'pages/Swap/common/shared'
import { useCallback, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { SendInputError } from 'state/send/hooks'
import { useSendContext } from 'state/send/SendContext'
import { type CurrencyState } from 'state/swap/types'
import { ThemedText } from 'theme/components'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Button, type ButtonProps, Flex, styled, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { useCurrencyInputFontSize } from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputFontSize'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPrimaryStablecoin } from 'uniswap/src/features/chains/utils'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import useResizeObserver from 'use-resize-observer'
import { NumberType } from 'utilities/src/format/types'
import { maxAmountSpend } from 'utils/maxAmountSpend'

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

const MaxButton = ({ onPress }: { onPress: ButtonProps['onPress'] }) => {
  return (
    <Button variant="branded" emphasis="secondary" size="xxsmall" onPress={onPress}>
      <Trans i18nKey="common.max" />
    </Button>
  )
}

const InputErrorLookup = {
  [SendInputError.INSUFFICIENT_FUNDS]: <Trans i18nKey="common.insufficient.funds" />,
  [SendInputError.INSUFFICIENT_FUNDS_FOR_GAS]: <Trans i18nKey="common.insufficientFundsForNetworkFee.error" />,
}

const InputError = () => {
  const { derivedSendInfo } = useSendContext()
  const { inputError } = derivedSendInfo

  if (!inputError) {
    return null
  }

  return (
    <ErrorContainer>
      <Text variant="body4" color="$statusCritical">
        {InputErrorLookup[inputError]}
      </Text>
    </ErrorContainer>
  )
}

export default function SendCurrencyInputForm({
  disabled = false,
  onCurrencyChange,
}: {
  disabled?: boolean
  onCurrencyChange?: (selected: CurrencyState) => void
}) {
  const { t } = useTranslation()
  const { chainId } = useMultichainContext()
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = useSupportedChainId(chainId)
  const { isTestnetModeEnabled } = useEnabledChains()
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()
  const appFiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(appFiatCurrency)

  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { inputInFiat, exactAmountToken, exactAmountFiat, inputCurrency } = sendState
  const { currencyBalance, exactAmountOut, parsedTokenAmount } = derivedSendInfo
  const maxInputAmount = maxAmountSpend(currencyBalance)
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

  const { fontSize, lineHeight, onLayout } = useCurrencyInputFontSize({
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

  const adjustedWidth = displayValue && hiddenObserver.width ? hiddenObserver.width + 40 : undefined

  return (
    <Wrapper disabled={disabled}>
      <InputWrapper>
        <Flex width="100%" pt="$spacing16" px="$spacing16">
          <Text>{t('send.youAreSending')}</Text>
        </Flex>
        <Flex px="$spacing16" py="$spacing60" gap="$spacing16" maxWidth="100%">
          <Flex row maxWidth="100%" position="relative" width="max-content">
            {inputInFiat && (
              <NumericalInputSymbolContainer
                showPlaceholder={!displayValue}
                style={{ lineHeight: `${lineHeight}px`, fontSize: `${fontSize}px` }}
              >
                {fiatSymbol}
              </NumericalInputSymbolContainer>
            )}
            <StyledNumericalInput
              value={displayValue}
              disabled={disabled}
              onUserInput={handleUserInput}
              placeholder="0"
              $hasPrefix={inputInFiat}
              $width={adjustedWidth}
              maxDecimals={inputInFiat ? 6 : inputCurrency?.decimals}
              $fontSize={fontSize}
              style={{ lineHeight: `${lineHeight}px` }}
              testId={TestID.SendFormAmountInput}
            />
            <NumericalInputMimic
              ref={hiddenObserver.ref}
              style={{ lineHeight: `${lineHeight}px`, fontSize: `${fontSize}px` }}
            >
              {displayValue}
            </NumericalInputMimic>
            <Flex onLayout={onLayout} position="absolute" opacity={0} width="100%" height={20} zIndex={-1} />
          </Flex>
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
      </InputWrapper>
      <PrefetchBalancesWrapper>
        <CurrencyInputWrapper>
          <Flex
            row
            justifyContent="space-between"
            {...ClickableTamaguiStyle}
            onPress={() => setTokenSelectorOpen(true)}
          >
            <Flex row alignItems="center" gap="$gap12">
              <Flex alignItems="center" row width="100%" gap="$gap12" onPress={() => setTokenSelectorOpen(true)}>
                {inputCurrency && (
                  <PortfolioLogo currencies={[inputCurrency]} size={36} chainId={chainId ?? UniverseChainId.Mainnet} />
                )}
                <Flex row width="100%">
                  <Flex>
                    <ThemedText.BodyPrimary lineHeight="24px">
                      {inputCurrency?.symbol ?? inputCurrency?.name}
                    </ThemedText.BodyPrimary>
                    <Flex row gap="$gap4" width="100%">
                      {currencyBalance && (
                        <ThemedText.LabelMicro lineHeight="16px">{`Balance: ${formattedBalance}`}</ThemedText.LabelMicro>
                      )}
                      {Boolean(fiatBalanceValue) && (
                        <ThemedText.LabelMicro lineHeight="16px" color="neutral3">
                          {`(${convertFiatAmountFormatted(fiatBalanceValue?.toExact(), NumberType.FiatTokenPrice)})`}
                        </ThemedText.LabelMicro>
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
      </PrefetchBalancesWrapper>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={handleSelectCurrency}
        selectedCurrency={inputCurrency}
        switchNetworkAction={SwitchNetworkAction.Send}
        variation={TokenSelectorVariation.BalancesOnly}
      />
    </Wrapper>
  )
}
