import { Trans } from '@lingui/macro'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonLight } from 'components/Button'
import Column from 'components/Column'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { Input as NumericalInput } from 'components/NumericalInput'
import PrefetchBalancesWrapper from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useActiveLocalCurrency, useActiveLocalCurrencyComponents } from 'hooks/useActiveLocalCurrency'
import { STABLECOIN_AMOUNT_OUT } from 'hooks/useStablecoinPrice'
import { useCallback, useMemo, useState } from 'react'
import { SendInputError } from 'state/send/hooks'
import { useSendContext } from 'state/send/SendContext'
import { CurrencyState, useSwapAndLimitContext } from 'state/swap/SwapContext'
import styled, { css } from 'styled-components'
import { ClickableStyle, CloseIcon, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const Wrapper = styled(Column)<{ $disabled: boolean }>`
  opacity: ${({ $disabled }) => (!$disabled ? 1 : 0.4)};
  pointer-events: ${({ $disabled }) => (!$disabled ? 'initial' : 'none')};
`

const CurrencyInputWrapper = styled(PrefetchBalancesWrapper)`
  display: flex;
  background-color: ${({ theme }) => theme.surface2};
  padding: 14px 12px;
  border-radius: 16px 16px 0px 0px;
  height: 64px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.surface1};
`

const InputWrapper = styled(Column)`
  position: relative;
  background-color: ${({ theme }) => theme.surface2};
  padding: 0px 12px;
  height: 220px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 0px 0px 16px 16px;
`

const StyledNumericalInput = styled(NumericalInput)<{ usePercent?: boolean }>`
  max-height: 60px;
  width: 100%;
  text-align: center;
  font-size: 70px;
  font-weight: 500;
  line-height: 60px;
`

const StyledUpAndDownArrowIcon = styled(ReverseArrow)`
  width: 16px;
  height: 16px;
  fill: ${({ theme }) => theme.neutral3};
  transform: rotate(90deg);
`

const MaxButton = styled(ButtonLight)`
  height: min-content;
  width: min-content;
  padding: 2px 8px;
  font-size: 14px;
  line-height: 20px;
`

const StyledCloseIcon = styled(CloseIcon)`
  color: ${({ theme }) => theme.neutral3};
  ${ClickableStyle}
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
  const activeCurrency = useActiveLocalCurrency()

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
        <StyledUpAndDownArrowIcon />
      </AlternateCurrencyDisplayRow>
    </LoadingOpacityContainer>
  )
}

const StyledErrorText = styled(ThemedText.Caption)`
  color: ${({ theme }) => theme.critical};
  line-height: 16px;
`

const InputErrorLookup = {
  [SendInputError.INSUFFICIENT_FUNDS]: <Trans>Insufficient funds</Trans>,
  [SendInputError.INSUFFICIENT_FUNDS_FOR_GAS]: <Trans>Insufficient funds to cover network fee</Trans>,
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
  const { chainId } = useSwapAndLimitContext()
  const { account } = useWeb3React()
  const { formatCurrencyAmount } = useFormatter()
  const { symbol: fiatSymbol } = useActiveLocalCurrencyComponents()

  const { sendState, setSendState, derivedSendInfo } = useSendContext()
  const { inputInFiat, exactAmountToken, exactAmountFiat, inputCurrency } = sendState
  const { currencyBalance, exactAmountOut, parsedTokenAmount } = derivedSendInfo
  const maxInputAmount = maxAmountSpend(currencyBalance)
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedTokenAmount?.equalTo(maxInputAmount))

  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const fiatCurrency = useMemo(() => STABLECOIN_AMOUNT_OUT[chainId ?? ChainId.MAINNET].currency, [chainId])
  const fiatCurrencyEqualsTransferCurrency = !!inputCurrency && fiatCurrency.equals(inputCurrency)

  const formattedBalance = formatCurrencyAmount({
    amount: currencyBalance,
    type: NumberType.TokenNonTx,
  })

  const handleUserInput = useCallback(
    (newValue: string) => {
      setSendState((prev) => ({
        ...prev,
        [inputInFiat ? 'exactAmountFiat' : 'exactAmountToken']: newValue,
      }))
    },
    [inputInFiat, setSendState]
  )

  const handleSelectCurrency = useCallback(
    (currency: Currency) => {
      onCurrencyChange?.({ inputCurrency: currency, outputCurrency: undefined })

      if (fiatCurrency.equals(currency)) {
        setSendState((prev) => ({
          ...prev,
          exactAmountToken: exactAmountToken ?? exactAmountFiat,
          exactAmountFiat: undefined,
          inputInFiat: false,
          inputCurrency: currency,
        }))
        return
      }

      setSendState((prev) => ({
        ...prev,
        inputCurrency: currency,
      }))
    },
    [exactAmountFiat, exactAmountToken, fiatCurrency, onCurrencyChange, setSendState]
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
      <CurrencyInputWrapper shouldFetchOnAccountUpdate={tokenSelectorOpen}>
        <Row justify="space-between" width="100%" gap="sm">
          <Row width="100%" gap="md">
            <CurrencySelectorRow width="100%" gap="md" onClick={() => setTokenSelectorOpen(true)}>
              {inputCurrency && (
                <PortfolioLogo currencies={[inputCurrency]} size="36px" chainId={chainId ?? ChainId.MAINNET} />
              )}
              <Row width="100%">
                <Column>
                  <ThemedText.BodyPrimary lineHeight="24px">{inputCurrency?.name}</ThemedText.BodyPrimary>
                  <ThemedText.LabelMicro lineHeight="16px">{currencyBalance && formattedBalance}</ThemedText.LabelMicro>
                </Column>
              </Row>
            </CurrencySelectorRow>
            {showMaxButton && (
              <MaxButton onClick={handleMaxInput}>
                <Trans>Max</Trans>
              </MaxButton>
            )}
          </Row>
          <StyledCloseIcon size="20px" onClick={() => setTokenSelectorOpen(true)} />
        </Row>
      </CurrencyInputWrapper>
      <InputWrapper>
        <StyledNumericalInput
          value={inputInFiat ? exactAmountFiat : exactAmountToken}
          disabled={disabled}
          onUserInput={handleUserInput}
          placeholder={inputInFiat ? fiatSymbol + '0' : '0'}
          prependSymbol={inputInFiat ? fiatSymbol : undefined}
        />
        <AlternateCurrencyDisplay
          disabled={fiatCurrencyEqualsTransferCurrency}
          onToggle={toggleFiatInputAmountEnabled}
        />
        <InputError />
      </InputWrapper>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={handleSelectCurrency}
        selectedCurrency={inputCurrency}
        onlyShowCurrenciesWithBalance={account ? true : false}
      />
    </Wrapper>
  )
}
