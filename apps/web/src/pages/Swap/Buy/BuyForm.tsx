import Column from 'components/Column'
import Row from 'components/Row'
import { useActiveLocalCurrencyComponents } from 'hooks/useActiveLocalCurrency'
import styled from 'lib/styled-components'
import { BuyFormButton } from 'pages/Swap/Buy/BuyFormButton'
import { BuyFormContextProvider, ethCurrencyInfo, useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ChooseProviderModal } from 'pages/Swap/Buy/ChooseProviderModal'
import { CountryListModal } from 'pages/Swap/Buy/CountryListModal'
import { FiatOnRampCurrencyModal } from 'pages/Swap/Buy/FiatOnRampCurrencyModal'
import { PredefinedAmount } from 'pages/Swap/Buy/PredefinedAmount'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
  useWidthAdjustedDisplayValue,
} from 'pages/Swap/common/shared'
import { useEffect } from 'react'
import { Trans } from 'react-i18next'
import { Text } from 'ui/src/components/text/Text'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { SelectTokenButton } from 'uniswap/src/features/fiatOnRamp/SelectTokenButton'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/api'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { FiatOnRampEventName, InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import useResizeObserver from 'use-resize-observer'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const InputWrapper = styled(Column)`
  position: relative;
  background-color: ${({ theme }) => theme.surface2};
  padding: 0 16px 52px 16px;
  height: 342px;
  align-items: center;
  border-radius: 20px;
  justify-content: flex-end;
  overflow: hidden;
  gap: 8px;
`

const HeaderRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 16px;
  left: 16px;
  width: calc(100% - 32px);
`

const PREDEFINED_AMOUNTS = [100, 300, 1000]

type BuyFormProps = {
  disabled?: boolean
}

function BuyFormInner({ disabled }: BuyFormProps) {
  const { formatNumberOrString, convertToFiatAmount } = useFormatter()
  const { symbol: fiatSymbol } = useActiveLocalCurrencyComponents()

  const { buyFormState, setBuyFormState, derivedBuyFormInfo } = useBuyFormContext()
  const { inputAmount, selectedCountry, quoteCurrency, currencyModalOpen, countryModalOpen, providerModalOpen } =
    buyFormState
  const { amountOut, amountOutLoading, supportedTokens, countryOptionsResult, error, notAvailableInThisRegion } =
    derivedBuyFormInfo

  const postWidthAdjustedDisplayValue = useWidthAdjustedDisplayValue(inputAmount)
  const hiddenObserver = useResizeObserver<HTMLElement>()

  const handleUserInput = (newValue: string) => {
    setBuyFormState((state) => ({ ...state, inputAmount: newValue }))
    sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampAmountEntered, {
      amountUSD: convertToFiatAmount(Number(newValue)).amount,
      source: 'textInput',
    })
  }

  const { data: countryResult } = useFiatOnRampAggregatorGetCountryQuery()
  useEffect(() => {
    if (!selectedCountry && countryResult) {
      setBuyFormState((state) => ({ ...state, selectedCountry: countryResult }))
    }
  }, [buyFormState.selectedCountry, countryResult, selectedCountry, setBuyFormState])

  return (
    <Trace page={InterfacePageNameLocal.Buy} logImpression>
      <Column gap="xs">
        <InputWrapper>
          <HeaderRow>
            <Text variant="body3" userSelect="none" color="$neutral2">
              <Trans i18nKey="common.youreBuying" />
            </Text>
            <FiatOnRampCountryPicker
              onPress={() => {
                setBuyFormState((state) => ({ ...state, countryModalOpen: true }))
              }}
              countryCode={selectedCountry?.countryCode}
            />
          </HeaderRow>
          {error && (
            <Text variant="body3" userSelect="none" color="$statusCritical">
              {error.message}
            </Text>
          )}
          <NumericalInputWrapper>
            <NumericalInputSymbolContainer showPlaceholder={!inputAmount}>{fiatSymbol}</NumericalInputSymbolContainer>
            <StyledNumericalInput
              value={postWidthAdjustedDisplayValue}
              disabled={disabled}
              onUserInput={handleUserInput}
              placeholder="0"
              $width={inputAmount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
              maxDecimals={6}
            />
            <NumericalInputMimic ref={hiddenObserver.ref}>{inputAmount}</NumericalInputMimic>
          </NumericalInputWrapper>
          <SelectTokenButton
            onPress={() => {
              setBuyFormState((state) => ({ ...state, currencyModalOpen: true }))
            }}
            selectedCurrencyInfo={quoteCurrency.currencyInfo ?? ethCurrencyInfo}
            formattedAmount={
              amountOutLoading
                ? ''
                : formatNumberOrString({
                    input: amountOut || '0',
                    type: NumberType.TokenNonTx,
                  })
            }
            disabled={disabled}
            iconSize={18}
            chevronDirection="down"
            backgroundColor="$surface1"
            amountReady={Boolean(amountOut)}
            loading={amountOutLoading && inputAmount !== ''}
          />
          <Row gap="md" justify="center" marginTop="8px">
            {PREDEFINED_AMOUNTS.map((amount: number) => (
              <PredefinedAmount
                onClick={() => {
                  setBuyFormState((state) => ({ ...state, inputAmount: amount.toString() }))
                  sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampAmountEntered, {
                    amountUSD: convertToFiatAmount(amount).amount,
                    source: 'chip',
                  })
                }}
                key={amount}
                amount={amount}
                currentAmount={inputAmount}
                disabled={disabled}
              />
            ))}
          </Row>
          {notAvailableInThisRegion && (
            <Text
              variant="body3"
              userSelect="none"
              color="$neutral2"
              textAlign="center"
              position="absolute"
              bottom="20px"
            >
              <Trans i18nKey="fiatOnRamp.notAvailable.error" />
            </Text>
          )}
        </InputWrapper>
        <BuyFormButton />
      </Column>
      {supportedTokens && Boolean(supportedTokens?.length) && (
        <FiatOnRampCurrencyModal
          isOpen={currencyModalOpen}
          onDismiss={() => {
            setBuyFormState((state) => ({ ...state, currencyModalOpen: false }))
          }}
          onSelectCurrency={(currency) => {
            setBuyFormState((state) => ({ ...state, quoteCurrency: currency }))
            sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTokenSelected, {
              token:
                currency.meldCurrencyCode ??
                currency.moonpayCurrencyCode ??
                currency.currencyInfo?.currency.symbol ??
                '',
            })
          }}
          currencies={supportedTokens}
        />
      )}
      {countryOptionsResult?.supportedCountries && (
        <CountryListModal
          onSelectCountry={(selectedCountry) => setBuyFormState((state) => ({ ...state, selectedCountry }))}
          countryList={countryOptionsResult?.supportedCountries}
          isOpen={countryModalOpen}
          onDismiss={() => setBuyFormState((state) => ({ ...state, countryModalOpen: false }))}
          selectedCountry={selectedCountry}
        />
      )}
      <ChooseProviderModal
        isOpen={providerModalOpen}
        closeModal={() => setBuyFormState((prev) => ({ ...prev, providerModalOpen: false }))}
      />
    </Trace>
  )
}

export function BuyForm(props: BuyFormProps) {
  return (
    <BuyFormContextProvider>
      <BuyFormInner {...props} />
    </BuyFormContextProvider>
  )
}
