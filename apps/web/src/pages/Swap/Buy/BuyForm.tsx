import { type ComponentRef, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Flex, styled, Text } from 'ui/src'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts } from 'ui/src/theme'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import UnsupportedTokenModal from 'uniswap/src/features/fiatOnRamp/UnsupportedTokenModal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { FiatOffRampEventName, FiatOnRampEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import useResizeObserver from 'use-resize-observer'
import { isSafeNumber } from 'utilities/src/primitives/integer'
import { usePrevious } from 'utilities/src/react/hooks'
import { AlternateCurrencyDisplay } from '~/components/AlternateCurrencyDisplay/AlternateCurrencyDisplay'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
} from '~/components/NumericalInput/LargeAmountInput'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { PAGE_WRAPPER_MAX_WIDTH } from '~/features/Swap/styled'
import { useAccount } from '~/hooks/useAccount'
import { BuyFormButton } from '~/pages/Swap/Buy/BuyFormButton'
import { BuyFormContextProvider, useBuyFormContext } from '~/pages/Swap/Buy/BuyFormContext'
import { ChooseProviderModal } from '~/pages/Swap/Buy/ChooseProviderModal'
import { CountryListModal } from '~/pages/Swap/Buy/CountryListModal'
import { FiatOnRampCurrencyModal } from '~/pages/Swap/Buy/FiatOnRampCurrencyModal'
import { fallbackCurrencyInfo, useOffRampTransferDetailsRequest } from '~/pages/Swap/Buy/hooks'
import { OffRampConfirmTransferModal } from '~/pages/Swap/Buy/OffRampConfirmTransferModal'
import { PredefinedAmount } from '~/pages/Swap/Buy/PredefinedAmount'
import { resolveInitialBuyFormToken } from '~/pages/Swap/Buy/resolveInitialBuyFormToken'
import { SelectTokenPanel } from '~/pages/Swap/Buy/SelectTokenPanel'
import { formatFiatOnRampFiatAmount, getCountryFromLocale } from '~/pages/Swap/Buy/shared'
import { popupRegistry } from '~/state/popups/registry'
import { SwitchNetworkAction } from '~/state/popups/types'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { showSwitchNetworkNotification } from '~/utils/showSwitchNetworkNotification'

const InputWrapper = styled(Flex, {
  backgroundColor: '$surface1',
  p: '$spacing16',
  pt: '$spacing12',
  pb: 52,
  height: 264,
  alignItems: 'center',
  borderRadius: '$rounded20',
  justifyContent: 'space-between',
  overflow: 'hidden',
  gap: '$spacing8',
  borderWidth: 1,
  borderColor: '$surface3',
})

const HeaderRow = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
})

const DEFAULT_FIAT_DECIMALS = 2
const PREDEFINED_AMOUNTS = [100, 300, 1000]
const PREDEFINED_PERCENTAGES = [25, 50, 75, 100]
const CHAR_WIDTH = 45
const MAX_FONT_SIZE = 70
const MIN_FONT_SIZE = 24

type BuyFormProps = {
  disabled?: boolean
  initialCurrency?: TradeableAsset | null
}

