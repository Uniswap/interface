import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useAccount } from 'hooks/useAccount'
import ms from 'ms'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ProviderOption } from 'pages/Swap/Buy/ProviderOption'
import { ContentWrapper, getOnRampInputAmount } from 'pages/Swap/Buy/shared'
import { useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Separator, Text } from 'ui/src'
import { TimePast } from 'ui/src/components/icons/TimePast'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORQuote, FORServiceProvider, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useInterval } from 'utilities/src/time/timing'

interface ChooseProviderModal {
  isOpen: boolean
  closeModal: () => void
}

function ChooseProviderModalContent({ closeModal }: ChooseProviderModal) {
  const { derivedBuyFormInfo, buyFormState } = useBuyFormContext()
  const { quoteCurrency, selectedCountry, inputAmount, inputInFiat, rampDirection, moonpayOnly } = buyFormState
  const { quotes, meldSupportedFiatCurrency, amountOut } = derivedBuyFormInfo
  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()

  const onRampInputAmount = useMemo(
    () => getOnRampInputAmount({ rampDirection, inputAmount, amountOut: amountOut ?? '0', inputInFiat }),
    [rampDirection, inputAmount, amountOut, inputInFiat],
  )

  const account = useAccount()

  const [mostRecentlyUsedProvider, otherProviders] = useMemo(() => {
    if (!quotes || !quotes.quotes) {
      return [undefined, []] as const
    }
    if (moonpayOnly) {
      // Force moonpay when the user has arrived from an ad and there's a moonpay quote available
      if (quotes.quotes.some((q: FORQuote) => q.serviceProviderDetails.serviceProvider.toLowerCase() === 'moonpay')) {
        return [
          undefined,
          quotes.quotes.filter((q: FORQuote) => q.serviceProviderDetails.serviceProvider.toLowerCase() === 'moonpay'),
        ]
      }
    }
    const mostRecent = quotes.quotes.find((q: FORQuote) => q.isMostRecentlyUsedProvider)
    if (mostRecent) {
      return [mostRecent, quotes.quotes.filter((q: FORQuote) => !q.isMostRecentlyUsedProvider)] as const
    }
    return [undefined, quotes.quotes] as const
  }, [moonpayOnly, quotes])

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
  const recipientAddress = account.address
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

  return (
    <Flex gap="$spacing24" pb="$spacing8" $sm={{ px: '$spacing8', pb: '$spacing16' }} id="ChooseProviderModal">
      <GetHelpHeader
        title={
          rampDirection === RampDirection.ONRAMP ? (
            <Trans i18nKey="fiatOnRamp.checkout.title" />
          ) : (
            <Trans i18nKey="fiatOffRamp.checkout.title" />
          )
        }
        link={uniswapUrls.helpArticleUrls.fiatOnRampHelp}
        closeModal={closeModal}
        closeDataTestId="ChooseProviderModal-close"
      />
      <Flex gap="16px">
        {mostRecentlyUsedProvider && (
          <Flex gap="$spacing12">
            <Flex row alignItems="center" pb="$spacing12" pl="$spacing8">
              <TimePast color="$neutral3" size="$icon.16" />
              <Text color="$neutral2" pl="$spacing4" variant="body3">
                <Trans i18nKey="fiatOnRamp.quote.type.recent" />
              </Text>
            </Flex>
            <ProviderOption
              key={mostRecentlyUsedProvider.serviceProviderDetails.serviceProvider}
              quote={mostRecentlyUsedProvider}
              selectedCountry={selectedCountry}
              quoteCurrencyCode={quoteCurrencyCode}
              inputAmount={onRampInputAmount}
              meldSupportedFiatCurrency={meldSupportedFiatCurrency}
              walletAddress={recipientAddress}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
              rampDirection={rampDirection}
            />
            {otherProviders.length > 0 && (
              <Flex centered row gap="$spacing12" mt="$spacing12">
                <Separator />
                <Text color="$neutral3" variant="body3">
                  <Trans i18nKey="fiatOnRamp.quote.type.other" />
                </Text>
                <Separator />
              </Flex>
            )}
          </Flex>
        )}

        {otherProviders.map((q: FORQuote) => {
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
            />
          )
        })}
        <Text variant="body3" textAlign="center" color="$neutral2">
          <Trans i18nKey="fiatOnRamp.chooseProvider.description" />
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
