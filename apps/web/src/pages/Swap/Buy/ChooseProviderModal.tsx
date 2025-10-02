import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import ms from 'ms'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ProviderOption } from 'pages/Swap/Buy/ProviderOption'
import { ContentWrapper, getOnRampInputAmount } from 'pages/Swap/Buy/shared'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EdgeFade } from 'uniswap/src/features/fiatOnRamp/EdgeFade/EdgeFade'
import { PaymentMethodFilter } from 'uniswap/src/features/fiatOnRamp/PaymentMethodFilter/PaymentMethodFilter'
import { FORFilters, FORQuote, FORServiceProvider, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { filterQuotesByPaymentMethod } from 'uniswap/src/features/fiatOnRamp/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useIsForFiltersEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsForFiltersEnabled'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useInterval } from 'utilities/src/time/timing'
import { unwrappedToken } from 'utils/unwrappedToken'

interface ChooseProviderModal {
  isOpen: boolean
  closeModal: () => void
}

function ChooseProviderModalContent({ closeModal }: ChooseProviderModal) {
  const { derivedBuyFormInfo, buyFormState, setBuyFormState } = useBuyFormContext()
  const { quoteCurrency, selectedCountry, inputAmount, inputInFiat, rampDirection, moonpayOnly, paymentMethod } =
    buyFormState
  const { quotes, meldSupportedFiatCurrency, amountOut } = derivedBuyFormInfo
  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()
  const [initialQuotesHeight, setInitialQuotesHeight] = useState<number | null>(null)
  const quotesContainerRef = useRef<HTMLDivElement>(null)
  const isFORFiltersEnabled = useIsForFiltersEnabled()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const unwrappedCurrency = quoteCurrency?.currencyInfo?.currency
    ? unwrappedToken(quoteCurrency.currencyInfo.currency)
    : undefined
  const unwrappedCurrencyId = unwrappedCurrency
    ? buildCurrencyId(unwrappedCurrency.chainId, currencyAddress(unwrappedCurrency))
    : undefined
  const unwrappedCurrencyInfo = useCurrencyInfo(unwrappedCurrencyId)

  const onRampInputAmount = useMemo(
    () => getOnRampInputAmount({ rampDirection, inputAmount, amountOut: amountOut ?? '0', inputInFiat }),
    [rampDirection, inputAmount, amountOut, inputInFiat],
  )

  const rampAmountFiatValue = useMemo(() => {
    return getOnRampInputAmount({ rampDirection: 0, inputAmount, amountOut: amountOut ?? '0', inputInFiat })
  }, [inputAmount, amountOut, inputInFiat])

  const recipientAddress = useActiveAddress(quoteCurrency?.currencyInfo?.currency.chainId ?? UniverseChainId.Mainnet)

  const sortedQuotes = useMemo(() => {
    if (!quotes?.quotes) {
      return undefined
    }
    if (moonpayOnly) {
      // Force moonpay when the user has arrived from an ad and there's a moonpay quote available
      if (quotes.quotes.some((q: FORQuote) => q.serviceProviderDetails.serviceProvider.toLowerCase() === 'moonpay')) {
        return quotes.quotes.filter(
          (q: FORQuote) => q.serviceProviderDetails.serviceProvider.toLowerCase() === 'moonpay',
        )
      }
    }
    return [...quotes.quotes].sort((a) => (a.isMostRecentlyUsedProvider ? -1 : 1))
  }, [moonpayOnly, quotes])

  const filteredQuotes = useMemo(() => {
    if (!quotes?.quotes) {
      return undefined
    }
    return isFORFiltersEnabled ? filterQuotesByPaymentMethod(quotes.quotes, paymentMethod) : quotes.quotes
  }, [quotes, paymentMethod, isFORFiltersEnabled])

  // Provider modal should have a fixed height determined on pageload by number of quotes to prevent thrashing when filters are applied
  useEffect(() => {
    if (sortedQuotes && sortedQuotes.length > 0 && quotesContainerRef.current) {
      const height = quotesContainerRef.current.scrollHeight
      if (!initialQuotesHeight || Math.abs(sortedQuotes.length - (quotes?.quotes?.length || 0)) > 2) {
        setInitialQuotesHeight(height)
      }
    }
  }, [sortedQuotes, initialQuotesHeight, quotes?.quotes?.length])

  const onClose = () => {
    closeModal()
    // Delay the state reset until the modal finishes animating away:
    setTimeout(() => {
      setErrorProvider(undefined)
      setConnectedProvider(undefined)
    }, ms('500ms'))
  }

  // close modal after 5 minutes because some provider link have expirations and we don't want to keep generating these if the user is not active
  useInterval(() => {
    if (!errorProvider && !connectedProvider) {
      onClose()
    }
  }, ms('5m'))

  const quoteCurrencyCode = quoteCurrency?.meldCurrencyCode
  if (!selectedCountry || !quoteCurrencyCode || !meldSupportedFiatCurrency || !recipientAddress) {
    logger.debug('ChooseProviderModal', 'ChooseProviderModalContent', 'Modal opened with invalid state. Closing modal.')
    onClose()
    return null
  }

  if (errorProvider) {
    return (
      <ProviderConnectionError
        onBack={() => setErrorProvider(undefined)}
        closeModal={onClose}
        selectedServiceProvider={errorProvider}
      />
    )
  }

  if (connectedProvider) {
    return <ProviderConnectedView closeModal={onClose} selectedServiceProvider={connectedProvider} />
  }

  function setPaymentMethod(method?: FORFilters): void {
    setBuyFormState((prev) => ({ ...prev, paymentMethod: method }))
  }

  const filterRowPadding = 24

  const showFilter = isFORFiltersEnabled && !!quotes?.quotes?.length

  return (
    <Flex
      gap="$spacing16"
      pb="$spacing8"
      $sm={{ px: '$spacing8', pb: '$spacing16' }}
      id="ChooseProviderModal"
      $platform-web={{
        overflowX: 'hidden',
      }}
    >
      <Flex gap="$spacing24">
        <GetHelpHeader
          link={uniswapUrls.helpArticleUrls.fiatOnRampHelp}
          closeModal={closeModal}
          closeDataTestId="ChooseProviderModal-close"
        />
        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="subheading1" color="$neutral1">
            {rampDirection === RampDirection.ONRAMP ? t('fiatOnRamp.checkout.title') : t('fiatOffRamp.checkout.title')}
          </Text>
          <Flex row gap="$spacing12" alignItems="center" pr="$spacing2">
            <Text variant="body2" color="$neutral2">
              {convertFiatAmountFormatted(rampAmountFiatValue, NumberType.FiatTokenPrice)}
            </Text>
            {unwrappedCurrencyInfo && <CurrencyLogo currencyInfo={unwrappedCurrencyInfo} size={iconSizes.icon24} />}
          </Flex>
        </Flex>
      </Flex>
      {/* The filter row extends into the Modal padding to show a scroll fade */}
      <Flex
        width={`calc(100% + ${2 * filterRowPadding}px)`}
        ml={-filterRowPadding}
        overflow="hidden"
        display={showFilter ? 'flex' : 'none'}
        position="relative"
      >
        <EdgeFade side="left" width={filterRowPadding} $sm={{ left: filterRowPadding / 2 }} />
        <PaymentMethodFilter
          quotes={quotes?.quotes}
          paymentMethod={buyFormState.paymentMethod}
          setPaymentMethod={setPaymentMethod}
          isOffRamp={rampDirection === RampDirection.OFFRAMP}
          px={filterRowPadding}
        />
        <EdgeFade side="right" width={filterRowPadding} $sm={{ right: filterRowPadding / 2 }} />
      </Flex>
      <Flex
        ref={quotesContainerRef}
        gap="$gap8"
        style={initialQuotesHeight ? { height: initialQuotesHeight } : undefined}
      >
        {sortedQuotes?.map((q: FORQuote) => {
          return (
            <ProviderOption
              key={q.serviceProviderDetails.serviceProvider}
              quote={q}
              selectedCountry={selectedCountry}
              quoteCurrencyCode={quoteCurrencyCode}
              inputAmount={onRampInputAmount}
              meldSupportedFiatCurrency={meldSupportedFiatCurrency}
              walletAddress={recipientAddress}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
              rampDirection={rampDirection}
              paymentMethodFilter={buyFormState.paymentMethod}
              hidden={!filteredQuotes?.includes(q)}
            />
          )
        })}
        <Text variant="body4" textAlign="center" color="$neutral2" px="$spacing16">
          {t('fiatOnRamp.chooseProvider.description')}
        </Text>
      </Flex>
    </Flex>
  )
}

export function ChooseProviderModal(props: ChooseProviderModal) {
  return (
    <Modal name={ModalName.FiatOnramp} isModalOpen={props.isOpen} onClose={props.closeModal} maxWidth={420}>
      <ContentWrapper>
        <ChooseProviderModalContent {...props} />
      </ContentWrapper>
    </Modal>
  )
}
