import { CurrencyAmount } from '@uniswap/sdk-core'
import { ConfirmedIcon, LogoContainer, SubmittedIcon } from 'components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { useCancelOrdersGasEstimate } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { Container, Dialog, DialogButtonType, DialogProps } from 'components/Dialog/Dialog'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import Row from 'components/deprecated/Row'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import styled, { useTheme } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { SignatureType, UniswapXOrderDetails } from 'state/signatures/types'
import { ExternalLink, ThemedText } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
        title:
          orders.length === 1 && orders[0].type === SignatureType.SIGN_LIMIT ? (
            <Trans i18nKey="common.limit.cancel" count={orders.length} />
          ) : (
            <Trans i18nKey="common.cancelOrder" />
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
  const { t } = useTranslation()
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
    const firstOrder = orders[0]
    return (
      <Modal name={ModalName.CancelOrders} isModalOpen onClose={onCancel} padding={0}>
        <Container gap="lg">
          <ModalHeader closeModal={onCancel} />
          <LogoContainer>{icon}</LogoContainer>
          <ThemedText.SubHeaderLarge width="100%" textAlign="center">
            {title}
          </ThemedText.SubHeaderLarge>
          <Row justify="center" marginTop="32px" minHeight="24px">
            {cancelSubmitted ? (
              <ExternalLink
                href={firstOrder ? getExplorerLink(firstOrder.chainId, cancelTxHash, ExplorerDataType.TRANSACTION) : ''}
                disabled={!firstOrder}
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
          <Flex width="100%">
            <Text>{t('swap.cancel.cannotExecute', { count: orders.length })}</Text>
            <GasEstimateDisplay chainId={orders[0].chainId} gasEstimateValue={gasEstimate?.value} />
          </Flex>
        }
        buttonsConfig={{
          left: {
            title: <Trans i18nKey="common.neverMind" />,
            onClick: onCancel,
          },
          right: {
            title: <Trans i18nKey="common.proceed" />,
            onClick: onConfirm,
            type: DialogButtonType.Error,
            disabled: cancelState !== CancellationState.REVIEWING_CANCELLATION,
          },
        }}
      />
    )
  } else {
    // CancellationState.NOT_STARTED
    return null
  }
}

function GasEstimateDisplay({ gasEstimateValue, chainId }: { gasEstimateValue?: string; chainId: UniverseChainId }) {
  const gasFeeCurrencyAmount = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), gasEstimateValue ?? '0')
  const gasFeeUSD = useUSDCValue(gasFeeCurrencyAmount)
  const { formatCurrencyAmount } = useFormatter()
  const gasFeeFormatted = formatCurrencyAmount({
    amount: gasFeeUSD,
    type: NumberType.PortfolioBalance,
  })

  return (
    <Flex
      row
      mt="$spacing16"
      pt="$spacing16"
      borderColor="$transparent"
      borderTopColor="$surface3"
      borderWidth="$spacing1"
      width="100%"
    >
      <DetailLineItem
        LineItem={{
          Label: () => <Trans i18nKey="common.networkCost" />,
          Value: () => <span>{gasEstimateValue ? gasFeeFormatted : '-'}</span>,
        }}
      />
    </Flex>
  )
}
