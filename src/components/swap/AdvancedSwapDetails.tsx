import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'

import { Separator, ThemedText } from '../../theme'
import { computeRealizedPriceImpact } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'
import FormattedPriceImpact from './FormattedPriceImpact'
import { BorrowCreationDetails, LeverageTrade, useSwapState } from 'state/swap/hooks'
import { LimitlessPositionDetails } from 'types/leveragePosition'
import { BigNumber as BN } from "bignumber.js"
import { useCurrency, useToken } from 'hooks/Tokens'
import { formatNumber } from '@uniswap/conedison/format'
import { TruncatedText } from './styleds'
import { Field } from 'state/swap/actions'

const StyledCard = styled(Card)`
  padding: 0;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideInfoTooltips?: boolean
  leverageFactor?: number
  leverageTrade?: LeverageTrade
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
  allowedSlippage,
  syncing = false,
  hideInfoTooltips = false,
  leverageTrade
}: AdvancedSwapDetailsProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()

  const { expectedOutputAmount, priceImpact } = useMemo(() => {
    return {
      expectedOutputAmount: trade?.outputAmount,
      priceImpact: trade ? computeRealizedPriceImpact(trade) : undefined,
    }
  }, [trade])

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="sm">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  The amount you expect to receive at the current market price. You may receive less or more if the
                  market price changes while your transaction is pending.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Expected Output</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>

            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <TruncatedText>
                {trade?.outputAmount.toFixed(3)
                  ? `${trade?.outputAmount.toFixed(3)}  ${trade.outputAmount.currency.symbol}`
                  : '-'}
              </TruncatedText>
            </ThemedText.DeprecatedBlack>


          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>The impact your trade has on the market price of this pool.</Trans>}
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Price Impact</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>

            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <TruncatedText>
                <FormattedPriceImpact priceImpact={priceImpact} />
              </TruncatedText>
            </ThemedText.DeprecatedBlack>


          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                  will revert.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                {trade.tradeType === TradeType.EXACT_INPUT ? (
                  <Trans>Minimum received</Trans>
                ) : (
                  <Trans>Maximum sent</Trans>
                )}{' '}
                <Trans>after slippage</Trans> ({allowedSlippage.toFixed(2)}%)
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>

            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
              <TruncatedText>
                {trade.tradeType === TradeType.EXACT_INPUT
                  ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                  : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
              </TruncatedText>
            </ThemedText.DeprecatedBlack>

          </TextWithLoadingPlaceholder>
        </RowBetween>
        {!trade?.gasUseEstimateUSD || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
          <RowBetween>
            <MouseoverTooltip
              text={
                <Trans>
                  The fee paid to miners who process your transaction. This must be paid in {nativeCurrency.symbol}.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                <Trans>Network Fee</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
                ~${trade.gasUseEstimateUSD.toFixed(2)}
              </ThemedText.DeprecatedBlack>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        )}
      </AutoColumn>
    </StyledCard>
  )
}

export function CloseLeveragePositionDetails({
  leverageTrade // user defined slippage.
}: {
  leverageTrade: LimitlessPositionDetails | undefined,
  // allowedSlippage: Percent | undefined
}) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()
  const token0 = useToken(leverageTrade?.token0Address)
  const token1 = useToken(leverageTrade?.token1Address)
  // console.log("leveragePositionClose", leverageTrade)

  const inputIsToken0 = !leverageTrade?.isToken0

  return (
    <Card padding="0" marginTop={"10px"}>
      <AutoColumn gap="sm">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  Total position size in the output token of the leverage trade
                </Trans>
              }
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Original Position</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={65}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>

              <TruncatedText>
                {
                  `${leverageTrade?.totalPosition ?? "-"}  ${inputIsToken0 ? token1?.symbol : token0?.symbol}`
                }
              </TruncatedText>
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>Total debt of the position</Trans>}
            // disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Original Debt</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={50}>

            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <TruncatedText>
                {`${Number(leverageTrade?.totalDebtInput) ?? "-"}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`}
              </TruncatedText>
            </ThemedText.DeprecatedBlack>


          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  Leverage Factor
                </Trans>
              }
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Effective Leverage</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={65}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <TruncatedText>
                {leverageTrade?.totalDebtInput && leverageTrade?.initialCollateral
                  ? `${(Number(leverageTrade?.totalDebtInput) + Number(leverageTrade.initialCollateral)) / Number(leverageTrade?.initialCollateral)}`
                  : '-'}
              </TruncatedText>

            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
      </AutoColumn>
    </Card>
  )
}

export function AddPremiumDetails({
  leverageTrade // user defined slippage.
}: {
  leverageTrade: LimitlessPositionDetails | undefined,
  // allowedSlippage: Percent | undefined
}) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()
  const token0 = useToken(leverageTrade?.token0Address)
  const token1 = useToken(leverageTrade?.token1Address)

  // console.log("leveragePositionClose", leverageTrade)

  const inputIsToken0 = !leverageTrade?.isToken0

  return (
    <StyledCard>
      <AutoColumn gap="sm">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  Total position size in the output token of the leverage trade
                </Trans>
              }
            // disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Total Position</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={65}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              {leverageTrade?.totalPosition
                ? `${new BN(leverageTrade?.totalPosition ?? "").toString()}  ${inputIsToken0 ? token1?.symbol : token0?.symbol}`
                : '-'}
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>Total debt of the position</Trans>}
            // disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Total Debt</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={50}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              {leverageTrade?.totalDebtInput
                ? `${new BN(leverageTrade?.totalDebtInput ?? "").toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                : '-'}
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
      </AutoColumn>
    </StyledCard>
  )
}

