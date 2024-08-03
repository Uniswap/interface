import { CurrencyAmount } from '@uniswap/sdk-core'
import { ConfirmedIcon, LogoContainer, SubmittedIcon } from 'components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { useCancelOrdersGasEstimate } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import Column from 'components/Column'
import { Container, Dialog, DialogButtonType, DialogProps } from 'components/Dialog/Dialog'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import Modal from 'components/Modal'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import Row from 'components/Row'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { nativeOnChain } from 'constants/tokens'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { Plural, Trans, t } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ExternalLink, ThemedText } from 'theme/components'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

const GasEstimateContainer = styled(Row)`
  border-top: 1px solid ${({ theme }) => theme.surface3};
  margin-top: 16px;
  padding-top: 16px;
`
const ModalHeader = styled(GetHelpHeader)`
  padding: 4px 0px;
`

export enum CancellationState {
  NOT_STARTED = 'not_started',
  REVIEWING_CANCELLATION = 'reviewing_cancellation',
  PENDING_SIGNATURE = 'pending_cancellation_signature',
  PENDING_CONFIRMATION = 'pending_cancellation_confirmation',
  CANCELLED = 'cancelled',
}

type CancelOrdersDialogProps = Partial<Omit<DialogProps, 'isVisible' | 'onCancel'>> &
  Pick<DialogProps, 'isVisible' | 'onCancel'>

function useCancelOrdersDialogContent(
  state: CancellationState,
  orders: UniswapXOrderDetails[],
): { title?: JSX.Element; icon: JSX.Element } {
  const theme = useTheme()
  switch (state) {
    case CancellationState.REVIEWING_CANCELLATION:
      return {
        title: (
          <Plural
            value={orders.length}
            one={
              orders.length && orders[0].type === SignatureType.SIGN_LIMIT
                ? t('common.limit.cancel')
                : t('common.cancelOrder')
            }
            other={t(`common.limit.cancel.amount`, { count: orders.length })}
          />
        ),
        icon: <Slash />,
      }
    case CancellationState.PENDING_SIGNATURE:
      return {
        title: <Trans i18nKey="common.confirmCancellation" />,
        icon: <LoaderV3 size="64px" color={theme.accent1} />,
      }
    case CancellationState.PENDING_CONFIRMATION:
      return {
        title: <Trans i18nKey="common.cancellationSubmitted" />,
        icon: <SubmittedIcon />,
      }
    case CancellationState.CANCELLED:
      return {
        title: <Trans i18nKey="common.cancellationSuccessful" />,
        icon: <ConfirmedIcon />,
      }
    default:
      return {
        title: undefined,
        icon: <Slash />,
      }
  }
}

export function CancelOrdersDialog(
  props: CancelOrdersDialogProps & {
    orders: UniswapXOrderDetails[]
    cancelState: CancellationState
    cancelTxHash?: string
    onConfirm: () => void
  },
) {
  const { orders, cancelState, cancelTxHash, onConfirm, onCancel } = props

  const { title, icon } = useCancelOrdersDialogContent(cancelState, orders)

  const gasEstimate = useCancelOrdersGasEstimate(orders)
  if (
    [CancellationState.PENDING_SIGNATURE, CancellationState.PENDING_CONFIRMATION, CancellationState.CANCELLED].includes(
      cancelState,
    )
  ) {
    const cancelSubmitted =
      (cancelState === CancellationState.CANCELLED || cancelState === CancellationState.PENDING_CONFIRMATION) &&
      cancelTxHash
    return (
      <Modal isOpen $scrollOverlay onDismiss={onCancel} maxHeight="90vh">
        <Container gap="lg">
          <ModalHeader closeModal={onCancel} />
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
                <Trans i18nKey="common.viewOnExplorer" />
              </ExternalLink>
            ) : (
              <ThemedText.BodySmall color="neutral2">
                <Trans i18nKey="common.proceedInWallet" />
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
              value={orders.length}
              one={t('swap.cancel.cannotExecute')}
              other={t('swap.cancel.cannotExecute.plural')}
            />
            <GasEstimateDisplay chainId={orders[0].chainId} gasEstimateValue={gasEstimate?.value} />
          </Column>
        }
        buttonsConfig={{
          left: {
            title: <Trans i18nKey="common.neverMind" />,
            onClick: onCancel,
            textColor: 'neutral1',
          },
          right: {
            title: <Trans i18nKey="common.proceed" />,
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

function GasEstimateDisplay({ gasEstimateValue, chainId }: { gasEstimateValue?: string; chainId: InterfaceChainId }) {
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
          Label: () => <Trans i18nKey="common.networkCost" />,
          Value: () => <span>{gasEstimateValue ? gasFeeFormatted : '-'}</span>,
        }}
      />
    </GasEstimateContainer>
  )
}
