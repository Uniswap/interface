import {
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react'
import { formatEther, formatUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { LoadingRows } from 'components/Loader/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { NoFragmentCyclesRule } from 'graphql'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useV3Positions } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { useContext, useMemo, useState } from 'react'
import { HelpCircle } from 'react-feather'
import { useNetworkGasPrice } from 'state/user/hooks'
import { ThemeContext } from 'styled-components/macro'
import styled from 'styled-components/macro'
import { unwrappedToken } from 'utils/unwrappedToken'

import { TYPE } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import { TransactionDetailsLabel } from './styleds'

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

interface AdvancedSwapDetailsProps {
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
  serviceFee: CurrencyAmount<Currency> | undefined
  priceAmount: Price<Currency, Currency> | undefined
  syncing?: boolean
  outputAmount: CurrencyAmount<Currency> | undefined
  amountToBePaid: number
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

export function AdvancedSwapDetails({
  trade,
  serviceFee,
  outputAmount,
  priceAmount,
  syncing = false,
  amountToBePaid,
}: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const gasAmount = useNetworkGasPrice()

  return trade && priceAmount ? (
    <AutoColumn gap="8px">
      <TransactionDetailsLabel fontWeight={500} fontSize={14}>
        <Trans>Transaction Fees</Trans>
      </TransactionDetailsLabel>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Service Fee</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <TYPE.black textAlign="right" fontSize={14}>
            {serviceFee ? `${serviceFee.toSignificant(8)} ${serviceFee.currency.symbol}` : '-'}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
    </AutoColumn>
  ) : null
}

export function TransactionDetails({
  trade,
  serviceFee,
  outputAmount,
  priceAmount,
  syncing = false,
  amountToBePaid,
}: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)

  const gasAmount = useNetworkGasPrice()

  return trade && priceAmount ? (
    <AutoColumn gap="8px">
      <TransactionDetailsLabel fontWeight={500} fontSize={14}>
        <Trans>Transaction Details</Trans>
      </TransactionDetailsLabel>

      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Minimum received</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <TYPE.black textAlign="right" fontSize={14}>
            {outputAmount?.toSignificant(6)} {outputAmount?.currency.symbol}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
    </AutoColumn>
  ) : null
}

export function KromDetails({
  trade,
  serviceFee,
  outputAmount,
  priceAmount,
  syncing = false,
  amountToBePaid,
}: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  const { fundingBalance } = useV3Positions(account)

  const gasAmount = useNetworkGasPrice()

  const suggestedKrom = serviceFee ? serviceFee.multiply(2).toSignificant(8) : 0

  return trade && priceAmount ? (
    <AutoColumn gap="8px">
      <TransactionDetailsLabel fontWeight={500} fontSize={14}>
        <HeaderContainer>
          {' '}
          <div>
            {' '}
            <Trans>KROM Details</Trans>
          </div>
        </HeaderContainer>
      </TransactionDetailsLabel>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Service Fee</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <TYPE.black textAlign="right" fontSize={14}>
            {serviceFee ? `${serviceFee.toSignificant(8)} ${serviceFee.currency.symbol}` : '-'}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Deposited KROM</Trans>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={65}>
          <TYPE.black textAlign="right" fontSize={14}>
            {fundingBalance ? `${fundingBalance.toSignificant(8)} ${fundingBalance.currency.symbol}` : '-'}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>

      <RowBetween>
        <RowFixed>
          <TYPE.subHeader color={theme.text1}>
            <Trans>Suggested KROM</Trans>
            <MouseoverTooltip
              text={
                <Trans>
                  It is recommended to deposit x2 of the current service fee. Deposit in case you have low amount of
                  KROM.{' '}
                </Trans>
              }
            >
              <HelpCircle size="15" color={'white'} style={{ marginLeft: '2px' }} />
            </MouseoverTooltip>
          </TYPE.subHeader>
        </RowFixed>
        <TextWithLoadingPlaceholder syncing={syncing} width={70}>
          <TYPE.black textAlign="right" fontSize={14}>
            {suggestedKrom ?? ''} {suggestedKrom ? 'KROM' : ''}
          </TYPE.black>
        </TextWithLoadingPlaceholder>
      </RowBetween>
    </AutoColumn>
  ) : null
}
