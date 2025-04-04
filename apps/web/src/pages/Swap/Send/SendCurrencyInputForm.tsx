import { InterfaceElementName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { isInputGreaterThanDecimals } from 'components/NumericalInput'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
} from 'pages/Swap/common/shared'
import { useCallback, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSendContext } from 'state/send/SendContext'
import { SendInputError } from 'state/send/hooks'
import { CurrencyState } from 'state/swap/types'
import { ThemedText } from 'theme/components'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Button, Flex, Text, styled, type ButtonProps } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import useResizeObserver from 'use-resize-observer'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const Wrapper = styled(Flex, {
  opacity: 1,
  gap: '1px',

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
  backgroundColor: '$surface2',
  px: '$spacing16',
  borderBottomRightRadius: '$rounded16',
  borderBottomLeftRadius: '$rounded16',
  height: '64px',
  justifyContent: 'center',
  position: 'relative',
})

const InputWrapper = styled(Flex, {
  position: 'relative',
  backgroundColor: '$surface2',
  px: '$gap12',
  pb: '60px',
  height: '256px',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '$gap4',
  borderTopLeftRadius: '$rounded16',
  borderTopRightRadius: '$rounded16',
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

const AlternateCurrencyDisplay = ({ disabled, onToggle }: { disabled: boolean; onToggle: () => void }) => {
  const { formatConvertedFiatNumberOrString, formatNumberOrString } = useFormatter()
  const activeCurrency = useAppFiatCurrency()

  const { sendState, derivedSendInfo } = useSendContext()
  const { inputCurrency, inputInFiat } = sendState
  const { exactAmountOut } = derivedSendInfo

  const formattedAmountOut = inputInFiat
    ? formatNumberOrString({
        input: exactAmountOut || '0',
        type: NumberType.TokenNonTx,
      })
    : formatConvertedFiatNumberOrString({
        input: exactAmountOut || '0',
        type: NumberType.PortfolioBalance,
      })

  const displayCurrency = inputInFiat ? inputCurrency?.symbol ?? '' : activeCurrency
  const formattedAlternateCurrency = formattedAmountOut + ' ' + displayCurrency

  if (!inputCurrency) {
    return null
  }

  return (
    <LoadingOpacityContainer $loading={false}>
      <Flex
        row
        alignItems="center"
        justifyContent="center"
        gap="$gap4"
        onPress={disabled ? undefined : onToggle}
        {...(!disabled ? ClickableTamaguiStyle : {})}
      >
        <ThemedText.BodySecondary fontSize="16px" lineHeight="24px" color="neutral3">
          {formattedAlternateCurrency}
        </ThemedText.BodySecondary>
        <ArrowUpDown color="$neutral3" size="$icon.16" />
      </Flex>
    </LoadingOpacityContainer>
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
  const { chainId } = useMultichainContext()
  const { defaultChainId } = useEnabledChains()
  const supportedChainId = useSupportedChainId(chainId)
  const { isTestnetModeEnabled } = useEnabledChains()
  const { formatCurrencyAmount } = useFormatter()
  const appFiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(appFiatCurrency)

  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { inputInFiat, exactAmountToken, exactAmountFiat, inputCurrency } = sendState
  const { currencyBalance, exactAmountOut, parsedTokenAmount } = derivedSendInfo
  const maxInputAmount = maxAmountSpend(currencyBalance)
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedTokenAmount?.equalTo(maxInputAmount))

  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const fiatCurrency = useMemo(
    () => getChainInfo(supportedChainId ?? defaultChainId).spotPriceStablecoinAmount.currency,
    [defaultChainId, supportedChainId],
  )
  const fiatCurrencyEqualsTransferCurrency = !!inputCurrency && fiatCurrency.equals(inputCurrency)

  const formattedBalance = formatCurrencyAmount({
    amount: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  const fiatBalanceValue = useUSDCValue(currencyBalance)
  const displayValue = inputInFiat ? exactAmountFiat : exactAmountToken
  const hiddenObserver = useResizeObserver<HTMLElement>()

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

  return (
    <Wrapper disabled={disabled}>
      <InputWrapper>
        <Flex position="absolute" top="16px" left="16px">
          <Text variant="body3" userSelect="none" color="$neutral2">
            <Trans i18nKey="common.youreSending" />
          </Text>
        </Flex>
        <NumericalInputWrapper>
          {inputInFiat && (
            <NumericalInputSymbolContainer showPlaceholder={!displayValue}>{fiatSymbol}</NumericalInputSymbolContainer>
          )}
          <StyledNumericalInput
            value={displayValue}
            disabled={disabled}
            onUserInput={handleUserInput}
            placeholder="0"
            $hasPrefix={inputInFiat}
            $width={displayValue && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
            maxDecimals={inputInFiat ? 6 : inputCurrency?.decimals}
          />
          <NumericalInputMimic ref={hiddenObserver.ref}>{displayValue}</NumericalInputMimic>
        </NumericalInputWrapper>
        {isTestnetModeEnabled ? null : (
          <Trace logPress element={InterfaceElementName.SEND_FIAT_TOGGLE}>
            <AlternateCurrencyDisplay
              disabled={fiatCurrencyEqualsTransferCurrency}
              onToggle={toggleFiatInputAmountEnabled}
            />
          </Trace>
        )}
        <InputError />
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
                        <ThemedText.LabelMicro lineHeight="16px" color="neutral3">{`(${formatCurrencyAmount({
                          amount: fiatBalanceValue,
                          type: NumberType.FiatTokenPrice,
                        })})`}</ThemedText.LabelMicro>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
            <Flex row>
              {showMaxButton && (
                <Trace logPress element={InterfaceElementName.SEND_MAX_BUTTON}>
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
      />
    </Wrapper>
  )
}