function ValueLabel({
  label,
  description,
  value,
  syncing,
  symbolAppend,
  hideInfoTooltips = false
}: {
  description: string,
  label: string,
  value?: number,
  syncing: boolean,
  symbolAppend?: string,
  hideInfoTooltips?: boolean
}) {
  const theme = useTheme()
  return (
    <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                 {description}
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>{label}</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
            <RowFixed>
              <TruncatedText>
                {value
                  ? `${(value)}`
                  : '-'}
              </TruncatedText>
              {symbolAppend}
            </RowFixed>
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
          
        </RowBetween>
  )
}

export function AdvancedLeverageSwapDetails({
  trade,
  allowedSlippage,
  syncing = false,
  hideInfoTooltips = false,
  leverageFactor,
  leverageTrade
}: AdvancedSwapDetailsProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()

  const { expectedOutputAmount, priceImpact } = useMemo(() => {
    return {
      expectedOutputAmount: trade?.outputAmount,
      priceImpact: trade ? computeRealizedPriceImpact(trade) : undefined,
    }
  }, [trade])
  const fees = (Number(leverageTrade?.borrowedAmount?.toExact()) + Number(leverageTrade?.inputAmount?.toExact())) * 0.0005

  console.log('leveragetrade', leverageTrade,leverageTrade?.borrowedAmount,leverageTrade?.inputAmount?.toExact()  ); 
  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="sm">
        <ValueLabel
          description='The amount you expect to receive at the current market price. You may receive less or more if the market price changes while your transaction is pending.'
          label='Expected Output'
          value={Math.round(Number(leverageTrade?.expectedOutput) * 100000) / 100000 }
          syncing={syncing}
          symbolAppend={trade.outputAmount.currency.symbol}
        />
        <ValueLabel
          description="Amount In / Amount Out"
          label="Quoted Price"
          value={Math.round(Number(leverageTrade?.strikePrice) * 1000000) / 1000000}
          syncing={syncing}
          symbolAppend={`${trade.inputAmount.currency.symbol} / ${trade.outputAmount.currency.symbol}`}
        />
        {/*<ValueLabel
          description="Avg entry of your position after this trade"
          label="Avg. Entry"
          value={Math.round(Number(leverageTrade?.strikePrice) * 1000000) / 1000000}
          syncing={syncing}
          symbolAppend={`${trade.inputAmount.currency.symbol} / ${trade.outputAmount.currency.symbol}`}
        />*/}
        <ValueLabel
          description="The first premium payment required to open this position"
          label="Quoted Premium"
          value={Math.round(Number(leverageTrade?.quotedPremium) * 100000) / 100000}
          syncing={syncing}
          symbolAppend={trade.inputAmount.currency.symbol}
        />
        <ValueLabel
          description="The premium refunded from your old payment"
          label="Returned premium"
          value={Math.round(Number(leverageTrade?.effectiveLeverage) ) }
          syncing={syncing}
          symbolAppend={leverageTrade?.effectiveLeverage!=0? trade.inputAmount.currency.symbol:""}
        />
        <ValueLabel
          description="The fees you pay for swaps"
          label="Fees"
          value={Math.round(Number(fees) * 100000) / 100000}
          syncing={syncing}
          symbolAppend={trade.inputAmount.currency.symbol}
        />
        
        {/*<RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  The real leverage after adding the first premium to your collateral: (borrow amount + collateral + premium)/(collateral+premium)
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Effective Leverage</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>
            <TruncatedText>
              <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                {
                  leverageTrade?.effectiveLeverage ? `${(leverageTrade?.effectiveLeverage)}`
                    : '-'}
              </ThemedText.DeprecatedBlack>
            </TruncatedText>
          </TextWithLoadingPlaceholder>
        </RowBetween>*/}
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>The impact your trade has on the market price of this pool.</Trans>}
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Price Impact</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <TruncatedText>
              <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                <FormattedPriceImpact priceImpact={leverageTrade?.priceImpact} />
              </ThemedText.DeprecatedBlack>
            </TruncatedText>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <Separator />
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                  will revert.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                {trade.tradeType === TradeType.EXACT_INPUT ? (
                  <Trans>Minimum output</Trans>
                ) : (
                  <Trans>Maximum sent</Trans>
                )}{' '}
                <Trans>after slippage</Trans> ({allowedSlippage.toFixed(2)}%)
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>

            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
              <TruncatedText>
                {trade.tradeType === TradeType.EXACT_INPUT
                  ? `${(leverageTrade?.expectedOutput) ?? "-"}  ${trade.outputAmount.currency.symbol}`
                  : '-'

                  // ? `${Number(leverageFactor) * Number(trade.minimumAmountOut(allowedSlippage).toSignificant(6))} ${trade.outputAmount.currency.symbol}`
                  // : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`
                }
              </TruncatedText>
            </ThemedText.DeprecatedBlack>

          </TextWithLoadingPlaceholder>
        </RowBetween>
        {!trade?.gasUseEstimateUSD || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
          <RowBetween>
            <MouseoverTooltip
              text={
                <Trans>
                  The fee paid to miners who process your transaction. This must be paid in {nativeCurrency.symbol}.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.DeprecatedSubHeader color={theme.textTertiary}>
                <Trans>Network Fee</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.DeprecatedBlack textAlign="right" fontSize={14} color={theme.textTertiary}>
                ~${trade.gasUseEstimateUSD.toFixed(2)}
              </ThemedText.DeprecatedBlack>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        )}
      </AutoColumn>
    </StyledCard>
  )
}


