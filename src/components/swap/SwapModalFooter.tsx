import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { ElementName, EventName } from 'components/AmplitudeAnalytics/constants'
import { Event } from 'components/AmplitudeAnalytics/constants'
import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import { useClientSideRouter, useUserSlippageTolerance } from 'state/user/hooks'
import { computeRealizedLPFeePercent } from 'utils/prices'

import { ButtonError } from '../Button'
import { AutoRow } from '../Row'
import { getPriceImpactPercent } from './AdvancedSwapDetails'
import { SwapCallbackError } from './styleds'

function getDurationTillTimestampSinceEpoch(futureTimestampSinceEpoch?: number): number | undefined {
  if (!futureTimestampSinceEpoch) return undefined
  return futureTimestampSinceEpoch - new Date().getTime() / 1000
}

const getNumberFormattedToDecimalPlace = (
  intialNumberObject: Percent | CurrencyAmount<Token | Currency>,
  decimalPlace: number
): number => parseFloat(intialNumberObject.toFixed(decimalPlace))

const formatPercentInBasisPointsNumber = (percent: Percent): number => parseFloat(percent.toFixed(2)) * 100

interface AnalyticsEventProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  txHash: string | undefined
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch: number | undefined
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  tokenInAmountUsd: string | undefined
  tokenOutAmountUsd: string | undefined
  lpFeePercent: Percent
}

const formatAnalyticsEventProperties = ({
  trade,
  txHash,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  tokenInAmountUsd,
  tokenOutAmountUsd,
  lpFeePercent,
}: AnalyticsEventProps) => ({
  estimated_network_fee_usd: trade.gasUseEstimateUSD
    ? getNumberFormattedToDecimalPlace(trade.gasUseEstimateUSD, 2)
    : undefined,
  transaction_hash: txHash,
  transaction_deadline_seconds: getDurationTillTimestampSinceEpoch(transactionDeadlineSecondsSinceEpoch),
  token_in_amount_usd: tokenInAmountUsd ? parseFloat(tokenInAmountUsd) : undefined,
  token_out_amount_usd: tokenOutAmountUsd ? parseFloat(tokenOutAmountUsd) : undefined,
  token_in_address: trade.inputAmount.currency.isToken ? trade.inputAmount.currency.address : undefined,
  token_out_address: trade.outputAmount.currency.isToken ? trade.outputAmount.currency.address : undefined,
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: getNumberFormattedToDecimalPlace(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: getNumberFormattedToDecimalPlace(trade.outputAmount, trade.outputAmount.currency.decimals),
  price_impact_basis_points: formatPercentInBasisPointsNumber(getPriceImpactPercent(lpFeePercent, trade)),
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  is_auto_router_api: isAutoRouterApi,
  is_auto_slippage: isAutoSlippage,
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  // TODO(lynnshaoyu): implement duration_from_first_quote_to_swap_submission_seconds
})

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  txHash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  txHash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance() === 'auto'
  const [clientSideRouter] = useClientSideRouter()
  const tokenInAmountUsd = useStablecoinValue(trade.inputAmount)?.toFixed(2)
  const tokenOutAmountUsd = useStablecoinValue(trade.outputAmount)?.toFixed(2)
  const lpFeePercent = computeRealizedLPFeePercent(trade)

  return (
    <>
      <AutoRow>
        <TraceEvent
          events={[Event.onClick]}
          element={ElementName.CONFIRM_SWAP_BUTTON}
          name={EventName.SWAP_SUBMITTED}
          properties={formatAnalyticsEventProperties({
            trade,
            txHash,
            allowedSlippage,
            transactionDeadlineSecondsSinceEpoch,
            isAutoSlippage,
            isAutoRouterApi: !clientSideRouter,
            tokenInAmountUsd,
            tokenOutAmountUsd,
            lpFeePercent,
          })}
        >
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{ margin: '10px 0 0 0' }}
            id={ElementName.CONFIRM_SWAP_BUTTON}
          >
            <Text fontSize={20} fontWeight={500}>
              <Trans>Confirm Swap</Trans>
            </Text>
          </ButtonError>
        </TraceEvent>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
