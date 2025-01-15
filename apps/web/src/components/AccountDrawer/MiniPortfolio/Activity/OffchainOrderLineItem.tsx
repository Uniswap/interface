import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { DetailLineItem, LineItemData } from 'components/swap/DetailLineItem'
import TradePrice from 'components/swap/TradePrice'
import { Trans } from 'react-i18next'
import { UniswapXOrderDetails } from 'state/signatures/types'
import { ExternalLink } from 'theme/components'
import { ellipseMiddle } from 'utilities/src/addresses'
import { NumberType, useFormatter } from 'utils/formatNumbers'

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
      order: UniswapXOrderDetails
    }
  | {
      type: OffchainOrderLineItemType.TRANSACTION_ID
      explorerLink: string
      order: UniswapXOrderDetails
    }
  | {
      type: OffchainOrderLineItemType.NETWORK_COST
    }

function useLineItem(details: OffchainOrderLineItemProps): LineItemData | undefined {
  const { formatNumber } = useFormatter()
  switch (details.type) {
    case OffchainOrderLineItemType.EXCHANGE_RATE:
      return {
        Label: () => <Trans i18nKey="common.rate">Rate</Trans>,
        Value: () => (
          <TradePrice
            price={
              new Price(
                details.amounts?.inputAmount.currency,
                details.amounts?.outputAmount.currency,
                details.amounts?.inputAmount.quotient,
                details.amounts?.outputAmount.quotient,
              )
            }
          />
        ),
      }
    case OffchainOrderLineItemType.EXPIRY:
      return {
        Label: () => <Trans i18nKey="common.expiry" />,
        Value: () => <span>{details.order.expiry && formatTimestamp(details.order.expiry * 1000)}</span>,
      }
    case OffchainOrderLineItemType.NETWORK_COST:
      return {
        Label: () => <Trans i18nKey="common.networkCost" />,
        Value: () => <span>{formatNumber({ input: 0, type: NumberType.FiatGasPrice })}</span>,
      }
    case OffchainOrderLineItemType.TRANSACTION_ID:
      return {
        Label: () => <Trans i18nKey="common.transactionId" />,
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
  if (!LineItem) {
    return null
  }

  return <DetailLineItem LineItem={LineItem} />
}
