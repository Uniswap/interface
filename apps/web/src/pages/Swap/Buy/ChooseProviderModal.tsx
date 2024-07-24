import { AutoColumn } from 'components/Column'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import ms from 'ms'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ProviderOption } from 'pages/Swap/Buy/ProviderOption'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { AdaptiveWebModalSheet, Flex, Separator, Text } from 'ui/src'
import { TimePast } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORQuote, FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { logger } from 'utilities/src/logger/logger'

const ProviderListPaddedColumn = styled(AutoColumn)`
  position: relative;
  padding-bottom: 8px;
`

interface ChooseProviderModal {
  isOpen: boolean
  closeModal: () => void
}

function ChooseProviderModalContent({ closeModal }: ChooseProviderModal) {
  const { derivedBuyFormInfo, buyFormState } = useBuyFormContext()
  const { quoteCurrency, selectedCountry, inputAmount } = buyFormState
  const { quotes, meldSupportedFiatCurrency } = derivedBuyFormInfo
  const [errorProvider, setErrorProvider] = useState<FORServiceProvider>()
  const [connectedProvider, setConnectedProvider] = useState<FORServiceProvider>()

  const account = useAccount()

  const [mostRecentlyUsedProvider, otherProviders] = useMemo(() => {
    if (!quotes || !quotes.quotes) {
      return [undefined, []] as const
    }
    const mostRecent = quotes.quotes.find((q: FORQuote) => q.isMostRecentlyUsedProvider)
    if (mostRecent) {
      return [mostRecent, quotes.quotes.filter((q: FORQuote) => !q.isMostRecentlyUsedProvider)] as const
    }
    return [undefined, quotes.quotes] as const
  }, [quotes])

  const onClose = () => {
    closeModal()
    // Delay the state reset until the modal finishes animating away:
    setTimeout(() => {
      setErrorProvider(undefined)
      setConnectedProvider(undefined)
    }, ms('500ms'))
  }

  const quoteCurrencyCode = quoteCurrency.meldCurrencyCode
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
    <ProviderListPaddedColumn gap="24px">
      <GetHelpHeader
        title={<Trans i18nKey="fiatOnRamp.checkoutWith" />}
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
              inputAmount={inputAmount}
              meldSupportedFiatCurrency={meldSupportedFiatCurrency}
              walletAddress={recipientAddress}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
            />
            {otherProviders && otherProviders.length > 0 && (
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

        {otherProviders?.map((q: FORQuote) => {
          return (
            <ProviderOption
              key={q.serviceProviderDetails.serviceProvider}
              quote={q}
              selectedCountry={selectedCountry}
              quoteCurrencyCode={quoteCurrencyCode}
              inputAmount={inputAmount}
              meldSupportedFiatCurrency={meldSupportedFiatCurrency}
              walletAddress={recipientAddress}
              setConnectedProvider={setConnectedProvider}
              setErrorProvider={setErrorProvider}
            />
          )
        })}
        <Text variant="body3" textAlign="center" color="$neutral2">
          <Trans i18nKey="fiatOnRamp.chooseProvider.description" />
        </Text>
      </Flex>
    </ProviderListPaddedColumn>
  )
}

export function ChooseProviderModal(props: ChooseProviderModal) {
  return (
    <AdaptiveWebModalSheet isOpen={props.isOpen} onClose={props.closeModal} width={420}>
      <ContentWrapper>
        <ChooseProviderModalContent {...props} />
      </ContentWrapper>
    </AdaptiveWebModalSheet>
  )
}
