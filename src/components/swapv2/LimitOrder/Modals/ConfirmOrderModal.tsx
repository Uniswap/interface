import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { memo, useCallback, useMemo } from 'react'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useActiveWeb3React } from 'hooks'
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
}: {
  onSubmit: () => void
  onDismiss: () => void
  flowState: TransactionFlowState
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: string
  outputAmount: string
  expireAt: number
  marketPrice: Price<Currency, Currency> | undefined
  rateInfo: RateInfo
  note?: string
}) {
  const { account } = useActiveWeb3React()

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
        content: currencyOut && outputAmount && (
          <Value>
            <CurrencyLogo currency={currencyOut} style={styleLogo} />
            <Text>
              {formatAmountOrder(outputAmount)} {currencyOut?.symbol}
            </Text>
          </Value>
        ),
      },
      {
        label: t`at`,
        content: account && <Rate rateInfo={rateInfo} currencyIn={currencyIn} currencyOut={currencyOut} />,
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
  }, [account, currencyIn, currencyOut, inputAmount, rateInfo, outputAmount, expireAt])

  const confirmationContent = useCallback(() => {
    return (
      <Flex flexDirection={'column'} width="100%">
        <div>
          {flowState.errorMessage ? (
            <TransactionErrorContent onDismiss={onDismiss} message={flowState.errorMessage} />
          ) : (
            <Container>
              <Header title={t`Review your order`} onDismiss={onDismiss} />
              <ListInfo listData={listData} />
              <MarketInfo marketPrice={marketPrice} />
              <Note note={note} />
              <ButtonPrimary onClick={onSubmit}>
                <Trans>Place Order</Trans>
              </ButtonPrimary>
            </Container>
          )}
        </div>
      </Flex>
    )
  }, [onDismiss, flowState.errorMessage, listData, onSubmit, marketPrice, note])

  return (
    <TransactionConfirmationModal
      hash={flowState.txHash}
      isOpen={flowState.showConfirm}
      onDismiss={onDismiss}
      attemptingTxn={flowState.attemptingTxn}
      content={confirmationContent}
      pendingText={flowState.pendingText || t`Placing order`}
    />
  )
})
