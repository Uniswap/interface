import { Plural, Trans } from '@lingui/macro'
import { ChainId, CurrencyAmount } from '@uniswap/sdk-core'
import { ConfirmedIcon, LogoContainer, SubmittedIcon } from 'components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { useCancelLimitsGasEstimate } from 'components/AccountDrawer/MiniPortfolio/Limits/hooks/useCancelLimitsGasEstimate'
import GetHelp from 'components/Button/GetHelp'
import Column from 'components/Column'
import { Container, Dialog, DialogButtonType, DialogProps } from 'components/Dialog/Dialog'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { nativeOnChain } from 'constants/tokens'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { Slash } from 'react-feather'
import { UniswapXOrderDetails } from 'state/signatures/types'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ExternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const GasEstimateContainer = styled(Row)`
  border-top: 1px solid ${({ theme }) => theme.surface3};
  margin-top: 16px;
  padding-top: 16px;
`

export enum CancellationState {
  NOT_STARTED = 'not_started',
  REVIEWING_CANCELLATION = 'reviewing_cancellation',
  PENDING_SIGNATURE = 'pending_cancellation_signature',
  PENDING_CONFIRMATION = 'pending_cancellation_confirmation',
  CANCELLED = 'cancelled',
}

type CancelLimitsDialogProps = Partial<Omit<DialogProps, 'isVisible' | 'onCancel'>> &
  Pick<DialogProps, 'isVisible' | 'onCancel'>

function useCancelLimitsDialogContent(
  state: CancellationState,
  orders: UniswapXOrderDetails[]
): { title?: JSX.Element; icon: JSX.Element } {
  const theme = useTheme()
  switch (state) {
    case CancellationState.REVIEWING_CANCELLATION:
      return {
        title: (
          <Plural id="cancelling" value={orders.length} one="Cancel limit" other={`Cancel ${orders.length} limits`} />
        ),
        icon: <Slash />,
      }
    case CancellationState.PENDING_SIGNATURE:
      return {
        title: <Trans>Confirm cancellation</Trans>,
        icon: <LoaderV3 size="64px" color={theme.accent1} />,
      }
    case CancellationState.PENDING_CONFIRMATION:
      return {
        title: <Trans>Cancellation submitted</Trans>,
        icon: <SubmittedIcon />,
      }
    case CancellationState.CANCELLED:
      return {
        title: <Trans>Cancellation Successful</Trans>,
        icon: <ConfirmedIcon />,
      }
    default:
      return {
        title: undefined,
        icon: <Slash />,
      }
  }
}

export function CancelLimitsDialog(
  props: CancelLimitsDialogProps & {
    orders: UniswapXOrderDetails[]
    cancelState: CancellationState
    cancelTxHash?: string
    onConfirm: () => void
  }
) {
  const { orders, cancelState, cancelTxHash, onConfirm, onCancel } = props

  const { title, icon } = useCancelLimitsDialogContent(cancelState, orders)

  const gasEstimate = useCancelLimitsGasEstimate(orders)

  if (
    [CancellationState.PENDING_SIGNATURE, CancellationState.PENDING_CONFIRMATION, CancellationState.CANCELLED].includes(
      cancelState
    )
  ) {
    const cancelSubmitted =
      (cancelState === CancellationState.CANCELLED || cancelState === CancellationState.PENDING_CONFIRMATION) &&
      cancelTxHash
    return (
      <Modal isOpen $scrollOverlay onDismiss={onCancel} maxHeight={90}>
        <Container gap="lg">
          <Row gap="10px" width="100%" padding="4px 0px" justify="end" align="center">
            <GetHelp />
            <CloseIcon onClick={onCancel} />
          </Row>
          <LogoContainer>{icon}</LogoContainer>
          <ThemedText.SubHeaderLarge width="100%" textAlign="center">
            {title}
          </ThemedText.SubHeaderLarge>
          <Row justify="center" marginTop="32px" minHeight="24px">
            {cancelSubmitted ? (
              <ExternalLink
                href={getExplorerLink(orders[0].chainId, cancelTxHash, ExplorerDataType.TRANSACTION)}
                color="neutral2"
              >
                <Trans>View on Explorer</Trans>
              </ExternalLink>
            ) : (
              <ThemedText.BodySmall color="neutral2">
                <Trans>Proceed in your wallet</Trans>
              </ThemedText.BodySmall>
            )}
          </Row>
        </Container>
      </Modal>
    )
  } else if (cancelState === CancellationState.REVIEWING_CANCELLATION) {
    return (
      <Dialog
        {...props}
        icon={icon}
        title={title}
        description={
          <Column>
            <Plural
              id="cancelling-confirmation"
              value={orders.length}
              one="Your swap could execute before cancellation is processed. Your network costs cannot be refunded. Do you wish to proceed?"
              other="Your swaps could execute before cancellation is processed. Your network costs cannot be refunded. Do you wish to proceed?"
            />
            <GasEstimateDisplay chainId={orders[0].chainId} gasEstimateValue={gasEstimate.value} />
          </Column>
        }
        buttonsConfig={{
          left: {
            title: <Trans>Nevermind</Trans>,
            onClick: onCancel,
            textColor: 'neutral1',
          },
          right: {
            title: <Trans>Proceed</Trans>,
            onClick: onConfirm,
            type: DialogButtonType.Error,
            disabled: cancelState !== CancellationState.REVIEWING_CANCELLATION,
            textColor: 'white',
          },
        }}
      />
    )
  } else {
    // CancellationState.NOT_STARTED
    return null
  }
}

function GasEstimateDisplay({ gasEstimateValue, chainId }: { gasEstimateValue?: string; chainId: ChainId }) {
  const gasFeeCurrencyAmount = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), gasEstimateValue ?? '0')
  const gasFeeUSD = useStablecoinValue(gasFeeCurrencyAmount)
  const { formatCurrencyAmount } = useFormatter()
  const gasFeeFormatted = formatCurrencyAmount({
    amount: gasFeeUSD,
    type: NumberType.PortfolioBalance,
  })
  return (
    <GasEstimateContainer>
      <DetailLineItem
        LineItem={{
          Label: () => <Trans>Network cost</Trans>,
          Value: () => <span>{gasEstimateValue ? gasFeeFormatted : '-'}</span>,
        }}
      />
    </GasEstimateContainer>
  )
}
