import GetHelpButton from 'components/Button/GetHelp'
import Modal from 'components/Modal'
import Row, { RowBetween } from 'components/Row'
import { PaddedColumn } from 'components/SearchModal/styled'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { ContentWrapper } from 'pages/Swap/Buy/shared'
import { Trans } from 'react-i18next'
import { CloseIcon } from 'theme/components'
import { Text } from 'ui/src/components/text/Text'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FORQuote } from 'uniswap/src/features/fiatOnRamp/types'

interface ChooseProviderModal {
  isOpen: boolean
  closeModal: () => void
}

export function ChooseProviderModal({ isOpen, closeModal }: ChooseProviderModal) {
  const { derivedBuyFormInfo } = useBuyFormContext()
  const { quotes } = derivedBuyFormInfo
  return (
    <Modal isOpen={isOpen} onDismiss={closeModal}>
      <ContentWrapper>
        <PaddedColumn gap="16px">
          <RowBetween>
            <Row>
              <Text variant="body3">
                <Trans i18nKey="fiatOnRamp.checkoutWith" />
              </Text>
            </Row>
            <Row justify="right" gap="xs">
              <GetHelpButton url={uniswapUrls.helpArticleUrls.fiatOnRampHelp} />
              <CloseIcon data-testid="CountryListModal-close" onClick={closeModal} />
            </Row>
          </RowBetween>
          {quotes?.quotes?.map((q: FORQuote) => {
            return (
              <FORQuoteItem
                key={q.serviceProvider}
                serviceProvider={q.serviceProviderDetails}
                onPress={() => {
                  // todo: select quote, update content here to the "connecting state", then open iframe once URL is available
                }}
              />
            )
          })}
          <Text variant="body3" textAlign="center" color="$neutral2">
            <Trans i18nKey="fiatOnRamp.chooseProvider.description" />
          </Text>
        </PaddedColumn>
      </ContentWrapper>
    </Modal>
  )
}