// oxlint-disable-next-line complexity
function BuyFormInner({ disabled, initialCurrency }: BuyFormProps) {
  const account = useAccount()
  const addresses = useActiveAddresses()
  const { t } = useTranslation()
  const { convertFiatAmount } = useLocalizationContext()
  const fiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(fiatCurrency)
  const [, setSearchParams] = useSearchParams()

  const { buyFormState, setBuyFormState, derivedBuyFormInfo, externalTransactionIdSuffix } = useBuyFormContext()
  const {
    inputAmount,
    inputInFiat,
    selectedCountry,
    quoteCurrency,
    currencyModalOpen,
    countryModalOpen,
    providerModalOpen,
    rampDirection,
    selectedUnsupportedCurrency,
  } = buyFormState
  const { supportedTokens, countryOptionsResult, error, amountOut, meldSupportedFiatCurrency } = derivedBuyFormInfo
  const navigate = useNavigate()

  const prevQuoteCurrency = usePrevious(quoteCurrency)
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const inputRef = useRef<ComponentRef<typeof StyledNumericalInput>>(null)

  useEffect(() => {
    const fiatValue = inputInFiat ? inputAmount : amountOut

    if (!fiatValue) {
      return
    }

    sendAnalyticsEvent(
      rampDirection === RampDirection.ON_RAMP
        ? FiatOnRampEventName.FiatOnRampAmountEntered
        : FiatOffRampEventName.FiatOffRampAmountEntered,
      {
        amountUSD: convertFiatAmount(Number(fiatValue)).amount,
        chainId: quoteCurrency?.currencyInfo?.currency.chainId,
        cryptoCurrency: quoteCurrency?.meldCurrencyCode ?? quoteCurrency?.currencyInfo?.currency.symbol,
        externalTransactionIdSuffix,
        fiatCurrency: meldSupportedFiatCurrency?.code,
        isTokenInputMode: !inputInFiat,
        source: 'textInput',
      },
    )
  }, [
    inputAmount,
    amountOut,
    inputInFiat,
    convertFiatAmount,
    rampDirection,
    quoteCurrency?.currencyInfo?.currency.chainId,
    quoteCurrency?.currencyInfo?.currency.symbol,
    quoteCurrency?.meldCurrencyCode,
    externalTransactionIdSuffix,
    meldSupportedFiatCurrency?.code,
  ])

  const { fontSize, onLayout, onSetFontSize, onExtraElementLayout } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CHAR_WIDTH,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
    maxWidth: PAGE_WRAPPER_MAX_WIDTH * 0.85,
  })

  const handleUserInput = useCallback(
    (value: string) => {
      // Omit parsing errors by checking if amount exceeds Number range limit
      if (!isSafeNumber(value)) {
        return
      }

      onSetFontSize(value)
      setBuyFormState((state) => ({ ...state, inputAmount: value }))
    },
    [onSetFontSize, setBuyFormState],
  )

  // Default to device locale to avoid blocking the UI
  const DEFAULT_COUNTRY = useMemo(() => getCountryFromLocale(), [])
  const { data: countryResult } = useFiatOnRampAggregatorGetCountryQuery()

  useEffect(() => {
    if (!selectedCountry) {
      // Use API result if available, otherwise default to locale-based country immediately
      // This ensures the UI is never blocked by a failed or slow country detection
      setBuyFormState((state) => ({ ...state, selectedCountry: countryResult ?? DEFAULT_COUNTRY }))
    } else if (countryResult && selectedCountry.countryCode === DEFAULT_COUNTRY.countryCode) {
      // Update to API result only if we're currently using the default locale-based country
      setBuyFormState((state) => ({ ...state, selectedCountry: countryResult }))
    }
  }, [buyFormState.selectedCountry, countryResult, selectedCountry, setBuyFormState, DEFAULT_COUNTRY])

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()

  useEffect(() => {
    const supportedToken = resolveInitialBuyFormToken({ parsedQs, supportedTokens, initialCurrency })
    const isTokenInputMode = (parsedQs.isTokenInputMode as string | undefined) === 'true'
    const providers = (parsedQs.providers as string | undefined)?.split(',')
    const hasProviders = !!providers && providers.length > 0
    const currencyAmount = parsedQs.value as string | undefined

    if (supportedToken) {
      const providerState: Partial<{ inputAmount: string; providers: string[] }> = {}
      if (hasProviders) {
        providerState.inputAmount = currencyAmount
        providerState.providers = providers.map((provider) => provider.toLowerCase())
      }
      setBuyFormState((state) => ({
        ...state,
        ...providerState,
        quoteCurrency: supportedToken,
        inputInFiat: !isTokenInputMode,
      }))
      return
    }
    // If connected to a non-mainnet chain, default to the native chain of that token if supported.
    const supportedNativeToken = supportedTokens?.find(
      (meldToken) =>
        meldToken.currencyInfo?.currency.chainId === account.chainId && meldToken.currencyInfo?.currency.isNative,
    )
    if (supportedNativeToken) {
      setBuyFormState((state) => ({
        ...state,
        quoteCurrency: supportedNativeToken,
        inputInFiat: !isTokenInputMode,
      }))
    }
  }, [account.chainId, parsedQs, initialCurrency, setBuyFormState, supportedTokens])

  const { data: balancesById } = usePortfolioBalances(addresses)

  // Tokens that have balance that aren't FOR supported
  const unsupportedCurrencies = useMemo(() => {
    if (!balancesById) {
      return []
    }
    const supportedCurrencyIds = supportedTokens?.map((token) => currencyId(token.currencyInfo?.currency)) ?? []
    return Object.keys(balancesById)
      .filter((id: string) => !supportedCurrencyIds.includes(id))
      .map((id: string) => ({ currencyInfo: balancesById[id].currencyInfo }))
  }, [balancesById, supportedTokens])

  const balance = useMemo(() => {
    const currentCurrencyId = currencyId(quoteCurrency?.currencyInfo?.currency)
    return currentCurrencyId ? balancesById?.[normalizeCurrencyIdForMapLookup(currentCurrencyId)] : undefined
  }, [balancesById, quoteCurrency?.currencyInfo?.currency])

  const scaledInputWidth = useMemo(
    () => (inputAmount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined),
    [inputAmount, hiddenObserver.width],
  )

  const offRampRequest = useOffRampTransferDetailsRequest()

  useEffect(() => {
    if (
      prevQuoteCurrency?.currencyInfo?.currency &&
      quoteCurrency?.currencyInfo?.currency &&
      prevQuoteCurrency.currencyInfo.currency.chainId !== quoteCurrency.currencyInfo.currency.chainId
    ) {
      popupRegistry.removePopup(`switchNetwork-${prevQuoteCurrency.currencyInfo.currency.chainId}`)
      showSwitchNetworkNotification({
        prevChainId: prevQuoteCurrency.currencyInfo.currency.chainId,
        chainId: quoteCurrency.currencyInfo.currency.chainId,
        action: rampDirection === RampDirection.ON_RAMP ? SwitchNetworkAction.Buy : SwitchNetworkAction.Sell,
      })
    }
  }, [quoteCurrency?.currencyInfo?.currency, prevQuoteCurrency?.currencyInfo?.currency, rampDirection])

  return (
    <Trace page={InterfacePageName.Buy} logImpression>
      <Flex gap="$spacing4">
        <InputWrapper>
          <HeaderRow>
            <Text variant="body3" userSelect="none" color="$neutral2">
              {rampDirection === RampDirection.ON_RAMP ? t('common.youreBuying') : t('common.youreSelling')}
            </Text>
            <FiatOnRampCountryPicker
              onPress={() => {
                setBuyFormState((state) => ({ ...state, countryModalOpen: true }))
              }}
              countryCode={selectedCountry?.countryCode}
            />
          </HeaderRow>
          <Flex
            alignItems="center"
            gap="$spacing16"
            maxWidth="100%"
            overflow="hidden"
            width="100%"
            cursor="text"
            onPress={() => inputRef.current?.focus()}
            onLayout={onLayout}
          >
            <Flex height={fonts.body3.lineHeight}>
              {error && (
                <Text variant="body3" userSelect="none" color="$statusCritical">
                  {error.message}
                </Text>
              )}
            </Flex>
            <NumericalInputWrapper>
              <Flex onLayout={onExtraElementLayout}>
                {inputInFiat && (
                  <NumericalInputSymbolContainer showPlaceholder={!inputAmount} numericalFontSize={fontSize}>
                    {fiatSymbol}
                  </NumericalInputSymbolContainer>
                )}
              </Flex>
              <StyledNumericalInput
                value={inputAmount}
                disabled={disabled}
                onUserInput={handleUserInput}
                placeholder="0"
                fieldWidth={scaledInputWidth}
                numericalFontSize={fontSize}
                maxDecimals={
                  inputInFiat
                    ? DEFAULT_FIAT_DECIMALS
                    : (quoteCurrency?.currencyInfo?.currency.decimals ?? DEFAULT_FIAT_DECIMALS)
                }
                testId={TestID.BuyFormAmountInput}
                ref={inputRef}
              />
              <NumericalInputMimic ref={hiddenObserver.ref} numericalFontSize={fontSize}>
                {inputAmount}
              </NumericalInputMimic>
            </NumericalInputWrapper>
            {quoteCurrency?.currencyInfo?.currency && inputAmount && (
              <Flex height={36} justifyContent="center">
                <AlternateCurrencyDisplay
                  disabled={disabled || !amountOut}
                  inputCurrency={quoteCurrency.currencyInfo.currency}
                  inputInFiat={inputInFiat}
                  exactAmountOut={amountOut}
                  onToggle={() => {
                    onSetFontSize(amountOut || '0')
                    setBuyFormState((state) => ({
                      ...state,
                      inputInFiat: !state.inputInFiat,
                      inputAmount: amountOut || '',
                    }))
                  }}
                />
              </Flex>
            )}
            {!inputAmount && rampDirection === RampDirection.ON_RAMP && (
              <Flex row alignItems="center" gap="$spacing8" justifyContent="center">
                {PREDEFINED_AMOUNTS.map((amount: number) => (
                  <PredefinedAmount
                    onPress={() => {
                      setBuyFormState((state) => ({
                        ...state,
                        inputInFiat: true,
                        inputAmount: amount.toString(),
                      }))
                      sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampAmountEntered, {
                        amountUSD: convertFiatAmount(amount).amount,
                        chainId: quoteCurrency?.currencyInfo?.currency.chainId,
                        cryptoCurrency: quoteCurrency?.meldCurrencyCode ?? quoteCurrency?.currencyInfo?.currency.symbol,
                        externalTransactionIdSuffix,
                        fiatCurrency: meldSupportedFiatCurrency?.code,
                        isTokenInputMode: false,
                        source: 'chip',
                      })
                    }}
                    key={amount}
                    label={formatFiatOnRampFiatAmount(amount, meldSupportedFiatCurrency ?? fallbackCurrencyInfo)}
                    disabled={disabled}
                  />
                ))}
              </Flex>
            )}
            {!inputAmount && rampDirection === RampDirection.OFF_RAMP && (
              <Flex row alignItems="center" gap="$spacing8" justifyContent="center">
                {PREDEFINED_PERCENTAGES.map((value: number) => (
                  <PredefinedAmount
                    key={value}
                    label={value === 100 ? t('common.max') : `${value}%`}
                    disabled={disabled || !balance?.balanceUSD}
                    onPress={() => {
                      if (!balance) {
                        return
                      }
                      const newInputAmount = balance.quantity * (value / 100)
                      setBuyFormState((state) => ({
                        ...state,
                        inputInFiat: false,
                        inputAmount: String(newInputAmount),
                      }))
                      sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampAmountEntered, {
                        amountUSD: convertFiatAmount(newInputAmount).amount,
                        chainId: quoteCurrency?.currencyInfo?.currency.chainId,
                        cryptoCurrency: quoteCurrency?.meldCurrencyCode ?? quoteCurrency?.currencyInfo?.currency.symbol,
                        externalTransactionIdSuffix,
                        fiatCurrency: meldSupportedFiatCurrency?.code,
                        isTokenInputMode: true,
                        source: 'chip',
                      })
                    }}
                  />
                ))}
              </Flex>
            )}
          </Flex>
        </InputWrapper>
        <SelectTokenPanel
          currency={quoteCurrency?.currencyInfo?.currency}
          balance={balance}
          disabled={disabled}
          testID={TestID.ChooseInputToken}
          onPress={() => {
            setBuyFormState((state) => ({ ...state, currencyModalOpen: true }))
          }}
        />
        <Flex row>
          <BuyFormButton />
        </Flex>
      </Flex>
      {supportedTokens && Boolean(supportedTokens.length) && (
        <FiatOnRampCurrencyModal
          isOpen={currencyModalOpen}
          onDismiss={() => {
            setBuyFormState((state) => ({ ...state, currencyModalOpen: false }))
          }}
          onSelectCurrency={(currency) => {
            setBuyFormState((state) => ({ ...state, quoteCurrency: currency }))
            sendAnalyticsEvent(
              rampDirection === RampDirection.ON_RAMP
                ? FiatOnRampEventName.FiatOnRampTokenSelected
                : FiatOffRampEventName.FiatOffRampTokenSelected,
              {
                chainId: currency.currencyInfo?.currency.chainId,
                externalTransactionIdSuffix,
                token:
                  currency.meldCurrencyCode ??
                  currency.moonpayCurrencyCode ??
                  currency.currencyInfo?.currency.symbol ??
                  '',
              },
            )
          }}
          currencies={supportedTokens}
          unsupportedCurrencies={unsupportedCurrencies}
        />
      )}
      <UnsupportedTokenModal
        isVisible={!!selectedUnsupportedCurrency}
        rampDirection={rampDirection}
        onAccept={() => {
          const currencyInfo = selectedUnsupportedCurrency?.currencyInfo
          if (!currencyInfo) {
            return
          }

          const params = new URLSearchParams({
            inputCurrency: currencyInfo.currency.wrapped.address,
            chain: getChainUrlParam(currencyInfo.currency.chainId),
            outputCurrency: NATIVE_CHAIN_ID,
          })
          Promise.resolve(navigate(`/swap?${params.toString()}`)).catch(() => {})
        }}
        onClose={() => {
          setBuyFormState((state) => ({ ...state, selectedUnsupportedCurrency: undefined }))
        }}
        onBack={() => {
          setBuyFormState((state) => ({ ...state, selectedUnsupportedCurrency: undefined }))
        }}
      />
      {countryOptionsResult?.supportedCountries && (
        <CountryListModal
          // oxlint-disable-next-line no-shadow
          onSelectCountry={(selectedCountry) => setBuyFormState((state) => ({ ...state, selectedCountry }))}
          countryList={countryOptionsResult.supportedCountries}
          isOpen={countryModalOpen}
          onDismiss={() => setBuyFormState((state) => ({ ...state, countryModalOpen: false }))}
          selectedCountry={selectedCountry}
        />
      )}
      {/* This modal must be conditionally rendered or page will crash on mweb */}
      {providerModalOpen && (
        <ChooseProviderModal
          isOpen={true}
          closeModal={() =>
            setBuyFormState((prev) => ({ ...prev, providerModalOpen: false, paymentMethod: undefined }))
          }
        />
      )}
      {offRampRequest && (
        <OffRampConfirmTransferModal
          isOpen
          // Clear URL params to remove the offramp request
          onClose={() => setSearchParams({})}
          request={offRampRequest}
        />
      )}
    </Trace>
  )
}

export function BuyForm({ rampDirection, ...props }: BuyFormProps & { rampDirection: RampDirection }) {
  return (
    <BuyFormContextProvider rampDirection={rampDirection}>
      <BuyFormInner {...props} />
    </BuyFormContextProvider>
  )
}
