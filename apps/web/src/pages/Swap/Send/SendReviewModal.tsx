import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { ButtonPrimary } from 'components/Button'
import GetHelp from 'components/Button/GetHelp'
import Column, { ColumnCenter } from 'components/Column'
import Identicon from 'components/Identicon'
import { ChainLogo } from 'components/Logo/ChainLogo'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { UniTagProfilePicture } from 'components/UniTag/UniTagProfilePicture'
import { Unicon } from 'components/Unicon'
import { useUniconV2Flag } from 'featureFlags/flags/uniconV2'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { ReactNode } from 'react'
import { useSendContext } from 'state/send/SendContext'
import styled from 'styled-components'
import { ClickableStyle, CloseIcon, Separator, ThemedText } from 'theme/components'
import { Icons, UniconV2 } from 'ui/src'
import { useUnitagByNameWithoutFlag } from 'uniswap/src/features/unitags/hooksWithoutFlags'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.surface3};
  width: 100%;
  padding: 8px;
`

const StyledReviewCloseIcon = styled(CloseIcon)`
  ${ClickableStyle}
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

export function SendReviewModal({ onConfirm, onDismiss }: { onConfirm: () => void; onDismiss: () => void }) {
  const { chainId } = useWeb3React()
  const {
    sendState: { inputCurrency, inputInFiat, exactAmountFiat },
    derivedSendInfo: { parsedTokenAmount, exactAmountOut, gasFeeCurrencyAmount, recipientData },
  } = useSendContext()
  const { unitag: recipientUnitag } = useUnitagByNameWithoutFlag(recipientData?.unitag, Boolean(recipientData?.unitag))

  const { formatConvertedFiatNumberOrString, formatCurrencyAmount } = useFormatter()
  const formattedInputAmount = formatCurrencyAmount({
    amount: parsedTokenAmount,
    type: NumberType.TokenNonTx,
  })
  const formattedFiatInputAmount = formatConvertedFiatNumberOrString({
    input: (inputInFiat ? exactAmountFiat : exactAmountOut) || '0',
    type: NumberType.PortfolioBalance,
  })

  const gasFeeUSD = useStablecoinValue(gasFeeCurrencyAmount)
  const gasFeeFormatted = formatCurrencyAmount({
    amount: gasFeeUSD,
    type: NumberType.PortfolioBalance,
  })

  const currencySymbolAmount = `${formattedInputAmount} ${inputCurrency?.symbol ?? inputCurrency?.name}`

  const [primaryInputView, secondaryInputView] = inputInFiat
    ? [formattedFiatInputAmount, currencySymbolAmount]
    : [currencySymbolAmount, formattedFiatInputAmount]

  const uniconsV2Enabled = useUniconV2Flag()

  return (
    <Modal $scrollOverlay isOpen onDismiss={onDismiss} maxHeight={90}>
      <ModalWrapper data-testid="send-review-modal" gap="md">
        <Row width="100%" padding="8px 12px 4px" align="center">
          <Row justify="left">
            <ThemedText.SubHeader>
              <Trans>Review send</Trans>
            </ThemedText.SubHeader>
          </Row>
          <Row justify="right" gap="10px">
            <GetHelp />
            <StyledReviewCloseIcon onClick={onDismiss} />
          </Row>
        </Row>
        <ReviewContentContainer>
          <Column gap="lg">
            <SendModalHeader
              label={<Trans>You&apos;re sending</Trans>}
              header={primaryInputView}
              subheader={secondaryInputView}
              image={<PortfolioLogo currencies={[inputCurrency]} size="36px" chainId={chainId ?? ChainId.MAINNET} />}
            />
            <SendModalHeader
              label={<Trans>To</Trans>}
              header={
                recipientData?.unitag || recipientData?.ensName ? (
                  <Row gap="xs">
                    <ThemedText.HeadlineLarge>{recipientData.unitag ?? recipientData.ensName}</ThemedText.HeadlineLarge>
                    {recipientData?.unitag && <Icons.Unitag size={18} />}
                  </Row>
                ) : (
                  shortenAddress(recipientData?.address)
                )
              }
              subheader={(recipientData?.unitag || recipientData?.ensName) && shortenAddress(recipientData.address)}
              image={
                recipientUnitag?.metadata?.avatar ? (
                  <UniTagProfilePicture account={recipientData?.address ?? ''} size={36} />
                ) : recipientData?.ensName ? (
                  <Identicon account={recipientData.address} size={36} />
                ) : uniconsV2Enabled ? (
                  <UniconV2 address={recipientData?.address ?? ''} size={36} />
                ) : (
                  <Unicon address={recipientData?.address ?? ''} size={36} />
                )
              }
            />
          </Column>
          <Separator />
          <Row width="100%" justify="space-between">
            <ThemedText.BodySmall color="neutral2" lineHeight="20px">
              <Trans>Network cost</Trans>
            </ThemedText.BodySmall>
            <Row width="min-content" gap="xs">
              <ChainLogo chainId={chainId ?? ChainId.MAINNET} size={16} />
              <ThemedText.BodySmall>{gasFeeFormatted}</ThemedText.BodySmall>
            </Row>
          </Row>
        </ReviewContentContainer>
        <ButtonPrimary onClick={onConfirm}>
          <Trans>Confirm send</Trans>
        </ButtonPrimary>
      </ModalWrapper>
    </Modal>
  )
}
