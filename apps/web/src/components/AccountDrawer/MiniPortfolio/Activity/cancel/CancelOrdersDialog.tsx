import { CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { Flex as MyceliumFlex, Flex, Text, useSporeColors } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Blocked } from 'ui/src/components/icons/Blocked'
import { Dialog } from 'uniswap/src/components/dialog/Dialog'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { useCancelOrdersGasEstimate } from '~/components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { ConfirmedIcon, LogoContainer, SubmittedIcon } from '~/components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { DetailLineItem } from '~/components/DetailLineItem'
import { LogoLoadingSpinner } from '~/components/LogoLoadingSpinner'
import { ExternalLink } from '~/theme/components/Links'

// pt beats the p shorthand's top, matching the legacy resolution (probed: padding 24 / top 16).
const Container = styled(MyceliumFlex, {
  base: 'items-center justify-center p-[24px] pt-[16px] w-[100%] bg-surface1 rounded-[16px]',
})

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
): { title?: string; icon: JSX.Element } {
  const { t } = useTranslation()
  const colors = useSporeColors()
  switch (state) {
    case CancellationState.REVIEWING_CANCELLATION:
      return {
        title:
          orders.length === 1 && orders[0].routing === TradingApi.Routing.DUTCH_LIMIT
            ? t('common.limit.cancel_one')
            : t('common.cancelOrder'),
        icon: <Blocked color="$neutral1" size="$icon.24" />,
      }
    case CancellationState.PENDING_SIGNATURE:
      return {
        title: t('common.confirmCancellation'),
        icon: <LogoLoadingSpinner size="64px" color={colors.accent1.val} />,
      }
    case CancellationState.PENDING_CONFIRMATION:
      return {
        title: t('common.cancellationSubmitted'),
        icon: <SubmittedIcon />,
      }
    case CancellationState.CANCELLED:
      return {
        title: t('common.cancellationSuccessful'),
        icon: <ConfirmedIcon />,
      }
    default:
      return {
        title: undefined,
        icon: <Blocked color="$neutral1" size="$icon.24" />,
      }
  }
}

export function CancelOrdersDialog(props: CancelOrdersDialogProps) {
  const { t } = useTranslation()
  const { orders, cancelState, cancelTxHash, onConfirm, onCancel } = props

  const { title, icon } = useCancelOrdersDialogContent(cancelState, orders)

  const cancellationGasFeeInfo = useCancelOrdersGasEstimate(orders)

  const primaryButton = useMemo(
    () => ({
      text: t('common.neverMind'),
      onPress: onCancel,
      variant: 'default' as const,
      emphasis: 'secondary' as const,
    }),
    [t, onCancel],
  )

  const secondaryButton = useMemo(
    () => ({ text: t('common.proceed'), onPress: onConfirm, variant: 'critical' as const }),
    [t, onConfirm],
  )

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
        <Container gap="$spacing24">
          {/* The legacy ModalHeader wrapper's py:'$spacing4' never resolved over this plain
              component base (probed), so the header renders unwrapped and unpadded. */}
          <GetHelpHeader closeModal={onCancel} />
          <LogoContainer>{icon}</LogoContainer>
          <Text variant="body1" width="100%" textAlign="center">
            {title}
          </Text>
          <Flex row justifyContent="center" mt="$spacing32" minHeight={24}>
            {cancelSubmitted ? (
              <ExternalLink
                href={
                  // oxlint-disable-next-line typescript/no-unnecessary-condition
                  firstOrder
                    ? getExplorerLink({
                        chainId: firstOrder.chainId,
                        data: cancelTxHash,
                        type: ExplorerDataType.TRANSACTION,
                      })
                    : ''
                }
                disabled={!firstOrder}
                color="$neutral2"
              >
                {t('common.viewOnExplorer')}
              </ExternalLink>
            ) : (
              <Text variant="body3" color="$neutral2">
                {t('common.proceedInWallet')}
              </Text>
            )}
          </Flex>
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
        primaryButton={primaryButton}
        secondaryButton={secondaryButton}
        displayHelpCTA
        iconBackgroundColor="$surface3"
      >
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
  const { t } = useTranslation()
  return (
    <Flex row width="100%">
      <DetailLineItem
        LineItem={{
          Label: () => t('common.networkCost'),
          Value: () => <span>{gasEstimateValue ? gasFeeFormatted : '-'}</span>,
        }}
      />
    </Flex>
  )
}
