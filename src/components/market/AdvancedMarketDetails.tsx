import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingRows } from 'components/Loader/styled'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext } from 'react'
import { useIsGaslessMode } from 'state/user/hooks'
import { ThemeContext } from 'styled-components/macro'

import { TYPE } from '../../theme'
import { shortenAddress } from '../../utils'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { TransactionDetailsLabel } from './styleds'

interface AdvancedMarketDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  referer: string | null
  paymentToken: Token | undefined | null
  paymentFees: CurrencyAmount<Currency> | undefined
  minimumReceived: number | undefined
}

function TextWithLoadingPlaceholder({
  syncing,
  width,
  children,
}: {
  syncing: boolean
  width: number
  children: JSX.Element
}) {
  return syncing ? (
    <LoadingRows>
      <div style={{ height: '15px', width: `${width}px` }} />
    </LoadingRows>
  ) : (
    children
  )
}

export function AdvancedMarketDetails({
  trade,
  allowedSlippage,
  syncing = false,
  referer,
  paymentToken,
  paymentFees,
  minimumReceived,
}: AdvancedMarketDetailsProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const isGaslessMode =
    useIsGaslessMode() &&
    chainId !== SupportedChainId.OPTIMISM &&
    chainId !== SupportedChainId.BASE &&
    chainId !== SupportedChainId.MAINNET

  return !trade ? null : (
    <AutoColumn gap="8px">
      <TransactionDetailsLabel fontWeight={400} fontSize={14}>
        <Trans>Transaction Details</Trans>
      </TransactionDetailsLabel>

      <RowBetween>
        <RowFixed>
          <TYPE.small color={theme.text1}>
            <Trans>Allowed Slippage</Trans>
          </TYPE.small>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={45}>
          <TYPE.black textAlign="right" fontSize={14}>
            {allowedSlippage.toFixed(2)}%
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.small color={theme.text1}>
            {trade.tradeType === TradeType.EXACT_INPUT ? (
              <Trans>Minimum received {isGaslessMode ? <span>(including fees)</span> : ''}</Trans>
            ) : (
              <Trans>Maximum sent</Trans>
            )}
          </TYPE.small>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <TYPE.black textAlign="right" fontSize={14}>
            {trade.tradeType === TradeType.EXACT_INPUT
              ? `${minimumReceived || trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${
                  trade.outputAmount.currency.symbol
                }`
              : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      {isGaslessMode && (
        <RowBetween>
          <RowFixed>
            <TYPE.subHeader color={theme.text1}>Fees:</TYPE.subHeader>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <TYPE.black textAlign="right" fontSize={14}>
              {paymentFees?.toSignificant(4)} {paymentToken?.symbol}
            </TYPE.black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
      )}

      {referer && (
        <RowBetween>
          <RowFixed>
            <TYPE.subHeader color={theme.text1}>Referer:</TYPE.subHeader>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <TYPE.black textAlign="right" fontSize={14}>
              {referer ? shortenAddress(referer) : '-'}
            </TYPE.black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
      )}
    </AutoColumn>
  )
}
