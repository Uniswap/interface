import { InterfaceElementName } from '@uniswap/analytics-events'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonPrimary } from 'components/Button/buttons'
import Identicon from 'components/Identicon'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import Column, { ColumnCenter } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSendContext } from 'state/send/SendContext'
import { Separator, ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 16px;
  width: 100%;
  padding: 8px;
`

const ModalHeader = styled(GetHelpHeader)`
  padding: 8px 12px 4px;
`

const ReviewContentContainer = styled(Column)`
  width: 100%;
  padding: 12px 16px;
  gap: 16px;
`

const SendModalHeader = ({
  label,
  header,
  subheader,
  image,
}: {
  label: ReactNode
  header: ReactNode
  subheader: ReactNode
  image: ReactNode
}) => {
  return (
    <Row justify="space-between" align="center">
      <Column gap="xs">
        <ThemedText.BodySmall color="neutral2" lineHeight="20px">
          {label}
        </ThemedText.BodySmall>
        <ThemedText.HeadlineLarge lineHeight="44px">{header}</ThemedText.HeadlineLarge>
        <ThemedText.BodySmall lineHeight="20px" color="neutral2">
          {subheader}
        </ThemedText.BodySmall>
      </Column>
      <div style={{ height: '36px' }}>{image}</div>
    </Row>
  )
}

export type SendModalProps = {
  isOpen: boolean
  onConfirm: () => void
  onDismiss: () => void
}

export function SendReviewModal({ isOpen, onConfirm, onDismiss }: SendModalProps) {
  const { t } = useTranslation()
  const { chainId } = useMultichainContext()
  const {
    sendState: { inputCurrency, inputInFiat, exactAmountFiat },
    derivedSendInfo: { parsedTokenAmount, exactAmountOut, gasFeeCurrencyAmount, recipientData },
  } = useSendContext()

  const { formatConvertedFiatNumberOrString, formatCurrencyAmount } = useFormatter()
  const formattedInputAmount = formatCurrencyAmount({
    amount: parsedTokenAmount,
    type: NumberType.TokenNonTx,
  })
  const formattedFiatInputAmount = formatConvertedFiatNumberOrString({
    input: (inputInFiat ? exactAmountFiat : exactAmountOut) || '0',
    type: NumberType.PortfolioBalance,
  })

  const gasFeeUSD = useUSDCValue(gasFeeCurrencyAmount)
  const gasFeeFormatted = formatCurrencyAmount({
    amount: gasFeeUSD,
    type: NumberType.PortfolioBalance,
  })

  const currencySymbolAmount = `${formattedInputAmount} ${inputCurrency?.symbol ?? inputCurrency?.name}`

  const [primaryInputView, secondaryInputView] = inputInFiat
    ? [formattedFiatInputAmount, currencySymbolAmount]
    : [currencySymbolAmount, formattedFiatInputAmount]

  return (
    <Modal name={ModalName.SendReview} isModalOpen={isOpen} onClose={onDismiss} padding={0}>
      <ModalWrapper data-testid="send-review-modal" gap="md">
        <ModalHeader title={<Trans i18nKey="sendReviewModal.title" />} closeModal={onDismiss} />
        <ReviewContentContainer>
          <Column gap="lg">
            <SendModalHeader
              label={<Trans i18nKey="common.youreSending" />}
              header={primaryInputView}
              subheader={secondaryInputView}
              image={
                <PortfolioLogo currencies={[inputCurrency]} size={36} chainId={chainId ?? UniverseChainId.Mainnet} />
              }
            />
            <SendModalHeader
              label={capitalize(t('common.to'))}
              header={
                recipientData?.unitag || recipientData?.ensName ? (
                  <Row gap="xs">
                    <ThemedText.HeadlineLarge>{recipientData.unitag ?? recipientData.ensName}</ThemedText.HeadlineLarge>
                    {recipientData?.unitag && <Unitag size={18} />}
                  </Row>
                ) : (
                  shortenAddress(recipientData?.address)
                )
              }
              subheader={(recipientData?.unitag || recipientData?.ensName) && shortenAddress(recipientData.address)}
              image={<Identicon account={recipientData?.address} size={36} />}
            />
          </Column>
          <Separator />
          <Row width="100%" justify="space-between">
            <ThemedText.BodySmall color="neutral2" lineHeight="20px">
              <Trans i18nKey="common.networkCost" />
            </ThemedText.BodySmall>
            <Row width="min-content" gap="xs">
              <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={16} />
              <ThemedText.BodySmall>{gasFeeFormatted}</ThemedText.BodySmall>
            </Row>
          </Row>
        </ReviewContentContainer>
        <Trace logPress element={InterfaceElementName.SEND_REVIEW_BUTTON}>
          <ButtonPrimary onClick={onConfirm}>
            <Trans i18nKey="common.confirmSend.button" />
          </ButtonPrimary>
        </Trace>
      </ModalWrapper>
    </Modal>
  )
}
