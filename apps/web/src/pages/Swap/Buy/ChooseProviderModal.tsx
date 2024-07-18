import { skipToken } from '@reduxjs/toolkit/query/react'
import GetHelpButton from 'components/Button/GetHelp'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { useAccount } from 'hooks/useAccount'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ProviderConnectedView } from 'pages/Swap/Buy/ProviderConnectedView'
import { ProviderConnectingView } from 'pages/Swap/Buy/ProviderConnectingView'
import { ProviderConnectionError } from 'pages/Swap/Buy/ProviderConnectionError'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { useEffect, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import styled from 'styled-components'
import { CloseIcon } from 'theme/components'
import { Text } from 'ui/src'
import { UNISWAP_WEB_URL, uniswapUrls } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { useFiatOnRampAggregatorWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORQuote, FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { v4 as uuid } from 'uuid'

const ProviderListPaddedColumn = styled(AutoColumn)`
  position: relative;
  padding: 16px 24px 24px 24px;
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
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()

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

  const { data: widgetData, error: widgetError } = useFiatOnRampAggregatorWidgetQuery(widgetQueryParams)
  useTimeout(() => {
    if (selectedServiceProvider && !delayElapsed) {
      setDelayElapsed(true)
    }
  }, 2 * ONE_SECOND_MS)

  useEffect(() => {
    if (
      widgetQueryParams !== skipToken &&
      account.address &&
      selectedServiceProvider &&
      delayElapsed &&
      widgetData?.widgetUrl
    ) {
      window.open(widgetData.widgetUrl, '_blank')
      addFiatOnRampTransaction({
        externalSessionId: widgetQueryParams.externalSessionId,
        account: account.address,
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: false,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.BUY,
      })
    }
  }, [
    account.address,
    addFiatOnRampTransaction,
    delayElapsed,
    selectedServiceProvider,
    widgetData?.widgetUrl,
    widgetQueryParams,
  ])

  if (selectedServiceProvider && widgetError) {
    return (
      <ProviderConnectionError
        onBack={() => setSelectedServiceProvider(undefined)}
        closeModal={closeModal}
        selectedServiceProvider={selectedServiceProvider}
      />
    )
  }

  if (selectedServiceProvider && delayElapsed) {
    return <ProviderConnectedView closeModal={closeModal} selectedServiceProvider={selectedServiceProvider} />
  }

  if (selectedServiceProvider) {
    return <ProviderConnectingView closeModal={closeModal} selectedServiceProvider={selectedServiceProvider} />
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
