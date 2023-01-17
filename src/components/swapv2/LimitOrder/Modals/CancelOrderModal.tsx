import { Trans, t } from '@lingui/macro'
import { useCallback, useMemo } from 'react'
import { Text } from 'rebass'

import { ButtonError } from 'components/Button'
import Logo from 'components/Logo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useCurrencyV2 } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { TransactionFlowState } from 'types'

import { calcPercentFilledOrder, formatAmountOrder } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'
import useBaseTradeInfo, { BaseTradeInfo } from '../useBaseTradeInfo'
import { Container, Header, Label, ListInfo, MarketInfo, Note, Rate, Value } from './styled'

const styleLogo = { width: 20, height: 20 }
function ContentCancel({
  isCancelAll,
  order,
  marketPrice,
  onSubmit,
  onDismiss,
}: {
  isCancelAll: boolean
  order: LimitOrder | undefined
  marketPrice: BaseTradeInfo | undefined
  onSubmit: () => void
  onDismiss: () => void
}) {
  const theme = useTheme()
  const {
    takerAssetLogoURL,
    makerAssetSymbol,
    takerAssetSymbol,
    makerAssetLogoURL,
    makingAmount,
    takingAmount,
    filledTakingAmount,
    status,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order ?? ({} as LimitOrder)
  const renderContentCancelAll = () => {
    return (
      <Label>
        <Trans>Are you sure you want to cancel all orders?</Trans>
      </Label>
    )
  }
  const listData = useMemo(() => {
    return !order
      ? []
      : [
          {
            label: t`I want to cancel my order where`,
            content: <Value />,
          },
          {
            label: t`I pay`,
            content: (
              <Value>
                <Logo srcs={[makerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`and receive`,
            content: (
              <Value>
                <Logo srcs={[takerAssetLogoURL]} style={styleLogo} />
                <Text>
                  {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerAssetSymbol}
                </Text>
              </Value>
            ),
          },
          {
            label: t`at`,
            content: <Rate order={order} />,
          },
        ]
  }, [
    makerAssetLogoURL,
    makerAssetSymbol,
    makingAmount,
    takerAssetLogoURL,
    takerAssetSymbol,
    takingAmount,
    order,
    makerAssetDecimals,
    takerAssetDecimals,
  ])
  return (
    <Container>
      <Header title={t`Cancel Order`} onDismiss={onDismiss} />
      {isCancelAll ? (
        renderContentCancelAll()
      ) : (
        <>
          <ListInfo listData={listData} />
          <MarketInfo marketPrice={marketPrice} symbolIn={makerAssetSymbol} symbolOut={takerAssetSymbol} />
        </>
      )}
      <Note
        note={t`Note: Cancelling an order will cost gas fees. ${
          status === LimitOrderStatus.PARTIALLY_FILLED
            ? `Your currently existing order is ${calcPercentFilledOrder(
                filledTakingAmount,
                takingAmount,
                takerAssetDecimals,
              )}% filled`
            : null
        }`}
      />
      <ButtonError onClick={onSubmit} style={{ background: theme.red }}>
        <Trans>Cancel</Trans>
      </ButtonError>
    </Container>
  )
}

export default function CancelOrderModal({
  onSubmit,
  onDismiss,
  flowState,
  order,
  isOpen,
  isCancelAll,
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  order?: LimitOrder
  isOpen: boolean
  isCancelAll: boolean
}) {
  const currencyIn = useCurrencyV2(order?.makerAsset) || undefined
  const currencyOut = useCurrencyV2(order?.takerAsset) || undefined
  const { tradeInfo } = useBaseTradeInfo(currencyIn, currencyOut)
  const confirmationContent = useCallback(
    () =>
      flowState.errorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
      ) : (
        <ContentCancel
          onSubmit={onSubmit}
          onDismiss={onDismiss}
          marketPrice={tradeInfo}
          isCancelAll={isCancelAll}
          order={order}
        />
      ),
    [onDismiss, flowState.errorMessage, onSubmit, order, tradeInfo, isCancelAll],
  )
  return (
    <TransactionConfirmationModal
      hash={flowState.txHash}
      isOpen={flowState.showConfirm && isOpen}
      onDismiss={onDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={confirmationContent}
      pendingText={flowState.pendingText || t`Canceling order`}
    />
  )
}
