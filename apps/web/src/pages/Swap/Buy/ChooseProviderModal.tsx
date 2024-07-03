import { skipToken } from '@reduxjs/toolkit/query/react'
import GetHelpButton from 'components/Button/GetHelp'
import Column, { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { useAccount } from 'hooks/useAccount'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useEffect, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import styled from 'styled-components'
import { CloseIcon } from 'theme/components'
import { Flex, useIsDarkMode } from 'ui/src'
import { FOR_CONNECTING_BACKGROUND_DARK, FOR_CONNECTING_BACKGROUND_LIGHT } from 'ui/src/assets'
import { Text } from 'ui/src/components/text/Text'
import { UNISWAP_WEB_URL, uniswapUrls } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FiatOnRampConnectingView } from 'uniswap/src/features/fiatOnRamp/FiatOnRampConnectingView'
import { useFiatOnRampAggregatorWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORQuote, FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getOptionalServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { v4 as uuid } from 'uuid'

const ConnectingContainer = styled(Column)`
  margin: 64px 0 0 0;
  align-items: center;
`

const ProviderListPaddedColumn = styled(AutoColumn)`
  position: relative;
  padding: 16px 24px 24px 24px;
`

const ConnectedPaddedColumn = styled(AutoColumn)`
  position: relative;
  padding: 16px 24px 80px 24px;
`

const ConnectingBackgroundImage = styled.img`
  pointer-events: none;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  box-shadow: 0 0 12px 12px transparent inset;
`

interface ChooseProviderModal {
  isOpen: boolean
  closeModal: () => void
}

function ChooseProviderModalContent({ closeModal }: ChooseProviderModal) {
  const { derivedBuyFormInfo, buyFormState } = useBuyFormContext()
  const { quoteCurrency, selectedCountry, inputAmount } = buyFormState
  const { quotes, meldSupportedFiatCurrency } = derivedBuyFormInfo

  const account = useAccount()
  const isDarkMode = useIsDarkMode()

  const [selectedServiceProvider, setSelectedServiceProvider] = useState<FORServiceProvider>()
  const [delayElapsed, setDelayElapsed] = useState(false)

  const widgetQueryParams = useMemo(() => {
    return selectedServiceProvider &&
      quoteCurrency.meldCurrencyCode &&
      meldSupportedFiatCurrency &&
      inputAmount &&
      account.address &&
      selectedCountry?.countryCode
      ? {
          serviceProvider: selectedServiceProvider.serviceProvider,
          countryCode: selectedCountry.countryCode,
          destinationCurrencyCode: quoteCurrency.meldCurrencyCode,
          sourceAmount: parseFloat(inputAmount),
          sourceCurrencyCode: meldSupportedFiatCurrency.code,
          walletAddress: account.address,
          externalSessionId: uuid(),
          redirectUrl: `${UNISWAP_WEB_URL}/buy`,
        }
      : skipToken
  }, [
    account.address,
    inputAmount,
    meldSupportedFiatCurrency,
    quoteCurrency.meldCurrencyCode,
    selectedCountry?.countryCode,
    selectedServiceProvider,
  ])

  const { data: widgetData } = useFiatOnRampAggregatorWidgetQuery(widgetQueryParams)
  useTimeout(() => {
    if (selectedServiceProvider && !delayElapsed) {
      setDelayElapsed(true)
    }
  }, 2 * ONE_SECOND_MS)

  useEffect(() => {
    if (selectedServiceProvider && delayElapsed && widgetData?.widgetUrl) {
      window.open(widgetData.widgetUrl, '_blank')
    }
  }, [delayElapsed, selectedServiceProvider, widgetData?.widgetUrl])

  // TODO(WEB-4332): handle errors from widget query
  // TODO: add externalSessionId to local state for status fetching immediately when opening widget.

  if (selectedServiceProvider && delayElapsed) {
    return (
      <ConnectedPaddedColumn gap="16px">
        <ConnectingBackgroundImage
          src={isDarkMode ? FOR_CONNECTING_BACKGROUND_DARK : FOR_CONNECTING_BACKGROUND_LIGHT}
        />
        <Row justify="right">
          <CloseIcon data-testid="ChooseProviderModal-close" onClick={closeModal} />
        </Row>
        <ConnectingContainer gap="44px">
          <img
            style={ServiceProviderLogoStyles.uniswapLogoWrapper}
            height={120}
            src={getOptionalServiceProviderLogo(selectedServiceProvider?.logos, isDarkMode)}
            width={120}
          />
          <Flex flexDirection="column" alignItems="center">
            <Text variant="subheading1">
              <Trans
                i18nKey="fiatOnRamp.completeTransactionHeader"
                values={{ serviceProvider: selectedServiceProvider.name }}
              />
            </Text>
            <Text variant="body2" textAlign="center" color="$neutral2">
              <Trans i18nKey="fiatOnRamp.continueInTab" values={{ serviceProvider: selectedServiceProvider.name }} />
            </Text>
          </Flex>
        </ConnectingContainer>
      </ConnectedPaddedColumn>
    )
  }

  if (selectedServiceProvider) {
    return (
      <ProviderListPaddedColumn gap="16px">
        <ConnectingBackgroundImage
          src={isDarkMode ? FOR_CONNECTING_BACKGROUND_DARK : FOR_CONNECTING_BACKGROUND_LIGHT}
        />
        <Row justify="right">
          <CloseIcon data-testid="ChooseProviderModal-close" onClick={closeModal} />
        </Row>
        <ConnectingContainer gap="44px">
          <FiatOnRampConnectingView
            serviceProviderName={selectedServiceProvider.name}
            amount={meldSupportedFiatCurrency?.symbol + parseFloat(inputAmount).toFixed(2)}
            quoteCurrencyCode={quoteCurrency.currencyInfo?.currency.symbol}
            serviceProviderLogo={
              <img
                style={ServiceProviderLogoStyles.uniswapLogoWrapper}
                height={ServiceProviderLogoStyles.icon.height}
                src={getOptionalServiceProviderLogo(selectedServiceProvider?.logos, isDarkMode)}
                width={ServiceProviderLogoStyles.icon.height}
              />
            }
          />
          <Text variant="body3" textAlign="center" color="$neutral2">
            <Trans i18nKey="fiatOnRamp.disclaimer" values={{ serviceProvider: selectedServiceProvider.name }} />
          </Text>
        </ConnectingContainer>
      </ProviderListPaddedColumn>
    )
  }

  return (
    <ProviderListPaddedColumn gap="16px">
      <RowBetween>
        <Row>
          <Text variant="body3">
            <Trans i18nKey="fiatOnRamp.checkoutWith" />
          </Text>
        </Row>
        <Row justify="right" gap="xs">
          <GetHelpButton url={uniswapUrls.helpArticleUrls.fiatOnRampHelp} />
          <CloseIcon data-testid="ChooseProviderModal-close" onClick={closeModal} />
        </Row>
      </RowBetween>
      {quotes?.quotes?.map((q: FORQuote) => {
        return (
          <FORQuoteItem
            key={q.serviceProvider}
            serviceProvider={q.serviceProviderDetails}
            onPress={() => {
              setSelectedServiceProvider(q.serviceProviderDetails)
            }}
          />
        )
      })}
      <Text variant="body3" textAlign="center" color="$neutral2">
        <Trans i18nKey="fiatOnRamp.chooseProvider.description" />
      </Text>
    </ProviderListPaddedColumn>
  )
}

export function ChooseProviderModal(props: ChooseProviderModal) {
  return (
    <Modal isOpen={props.isOpen} onDismiss={props.closeModal}>
      <ContentWrapper>
        <ChooseProviderModalContent {...props} />
      </ContentWrapper>
    </Modal>
  )
}
