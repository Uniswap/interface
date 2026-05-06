import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  FORMAT_DATE_TIME_SHORT,
  useFormattedDateTime,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ellipseMiddle } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { DetailLineItem, LineItemData } from '~/components/DetailLineItem'
import TradePrice from '~/components/TradePrice'
import { ExternalLink } from '~/theme/components/Links'

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
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const localizedDayjs = useLocalizedDayjs()
  const expiry =
    details.type === OffchainOrderLineItemType.EXPIRY && details.order.expiry ? details.order.expiry * 1000 : 0
  const formattedExpiry = useFormattedDateTime(localizedDayjs(expiry), FORMAT_DATE_TIME_SHORT)

  return useMemo(() => {
    switch (details.type) {
      case OffchainOrderLineItemType.EXCHANGE_RATE:
        return {
          Label: () => t('common.rate'),
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
          Label: () => t('common.expiry'),
          Value: () => <span>{details.order.expiry ? formattedExpiry : undefined}</span>,
        }
      case OffchainOrderLineItemType.NETWORK_COST:
        return {
          Label: () => t('common.networkCost'),
          Value: () => <span>{convertFiatAmountFormatted(0, NumberType.FiatGasPrice)}</span>,
        }
      case OffchainOrderLineItemType.TRANSACTION_ID:
        return {
          Label: () => t('common.transactionId'),
          Value: () => (
            <ExternalLink href={details.explorerLink}>{ellipseMiddle({ str: details.order.hash ?? '' })}</ExternalLink>
          ),
        }
      default:
        return undefined
    }
  }, [details, convertFiatAmountFormatted, formattedExpiry, t])
}

export function OffchainOrderLineItem(props: OffchainOrderLineItemProps) {
  const LineItem = useLineItem(props)
  if (!LineItem) {
    return null
  }

  return <DetailLineItem LineItem={LineItem} />
}
