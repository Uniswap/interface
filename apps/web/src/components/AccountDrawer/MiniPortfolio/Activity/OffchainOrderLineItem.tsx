import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { DetailLineItem, LineItemData } from 'components/swap/DetailLineItem'
import TradePrice from 'components/swap/TradePrice'
import { ExternalLink } from 'theme/components'
import { ellipseMiddle } from 'utils/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { formatTimestamp } from '../formatTimestamp'
import { OffchainOrderDetails } from './types'

export enum OffchainOrderLineItemType {
  EXCHANGE_RATE = 'EXCHANGE_RATE',
  EXPIRY = 'EXPIRY',
  NETWORK_COST = 'NETWORK_COST',
  TRANSACTION_ID = 'TRANSACTION_ID',
}

export type OffchainOrderLineItemProps =
  | {
      type: OffchainOrderLineItemType.EXCHANGE_RATE
      amounts: {
        inputAmount: CurrencyAmount<Currency>
        outputAmount: CurrencyAmount<Currency>
      }
    }
  | {
      type: OffchainOrderLineItemType.EXPIRY
      order: OffchainOrderDetails
    }
  | {
      type: OffchainOrderLineItemType.TRANSACTION_ID
      explorerLink: string
      order: OffchainOrderDetails
    }
  | {
      type: OffchainOrderLineItemType.NETWORK_COST
    }

function useLineItem(details: OffchainOrderLineItemProps): LineItemData | undefined {
  const { formatNumber } = useFormatter()
  switch (details.type) {
    case OffchainOrderLineItemType.EXCHANGE_RATE:
      return {
        Label: () => <Trans>Rate</Trans>,
        Value: () => (
          <TradePrice
            price={
              new Price(
                details.amounts?.inputAmount.currency,
                details.amounts?.outputAmount.currency,
                details.amounts?.inputAmount.quotient,
                details.amounts?.outputAmount.quotient
              )
            }
          />
        ),
      }
    case OffchainOrderLineItemType.EXPIRY:
      return {
        Label: () => <Trans>Expiry</Trans>,
        Value: () => <span>{formatTimestamp(details.order.expiry)}</span>,
      }
    case OffchainOrderLineItemType.NETWORK_COST:
      return {
        Label: () => <Trans>Network cost</Trans>,
        Value: () => <span>{formatNumber({ input: 0, type: NumberType.FiatGasPrice })}</span>,
      }
    case OffchainOrderLineItemType.TRANSACTION_ID:
      return {
        Label: () => <Trans>Transaction ID</Trans>,
        Value: () => (
          <ExternalLink href={details.explorerLink}>{ellipseMiddle(details.order.txHash ?? '')}</ExternalLink>
        ),
      }
    default:
      return undefined
  }
}

export function OffchainOrderLineItem(props: OffchainOrderLineItemProps) {
  const LineItem = useLineItem(props)
  if (!LineItem) return null

  return <DetailLineItem LineItem={LineItem} />
}
