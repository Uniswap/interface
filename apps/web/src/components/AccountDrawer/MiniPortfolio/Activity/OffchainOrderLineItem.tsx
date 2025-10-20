import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { formatTimestamp } from 'components/AccountDrawer/MiniPortfolio/formatTimestamp'
import { DetailLineItem, LineItemData } from 'components/swap/DetailLineItem'
import TradePrice from 'components/swap/TradePrice'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components/Links'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ellipseMiddle } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

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
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return useMemo(() => {
    switch (details.type) {
      case OffchainOrderLineItemType.EXCHANGE_RATE:
        return {
          Label: () => <Trans i18nKey="common.rate">Rate</Trans>,
          Value: () => (
            <TradePrice
              price={
                new Price(
                  details.amounts.inputAmount.currency,
                  details.amounts.outputAmount.currency,
                  details.amounts.inputAmount.quotient,
                  details.amounts.outputAmount.quotient,
                )
              }
            />
          ),
        }
      case OffchainOrderLineItemType.EXPIRY:
        return {
          Label: () => <Trans i18nKey="common.expiry" />,
          Value: () => (
            <span>{details.order.expiry && formatTimestamp({ timestamp: details.order.expiry * 1000 })}</span>
          ),
        }
      case OffchainOrderLineItemType.NETWORK_COST:
        return {
          Label: () => <Trans i18nKey="common.networkCost" />,
          Value: () => <span>{convertFiatAmountFormatted(0, NumberType.FiatGasPrice)}</span>,
        }
      case OffchainOrderLineItemType.TRANSACTION_ID:
        return {
          Label: () => <Trans i18nKey="common.transactionId" />,
          Value: () => (
            <ExternalLink href={details.explorerLink}>{ellipseMiddle({ str: details.order.hash ?? '' })}</ExternalLink>
          ),
        }
      default:
        return undefined
    }
  }, [details, convertFiatAmountFormatted])
}

export function OffchainOrderLineItem(props: OffchainOrderLineItemProps) {
  const LineItem = useLineItem(props)
  if (!LineItem) {
    return null
  }

  return <DetailLineItem LineItem={LineItem} />
}