// collateralAmount: number | undefined// CurrencyAmount<Currency> | undefined
//   borrowedAmount: number | undefined // totalDebtInput
//   quotedPremium: number | undefined
//   unusedPremium: number | undefined
//   priceImpact: Percent | undefined
//   state: TradeState

export function AdvancedBorrowSwapDetails({
  borrowTrade,
  tradeState,
  syncing = false,
}: {
  borrowTrade?: BorrowCreationDetails,
  tradeState?: TradeState,
  syncing: boolean,
}) {
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
    leverageManagerAddress
  } = useSwapState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)
  const theme = useTheme()
  return (
    <StyledCard>
      <AutoColumn gap="sm">
        <ValueLabel
          description="The borrowed amount you expect to receive at the current market price. You may receive less or more if the market price changes while your transaction is pending."
          label="Expected Borrowed Amount"
          value={borrowTrade?.borrowedAmount}
          syncing={syncing}
          symbolAppend={outputCurrency?.symbol}
        />
        <Separator />
        <ValueLabel 
          description="The quoted premium you are expected to pay within 24hrs."
          label="Quoted Premium"
          value={borrowTrade?.quotedPremium}
          syncing={syncing}
          symbolAppend={inputCurrency?.symbol}
        />
        <ValueLabel 
          description="The quoted premium you are expected to pay within 24hrs."
          label="Returned Premium"
          value={borrowTrade?.quotedPremium}
          syncing={syncing}
          symbolAppend={inputCurrency?.symbol}
        />
      </AutoColumn>
    </StyledCard>
  )
}
