import { InterfaceElementName } from '@uniswap/analytics-events'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import Identicon from 'components/Identicon'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSendContext } from 'state/send/SendContext'
import { Separator, ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { Button, Flex, styled } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const ModalWrapper = styled(Flex, {
  backgroundColor: '$surface1',
  borderRadius: '$rounded16',
  width: '100%',
  p: '$spacing8',
  gap: '$gap12',
})

const ModalHeader = styled(Flex, {
  px: '$spacing12',
  pt: '$spacing8',
  pb: '$spacing4',
})

const ReviewContentContainer = styled(Flex, {
  width: '100%',
  py: '$spacing12',
  px: '$spacing16',
  gap: '$gap16',
})

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
    <Flex row justifyContent="space-between" alignItems="center">
      <Flex gap="$gap4">
        <ThemedText.BodySmall color="neutral2" lineHeight="20px">
          {label}
        </ThemedText.BodySmall>
        <ThemedText.HeadlineLarge lineHeight="44px">{header}</ThemedText.HeadlineLarge>
        <ThemedText.BodySmall lineHeight="20px" color="neutral2">
          {subheader}
        </ThemedText.BodySmall>
      </Flex>
      <Flex height={36}>{image}</Flex>
    </Flex>
  )
}

type SendModalInnerProps = {
  onConfirm: () => void
  onDismiss: () => void
}

export type SendModalProps = SendModalInnerProps & {
  isOpen: boolean
}

export function SendReviewModal({ isOpen, onConfirm, onDismiss }: SendModalProps) {
  return (
    <Modal name={ModalName.SendReview} isModalOpen={isOpen} onClose={onDismiss} padding={0}>
      <SendReviewModalInner onConfirm={onConfirm} onDismiss={onDismiss} />
    </Modal>
  )
}

function SendReviewModalInner({ onConfirm, onDismiss }: SendModalInnerProps) {
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
    <ModalWrapper data-testid="send-review-modal">
      <ModalHeader>
        <GetHelpHeader title={<Trans i18nKey="sendReviewModal.title" />} closeModal={onDismiss} />
      </ModalHeader>
      <ReviewContentContainer>
        <Flex gap="$gap24">
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
                <Flex row gap="$gap4" alignItems="center">
                  <ThemedText.HeadlineLarge>{recipientData.unitag ?? recipientData.ensName}</ThemedText.HeadlineLarge>
                  {recipientData?.unitag && <Unitag size={18} />}
                </Flex>
              ) : (
                shortenAddress(recipientData?.address)
              )
            }
            subheader={(recipientData?.unitag || recipientData?.ensName) && shortenAddress(recipientData.address)}
            image={<Identicon account={recipientData?.address} size={36} />}
          />
        </Flex>
        <Separator />
        <Flex row alignItems="center" width="100%" justifyContent="space-between">
          <ThemedText.BodySmall color="neutral2" lineHeight="20px">
            <Trans i18nKey="common.networkCost" />
          </ThemedText.BodySmall>
          <Flex row width="min-content" gap="$gap4" alignItems="center">
            <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={16} />
            <ThemedText.BodySmall>{gasFeeFormatted}</ThemedText.BodySmall>
          </Flex>
        </Flex>
      </ReviewContentContainer>
      <Trace logPress element={InterfaceElementName.SEND_REVIEW_BUTTON}>
        <Flex alignSelf="stretch" row>
          <Button emphasis="primary" variant="branded" size="large" onPress={onConfirm}>
            <Trans i18nKey="common.confirmSend.button" />
          </Button>
        </Flex>
      </Trace>
    </ModalWrapper>
  )
}
