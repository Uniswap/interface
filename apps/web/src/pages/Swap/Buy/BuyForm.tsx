import { popupRegistry } from 'components/Popups/registry'
import { SwitchNetworkAction } from 'components/Popups/types'
import { PAGE_WRAPPER_MAX_WIDTH } from 'components/swap/styled'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { BuyFormButton } from 'pages/Swap/Buy/BuyFormButton'
import { BuyFormContextProvider, useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ChooseProviderModal } from 'pages/Swap/Buy/ChooseProviderModal'
import { CountryListModal } from 'pages/Swap/Buy/CountryListModal'
import { FiatOnRampCurrencyModal } from 'pages/Swap/Buy/FiatOnRampCurrencyModal'
import { fallbackCurrencyInfo, useOffRampTransferDetailsRequest } from 'pages/Swap/Buy/hooks'
import { OffRampConfirmTransferModal } from 'pages/Swap/Buy/OffRampConfirmTransferModal'
import { PredefinedAmount } from 'pages/Swap/Buy/PredefinedAmount'
import { formatFiatOnRampFiatAmount, getCountryFromLocale } from 'pages/Swap/Buy/shared'
import { AlternateCurrencyDisplay } from 'pages/Swap/common/AlternateCurrencyDisplay'
import { SelectTokenPanel } from 'pages/Swap/common/SelectTokenPanel'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
  useWidthAdjustedDisplayValue,
} from 'pages/Swap/common/shared'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { Flex, styled, Text } from 'ui/src'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { useAppFiatCurrency, useFiatCurrencyComponents } from 'uniswap/src/features/fiatCurrency/hooks'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { FiatOnRampCurrency, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import UnsupportedTokenModal from 'uniswap/src/features/fiatOnRamp/UnsupportedTokenModal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FiatOffRampEventName, FiatOnRampEventName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import useResizeObserver from 'use-resize-observer'
import { usePrevious } from 'utilities/src/react/hooks'
import { getChainUrlParam } from 'utils/chainParams'
import { showSwitchNetworkNotification } from 'utils/showSwitchNetworkNotification'

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

function BuyFormInner({ disabled, initialCurrency }: BuyFormProps) {
  const account = useAccount()
  const wallet = useWallet()
  const { t } = useTranslation()
  const { convertFiatAmount } = useLocalizationContext()
  const fiatCurrency = useAppFiatCurrency()
  const { symbol: fiatSymbol } = useFiatCurrencyComponents(fiatCurrency)
  const [, setSearchParams] = useSearchParams()

  const { buyFormState, setBuyFormState, derivedBuyFormInfo } = useBuyFormContext()
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
  const postWidthAdjustedDisplayValue = useWidthAdjustedDisplayValue(inputAmount)
  const hiddenObserver = useResizeObserver<HTMLElement>()

  useEffect(() => {
    const fiatValue = inputInFiat ? inputAmount : derivedBuyFormInfo.amountOut

    if (!fiatValue) {
      return
    }

    sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampAmountEntered, {
      amountUSD: convertFiatAmount(Number(fiatValue)).amount,
      source: 'textInput',
    })
  }, [inputAmount, derivedBuyFormInfo.amountOut, inputInFiat, convertFiatAmount])

  const { fontSize, onLayout, onSetFontSize } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CHAR_WIDTH,
    maxFontSize: MAX_FONT_SIZE,
    minFontSize: MIN_FONT_SIZE,
  })

  const handleUserInput = useCallback(
    (value: string) => {
      onSetFontSize(value)
      setBuyFormState((state) => ({ ...state, inputAmount: value }))
    },
    [onSetFontSize, setBuyFormState],
  )

  // Default to device locale to avoid blocking the UI
  const DEFAULT_COUNTRY = useMemo(() => getCountryFromLocale(), [])
  const { data: countryResult } = useFiatOnRampAggregatorGetCountryQuery()

  // biome-ignore lint/correctness/useExhaustiveDependencies: +buyFormState.selectedCountry, +selectedCountry
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
    let supportedToken: Maybe<FiatOnRampCurrency>
    const currencyCode = parsedQs.currencyCode as string | undefined
    const providers = (parsedQs.providers as string | undefined)?.split(',')
    const hasProviders = providers && providers.length > 0
    const currencyAmount = parsedQs.value as string | undefined
    const isTokenInputMode = (parsedQs.isTokenInputMode as string | undefined) === 'true'

    if (initialCurrency) {
      const supportedNativeToken = supportedTokens?.find(
        (meldToken) =>
          meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
          meldToken.currencyInfo.currency.isNative,
      )
      // Defaults the quote currency to the initial currency if supported
      supportedToken =
        supportedTokens?.find(
          (meldToken) =>
            meldToken.currencyInfo?.currency.chainId === initialCurrency.chainId &&
            meldToken.currencyInfo.currency.isToken &&
            meldToken.currencyInfo.currency.address === initialCurrency.address,
        ) || supportedNativeToken
    } else if (hasProviders && currencyCode) {
      // We are using melds currency code here because the chain id will not be set because this is coming from an ad
      supportedToken = supportedTokens?.find(
        (meldToken) => meldToken.meldCurrencyCode?.toLowerCase() === currencyCode.toLowerCase(),
      )
    } else if (currencyCode) {
      // Defaults the quote currency to the initial currency (from query params) if supported
      const chainId = parsedQs.chainId ? Number(parsedQs.chainId) : UniverseChainId.Mainnet
      supportedToken = supportedTokens?.find(
        (meldToken) =>
          meldToken.currencyInfo?.currency.symbol === currencyCode &&
          meldToken.currencyInfo.currency.chainId === chainId,
      )
    } else {
      supportedToken =
        supportedTokens?.find((meldToken) =>
          meldToken.currencyInfo?.currency.equals(nativeOnChain(UniverseChainId.Mainnet)),
        ) ?? supportedTokens?.[0]
    }

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
    const supportedNativeToken = supportedTokens?.find((meldToken) => {
      return meldToken.currencyInfo?.currency.chainId === account.chainId && meldToken.currencyInfo?.currency.isNative
    })
    if (supportedNativeToken) {
      setBuyFormState((state) => ({
        ...state,
        quoteCurrency: supportedNativeToken,
        inputInFiat: !isTokenInputMode,
      }))
    }
  }, [account.chainId, parsedQs, initialCurrency, setBuyFormState, supportedTokens])

  const { data: balancesById } = usePortfolioBalances({
    evmAddress: wallet.evmAccount?.address,
    svmAddress: wallet.svmAccount?.address,
  })

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

  const maxContainerWidth = PAGE_WRAPPER_MAX_WIDTH * 0.8
  const scaledInputWidth = useMemo(
    () => (inputAmount && hiddenObserver.width ? Math.min(hiddenObserver.width + 1, maxContainerWidth) : undefined),
    [inputAmount, hiddenObserver.width, maxContainerWidth],
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
        action: rampDirection === RampDirection.ONRAMP ? SwitchNetworkAction.Buy : SwitchNetworkAction.Sell,
      })
    }
  }, [quoteCurrency?.currencyInfo?.currency, prevQuoteCurrency?.currencyInfo?.currency, rampDirection])

  return (
    <Trace page={InterfacePageName.Buy} logImpression>
      <Flex gap="$spacing4" onLayout={onLayout}>
        <InputWrapper>
          <HeaderRow>
            <Text variant="body3" userSelect="none" color="$neutral2">
              {rampDirection === RampDirection.ONRAMP ? t('common.youreBuying') : t('common.youreSelling')}
            </Text>
            <FiatOnRampCountryPicker
              onPress={() => {
                setBuyFormState((state) => ({ ...state, countryModalOpen: true }))
              }}
              countryCode={selectedCountry?.countryCode}
            />
          </HeaderRow>
          <Flex alignItems="center" gap="$spacing16" maxWidth="100%" overflow="hidden">
            {error && (
              <Text variant="body3" userSelect="none" color="$statusCritical">
                {error.message}
              </Text>
            )}
            <NumericalInputWrapper>
              {inputInFiat && (
                <NumericalInputSymbolContainer showPlaceholder={!inputAmount} $fontSize={fontSize}>
                  {fiatSymbol}
                </NumericalInputSymbolContainer>
              )}
              <StyledNumericalInput
                value={postWidthAdjustedDisplayValue}
                disabled={disabled}
                onUserInput={handleUserInput}
                placeholder="0"
                $width={scaledInputWidth}
                $fontSize={fontSize}
                maxDecimals={
                  inputInFiat
                    ? DEFAULT_FIAT_DECIMALS
                    : (quoteCurrency?.currencyInfo?.currency.decimals ?? DEFAULT_FIAT_DECIMALS)
                }
                testId={TestID.BuyFormAmountInput}
              />
              <NumericalInputMimic ref={hiddenObserver.ref}>{inputAmount}</NumericalInputMimic>
            </NumericalInputWrapper>
            {quoteCurrency?.currencyInfo?.currency && inputAmount && (
              <Flex height={36} justifyContent="center">
                <AlternateCurrencyDisplay
                  disabled={disabled || !amountOut}
                  inputCurrency={quoteCurrency.currencyInfo.currency}
                  inputInFiat={inputInFiat}
                  exactAmountOut={amountOut}
                  onToggle={() => {
                    setBuyFormState((state) => ({
                      ...state,
                      inputInFiat: !state.inputInFiat,
                      inputAmount: amountOut || '',
                    }))
                  }}
                />
              </Flex>
            )}
            {!inputAmount && rampDirection === RampDirection.ONRAMP && (
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
            {!inputAmount && rampDirection === RampDirection.OFFRAMP && (
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
            sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTokenSelected, {
              token:
                currency.meldCurrencyCode ??
                currency.moonpayCurrencyCode ??
                currency.currencyInfo?.currency.symbol ??
                '',
            })
          }}
          currencies={supportedTokens}
          unsupportedCurrencies={unsupportedCurrencies}
        />
      )}
      <UnsupportedTokenModal
        isVisible={!!selectedUnsupportedCurrency}
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
          navigate(`/swap?${params.toString()}`)
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
