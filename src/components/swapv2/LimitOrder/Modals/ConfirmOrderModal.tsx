import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, memo, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonPrimary, ButtonWarning } from 'components/Button'
import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { WORSE_PRICE_DIFF_THRESHOLD } from 'components/swapv2/LimitOrder/const'
import { useActiveWeb3React } from 'hooks'
import { BaseTradeInfoLO } from 'hooks/useBaseTradeInfo'
import ErrorWarningPanel from 'pages/Bridge/ErrorWarning'
import { TransactionFlowState } from 'types'

import { formatAmountOrder } from '../helpers'
import { RateInfo } from '../type'
import { Container, Header, ListInfo, MarketInfo, Note, Rate, Value } from './styled'

const styleLogo = { width: 20, height: 20 }

export default memo(function ConfirmOrderModal({
  onSubmit,
  currencyIn,
  currencyOut,
  onDismiss,
  flowState,
  outputAmount,
  inputAmount,
  expireAt,
  marketPrice,
  rateInfo,
  note,
  warningMessage,
  percentDiff,
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  expireAt: number
  marketPrice: BaseTradeInfoLO | undefined
  rateInfo: RateInfo
  note?: string
  warningMessage: ReactNode[]
  percentDiff: number
}) {
  const { account } = useActiveWeb3React()
  const [confirmed, setConfirmed] = useState(false)
  const shouldShowConfirmFlow = percentDiff < WORSE_PRICE_DIFF_THRESHOLD

  const displayCurrencyOut = useMemo(() => {
    return currencyOut?.isNative ? currencyOut.wrapped : currencyOut
  }, [currencyOut])

  const listData = useMemo(() => {
    return [
      {
        label: t`I want to pay`,
        content: currencyIn && inputAmount && (
          <Value>
            <CurrencyLogo currency={currencyIn} style={styleLogo} />
            <Text>
              {formatAmountOrder(inputAmount)} {currencyIn?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`and receive at least`,
        content: displayCurrencyOut && outputAmount && (
          <Value>
            <CurrencyLogo currency={displayCurrencyOut} style={styleLogo} />
            <Text>
              {formatAmountOrder(outputAmount)} {displayCurrencyOut?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`at`,
        content: account && <Rate rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={displayCurrencyOut} />,
      },
      {
        label: t`before the order expires on`,
        content: account && (
          <Value>
            <Text>{dayjs(expireAt).format('DD/MM/YYYY HH:mm')}</Text>
          </Value>
        ),
      },
    ]
  }, [account, currencyIn, displayCurrencyOut, inputAmount, rateInfo, outputAmount, expireAt])

  const renderConfirmPriceButton = () => {
    if (!shouldShowConfirmFlow) {
      return null
    }

    const shouldDisable = confirmed
    if (shouldDisable) {
      return (
        <ButtonPrimary disabled>
          <Trans>Confirm Price</Trans>
        </ButtonPrimary>
      )
    }

    return (
      <ButtonWarning onClick={() => setConfirmed(true)}>
        <Trans>Confirm Price</Trans>
      </ButtonWarning>
    )
  }

  const renderPlaceOrderButton = () => {
    const shouldDisable = shouldShowConfirmFlow && !confirmed

    if (shouldDisable) {
      return (
        <ButtonPrimary disabled>
          <Trans>Place Order</Trans>
        </ButtonPrimary>
      )
    }

    if (warningMessage?.length) {
      return (
        <ButtonWarning onClick={onSubmit}>
          <Trans>Place Order</Trans>
        </ButtonWarning>
      )
    }

    return (
      <ButtonPrimary onClick={onSubmit}>
        <Trans>Place Order</Trans>
      </ButtonPrimary>
    )
  }

  const renderConfirmationContent = () => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
          ) : (
            <Container>
              <Header title={t`Review your order`} onDismiss={onDismiss} />
              <ListInfo listData={listData} />
              <MarketInfo
                marketPrice={marketPrice}
                symbolIn={currencyIn?.symbol}
                symbolOut={displayCurrencyOut?.symbol}
              />
              <Note note={note} />

              {warningMessage?.length > 0 && (
                <Column gap="16px">
                  {warningMessage?.map((mess, i) => (
                    <ErrorWarningPanel key={i} type="warn" title={mess} />
                  ))}
                </Column>
              )}

              <Flex
                sx={{
                  gap: '12px',
                }}
              >
                {renderConfirmPriceButton()}
                {renderPlaceOrderButton()}
              </Flex>
            </Container>
          )}
        </div>
      </Flex>
    )
  }

  const handleDismiss = () => {
    onDismiss()

    // delay till the animation's done
    setTimeout(() => {
      setConfirmed(false)
    }, 200)
  }

  return (
    <TransactionConfirmationModal
      maxWidth={450}
      hash={flowState.txHash}
      isOpen={flowState.showConfirm}
      onDismiss={handleDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={renderConfirmationContent}
      pendingText={flowState.pendingText || t`Placing order`}
    />
  )
})
