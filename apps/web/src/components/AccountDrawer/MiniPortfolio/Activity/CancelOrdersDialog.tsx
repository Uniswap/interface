import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useCancelOrdersGasEstimate } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { ConfirmedIcon, LogoContainer, SubmittedIcon } from 'components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { ColumnCenter } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { LoaderV3 } from 'components/Icons/LoadingSpinner'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import styled, { useTheme } from 'lib/styled-components'
import { Slash } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Flex, Text } from 'ui/src'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'

const ModalHeader = styled(GetHelpHeader)`
  padding: 4px 0px;
`

const Container = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 16px;
  padding: 16px 24px 24px 24px;
  width: 100%;
`

export enum CancellationState {
  NOT_STARTED = 'not_started',
  REVIEWING_CANCELLATION = 'reviewing_cancellation',
  PENDING_SIGNATURE = 'pending_cancellation_signature',
  PENDING_CONFIRMATION = 'pending_cancellation_confirmation',
  CANCELLED = 'cancelled',
}

interface CancelOrdersDialogProps {
  orders: UniswapXOrderDetails[]
  cancelState: CancellationState
  cancelTxHash?: string
  onConfirm: () => void
  onCancel: () => void
  isVisible: boolean
}

function useCancelOrdersDialogContent(
  state: CancellationState,
  orders: UniswapXOrderDetails[],
): { title?: JSX.Element; icon: JSX.Element } {
  const theme = useTheme()
  switch (state) {
    case CancellationState.REVIEWING_CANCELLATION:
      return {
        title:
          orders.length === 1 && orders[0].routing === TradingApi.Routing.DUTCH_LIMIT ? (
            <Trans i18nKey="common.limit.cancel_one" />
          ) : (
            <Trans i18nKey="common.cancelOrder" />
          ),
        icon: <Slash color={theme.neutral1} />,
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

export function CancelOrdersDialog(props: CancelOrdersDialogProps) {
  const { t } = useTranslation()
  const { orders, cancelState, cancelTxHash, onConfirm, onCancel } = props

  const { title, icon } = useCancelOrdersDialogContent(cancelState, orders)

  const cancellationGasFeeInfo = useCancelOrdersGasEstimate(orders)
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
                href={
                  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                  firstOrder
                    ? getExplorerLink({
                        chainId: firstOrder.chainId,
                        data: cancelTxHash,
                        type: ExplorerDataType.TRANSACTION,
                      })
                    : ''
                }
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
        isOpen={props.isVisible}
        onClose={onCancel}
        icon={icon}
        title={title}
        subtext={
          <Text variant="body3" color="$neutral2">
            {t('swap.cancel.cannotExecute', { count: orders.length })}
          </Text>
        }
        modalName={ModalName.CancelOrders}
        primaryButtonText={t('common.neverMind')}
        primaryButtonOnPress={onCancel}
        primaryButtonVariant="default"
        primaryButtonEmphasis="secondary"
        secondaryButtonText={t('common.proceed')}
        secondaryButtonOnPress={onConfirm}
        secondaryButtonVariant="critical"
        displayHelpCTA
        iconBackgroundColor="$surface3"
      >
        {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
        <GasEstimateDisplay chainId={orders[0].chainId} gasEstimateValue={cancellationGasFeeInfo?.gasFeeDisplayValue} />
      </Dialog>
    )
  } else {
    // CancellationState.NOT_STARTED
    return null
  }
}

function GasEstimateDisplay({ gasEstimateValue, chainId }: { gasEstimateValue?: string; chainId: UniverseChainId }) {
  const gasFeeCurrencyAmount = CurrencyAmount.fromRawAmount(nativeOnChain(chainId), gasEstimateValue ?? '0')
  const gasFeeUSD = useUSDCValue(gasFeeCurrencyAmount)
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD?.toExact(), NumberType.PortfolioBalance)

  return (
    <Flex row width="100%">
      <DetailLineItem
        LineItem={{
          Label: () => <Trans i18nKey="common.networkCost" />,
          Value: () => <span>{gasEstimateValue ? gasFeeFormatted : '-'}</span>,
        }}
      />
    </Flex>
  )
}
