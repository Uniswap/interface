import { InterfaceElementName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { ReactComponent as DropDown } from 'assets/images/dropdown.svg'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonLight } from 'components/Button/buttons'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { isInputGreaterThanDecimals } from 'components/NumericalInput'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import Column from 'components/deprecated/Column'
import Row, { RowBetween } from 'components/deprecated/Row'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import styled, { css } from 'lib/styled-components'
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
import { ClickableStyle, ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
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

const Wrapper = styled(Column)<{ $disabled: boolean }>`
  opacity: ${({ $disabled }) => (!$disabled ? 1 : 0.4)};
  pointer-events: ${({ $disabled }) => (!$disabled ? 'initial' : 'none')};
  gap: 1px;
`

const CurrencyInputWrapper = styled(PrefetchBalancesWrapper)`
  display: flex;
  background-color: ${({ theme }) => theme.surface2};
  padding: 16px 16px;
  border-radius: 0px 0px 16px 16px;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  position: relative;
`
const ClickableRowBetween = styled(RowBetween)`
  ${ClickableStyle};
`

const InputWrapper = styled(Column)`
  position: relative;
  background-color: ${({ theme }) => theme.surface2};
  padding: 0px 12px 60px 12px;
  height: 256px;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  border-radius: 16px 16px 0px 0px;
`
const InputLabelContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
`

const MaxButton = styled(ButtonLight)`
  position: absolute;
  right: 40px;
  height: min-content;
  width: min-content;
  padding: 2px 8px;
  font-size: 14px;
  line-height: 20px;
`
const StyledDropDown = styled(DropDown)`
  ${ClickableStyle}
  width: 20px;
  height: 8px;
  path {
    stroke: ${({ theme }) => theme.neutral3};
    stroke-width: 2px;
  }
`

const CurrencySelectorRow = styled(Row)`
  ${ClickableStyle}
`

const ErrorContainer = styled(Row)`
  position: absolute;
  width: 100%;
  justify-content: center;
  align-items: center;
  left: 0px;
  bottom: 32px;
`

const AlternateCurrencyDisplayRow = styled(Row)<{ $disabled: boolean }>`
  ${({ $disabled }) =>
    !$disabled &&
    css`
      ${ClickableStyle}
    `}
`

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
      <AlternateCurrencyDisplayRow
        align="center"
        justify="center"
        gap="xs"
        $disabled={disabled}
        onClick={disabled ? undefined : onToggle}
      >
        <ThemedText.BodySecondary fontSize="16px" lineHeight="24px" color="neutral3">
          {formattedAlternateCurrency}
        </ThemedText.BodySecondary>
        <ArrowUpDown color="$neutral3" size="$icon.16" />
      </AlternateCurrencyDisplayRow>
    </LoadingOpacityContainer>
  )
}

const StyledErrorText = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.critical};
  line-height: 16px;
`

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
    <ErrorContainer justify="center">
      <StyledErrorText>{InputErrorLookup[inputError]}</StyledErrorText>
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

  const handleMaxInput = useCallback(() => {
    if (maxInputAmount) {
      setSendState((prev) => ({
        ...prev,
        exactAmountToken: maxInputAmount.toExact(),
        exactAmountFiat: undefined,
        inputInFiat: false,
      }))
    }
  }, [maxInputAmount, setSendState])

  return (
    <Wrapper $disabled={disabled}>
      <InputWrapper>
        <InputLabelContainer>
          <Text variant="body3" userSelect="none" color="$neutral2">
            <Trans i18nKey="common.youreSending" />
          </Text>
        </InputLabelContainer>
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
      <CurrencyInputWrapper>
        <ClickableRowBetween onClick={() => setTokenSelectorOpen(true)}>
          <Row width="100%" gap="md">
            <CurrencySelectorRow width="100%" gap="md" onClick={() => setTokenSelectorOpen(true)}>
              {inputCurrency && (
                <PortfolioLogo currencies={[inputCurrency]} size={36} chainId={chainId ?? UniverseChainId.Mainnet} />
              )}
              <Row width="100%">
                <Column>
                  <ThemedText.BodyPrimary lineHeight="24px">
                    {inputCurrency?.symbol ?? inputCurrency?.name}
                  </ThemedText.BodyPrimary>
                  <Row gap="xs" width="100%">
                    {currencyBalance && (
                      <ThemedText.LabelMicro lineHeight="16px">{`Balance: ${formattedBalance}`}</ThemedText.LabelMicro>
                    )}
                    {Boolean(fiatBalanceValue) && (
                      <ThemedText.LabelMicro lineHeight="16px" color="neutral3">{`(${formatCurrencyAmount({
                        amount: fiatBalanceValue,
                        type: NumberType.FiatTokenPrice,
                      })})`}</ThemedText.LabelMicro>
                    )}
                  </Row>
                </Column>
              </Row>
            </CurrencySelectorRow>
          </Row>
          <StyledDropDown />
        </ClickableRowBetween>
        {showMaxButton && (
          <Trace logPress element={InterfaceElementName.SEND_MAX_BUTTON}>
            <MaxButton onClick={handleMaxInput}>
              <Trans i18nKey="common.max" />
            </MaxButton>
          </Trace>
        )}
      </CurrencyInputWrapper>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={handleSelectCurrency}
        selectedCurrency={inputCurrency}
      />
    </Wrapper>
  )
}
