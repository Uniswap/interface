import { useAccount } from 'hooks/useAccount'
import { BuyFormButton } from 'pages/Swap/Buy/BuyFormButton'
import { BuyFormContextProvider, useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
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
import { useTranslation } from 'react-i18next'
import { Flex, Text, styled } from 'ui/src'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { SelectTokenButton } from 'uniswap/src/features/fiatOnRamp/SelectTokenButton'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { FiatOnRampEventName, InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import useResizeObserver from 'use-resize-observer'
import { useFormatter } from 'utils/formatNumbers'

const InputWrapper = styled(Flex, {
  backgroundColor: '$surface2',
  p: '$spacing16',
  pt: '$spacing12',
  pb: 52,
  height: 342,
  alignItems: 'center',
  borderRadius: '$rounded16',
  justifyContent: 'space-between',
  overflow: 'hidden',
  gap: '$spacing8',
})

const HeaderRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
})

const PREDEFINED_AMOUNTS = [100, 300, 1000]

type BuyFormProps = {
  disabled?: boolean
  initialCurrency?: TradeableAsset | null
}

function BuyFormInner({ disabled, initialCurrency }: BuyFormProps) {
  const account = useAccount()
  const { t } = useTranslation()
  const { convertToFiatAmount } = useFormatter()
  const fiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(fiatCurrency)

  const { buyFormState, setBuyFormState, derivedBuyFormInfo } = useBuyFormContext()
  const { inputAmount, selectedCountry, quoteCurrency, currencyModalOpen, countryModalOpen, providerModalOpen } =
    buyFormState
  const { amountOut, amountOutLoading, supportedTokens, countryOptionsResult, error } = derivedBuyFormInfo

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

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  useEffect(() => {
    let supportedToken: Maybe<FiatOnRampCurrency>

    if (initialCurrency) {
      const supportedNativeToken = supportedTokens?.find(
        (meldToken) =>
          meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
          meldToken.currencyInfo?.currency.isNative,
      )
      // Defaults the quote currency to the initial currency if supported
      supportedToken =
        supportedTokens?.find(
          (meldToken) =>
            meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
            meldToken.currencyInfo?.currency.isToken &&
            meldToken.currencyInfo?.currency.address === initialCurrency.address,
        ) || supportedNativeToken
    } else {
      const quoteCurrencyCode = parsedQs.quoteCurrencyCode
      if (quoteCurrencyCode) {
        // Defaults the quote currency to the initial currency (from query params) if supported
        supportedToken = supportedTokens?.find((meldToken) => meldToken.meldCurrencyCode === quoteCurrencyCode)
      }
    }

    if (supportedToken) {
      setBuyFormState((state) => ({
        ...state,
        quoteCurrency: supportedToken,
      }))
      return
    }
    // If connected to a non-mainnet chain, default to the native chain of that token if supported.
    const supportedNativeToken = supportedTokens?.find((meldToken) => {
      return meldToken.currencyInfo?.currency.chainId === account.chainId && meldToken.currencyInfo?.currency.isNative
    })
    if (account.chainId !== UniverseChainId.Mainnet && supportedNativeToken) {
      setBuyFormState((state) => ({
        ...state,
        quoteCurrency: supportedNativeToken,
      }))
    }
  }, [account.chainId, parsedQs, initialCurrency, setBuyFormState, supportedTokens])

  return (
    <Trace page={InterfacePageNameLocal.Buy} logImpression>
      <Flex gap="$spacing4">
        <InputWrapper>
          <HeaderRow>
            <Text variant="body3" userSelect="none" color="$neutral2">
              {t('common.youreBuying')}
            </Text>
            <FiatOnRampCountryPicker
              onPress={() => {
                setBuyFormState((state) => ({ ...state, countryModalOpen: true }))
              }}
              countryCode={selectedCountry?.countryCode}
            />
          </HeaderRow>
          <Flex alignItems="center" gap="$spacing8">
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
                testId="buy-form-amount-input"
              />
              <NumericalInputMimic ref={hiddenObserver.ref}>{inputAmount}</NumericalInputMimic>
            </NumericalInputWrapper>
            <SelectTokenButton
              onPress={() => {
                setBuyFormState((state) => ({ ...state, currencyModalOpen: true }))
              }}
              selectedCurrencyInfo={quoteCurrency?.currencyInfo}
              formattedAmount={amountOutLoading ? '' : amountOut ?? '-'}
              disabled={disabled}
              iconSize={18}
              chevronDirection="down"
              loading={amountOutLoading && inputAmount !== ''}
              testID={TestID.ChooseInputToken}
            />
            <Flex row alignItems="center" gap="$spacing8" justifyContent="center" mt="$spacing8">
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
            </Flex>
          </Flex>
        </InputWrapper>
        <Flex row>
          <BuyFormButton />
        </Flex>
      </Flex>
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
      {/* This modal must be conditionally rendered or page will crash on mweb */}
      {providerModalOpen && (
        <ChooseProviderModal
          isOpen={true}
          closeModal={() => setBuyFormState((prev) => ({ ...prev, providerModalOpen: false }))}
        />
      )}
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
