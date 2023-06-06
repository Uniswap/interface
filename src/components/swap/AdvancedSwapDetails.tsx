import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useMemo } from 'react'
import { InterfaceTrade, LeverageTradeState, TradeState } from 'state/routing/types'
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
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { usePool } from 'hooks/usePools'

const StyledCard = styled(Card)`
  padding: 0;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideInfoTooltips?: boolean
  leverageFactor?: number
  //leverageTrade: LeverageTrade
}

const StyledText = styled(ThemedText.DeprecatedBlack)`
  display: flex;
  flex-direction: row;
`

interface AdvancedAddLeverageDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideInfoTooltips?: boolean
  leverageFactor?: number
  leverageTrade: LeverageTrade
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
  hideInfoTooltips = false
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

            <StyledText textAlign="right" fontSize={14}>
              <TruncatedText>
                {trade?.outputAmount.toFixed(3)
                  ? `${trade?.outputAmount.toFixed(3)}`
                  : '-'}
              </TruncatedText>
              {trade.outputAmount.currency.symbol}
            </StyledText>


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

export function ReduceLeveragePositionDetails({
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
            <StyledText textAlign="right" fontSize={14}>

              <TruncatedText>
                {
                  `${leverageTrade?.totalPosition ?? "-"}`
                }
              </TruncatedText>
              {inputIsToken0 ? token1?.symbol : token0?.symbol}
            </StyledText>
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

            <StyledText textAlign="right" fontSize={14}>
              <TruncatedText>
                {`${Number(leverageTrade?.totalDebtInput) ?? "-"}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`}
              </TruncatedText>
            </StyledText>


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

export function BorrowPremiumPositionDetails({
  position // user defined slippage.
}: {
  position: LimitlessPositionDetails | undefined,
  // allowedSlippage: Percent | undefined
}) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()
  const token0 = useToken(position?.token0Address)
  const token1 = useToken(position?.token1Address)
  // console.log("leveragePositionClose", leverageTrade)

  const inputIsToken0 = position?.isToken0

  const [poolState, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.poolFee)

  const ltv = useMemo(() => {
    if (position) {
      const collateralIsToken0 = position.isToken0; // position.isToken0 === position.borrowBelow
      const price = collateralIsToken0 ? pool?.token0Price.toFixed(DEFAULT_ERC20_DECIMALS) : pool?.token1Price.toFixed(DEFAULT_ERC20_DECIMALS);
      const ltv = new BN(position.totalDebtInput).div(
        new BN(position.initialCollateral).multipliedBy(new BN(price ?? "0"))
      )
      return ltv.toNumber();
    }
    return undefined
  }, [position, pool])

  return (
    <Card padding="0" marginTop={"10px"}>
      <AutoColumn gap="sm">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  Total collateral amount
                </Trans>
              }
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>Total Collateral</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={65}>
            <StyledText textAlign="right" fontSize={14}>

              <TruncatedText>
                {
                  `${position?.initialCollateral ?? "-"}`
                }
              </TruncatedText>
              {inputIsToken0 ? token0?.symbol : token1?.symbol}
            </StyledText>
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

            <StyledText textAlign="right" fontSize={14}>
              <TruncatedText>
                {`${Number(position?.totalDebtInput) ?? "-"} `}
              </TruncatedText>
              {inputIsToken0 ?  token1?.symbol : token0?.symbol}
            </StyledText>


          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  Loan-to-Value
                </Trans>
              }
            >
              <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                <Trans>LTV</Trans>
              </ThemedText.DeprecatedSubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={false} width={65}>
            <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
              <TruncatedText>
                {ltv ? `${formatNumber(ltv)}%` : '-'}
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

export function ValueLabel({
  label,
  description,
  value,
  syncing,
  symbolAppend,
  hideInfoTooltips = false,
  width=""
}: {
  description: string,
  label: string,
  value?: number,
  syncing: boolean,
  symbolAppend?: string,
  hideInfoTooltips?: boolean
  width?: string
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
              <TruncatedText width={width}>
                {value
                  ? `${(value)}`
                  : '- '}
              </TruncatedText>
              {symbolAppend}
            </RowFixed>
            </ThemedText.DeprecatedBlack>
          </TextWithLoadingPlaceholder>
        </RowBetween>
  )
}

export const DefaultLeverageTrade: LeverageTrade = {
  inputAmount:  undefined,
  borrowedAmount:  undefined,
  state: LeverageTradeState.INVALID,
  expectedOutput: undefined, // new output. i.e. new position - existing position.
  strikePrice:  undefined,
  quotedPremium:  undefined,
  priceImpact:  undefined,
  remainingPremium:  undefined,
  effectiveLeverage:  undefined,
  existingPosition: undefined,
  existingTotalDebtInput:  undefined,
  existingTotalPosition: undefined,
  tokenId: undefined,
  existingCollateral: undefined
}

export function AdvancedLeverageSwapDetails({
  trade,
  allowedSlippage,
  syncing = false,
  hideInfoTooltips = false,
  leverageFactor,
  leverageTrade = DefaultLeverageTrade
}: AdvancedAddLeverageDetailsProps) {
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency()

  const { 
    existingTotalPosition, 
    expectedOutput,
    existingPosition,
    existingTotalDebtInput,
    existingCollateral
  } = leverageTrade;


  const fees = (Number(leverageTrade?.borrowedAmount?.toExact()) + Number(leverageTrade?.inputAmount?.toExact())) * 0.0005

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="sm">
        {existingTotalPosition && 
        <ValueLabel 
          description='The size of the current position'
          label='Existing Position'
          value={existingTotalPosition}
          symbolAppend={trade.outputAmount.currency.symbol}
          syncing={syncing}
        />}
        {existingCollateral && (
          <ValueLabel 
          description='The amount of debt for the selected position'
          label='Existing Collateral'
          value={existingCollateral}
          symbolAppend={trade.inputAmount.currency.symbol}
          syncing={syncing}
        />
        )}
        <ValueLabel
          description='The amount you expect to receive at the current market price. You may receive less or more if the market price changes while your transaction is pending.'
          label={existingPosition ? 'Added Position' : 'Expected Output'}
          value={
            (expectedOutput) ? (
              existingPosition && existingTotalPosition ? expectedOutput -  existingTotalPosition : expectedOutput
              ) : 0
          }
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
          value={Math.round(Number(leverageTrade?.remainingPremium) ) }
          syncing={syncing}
          symbolAppend={leverageTrade?.remainingPremium!=0? trade.inputAmount.currency.symbol:""}
        />
        <ValueLabel
          description="The fees you pay for swaps"
          label="Fees"
          value={Math.round(Number(fees) * 100000) / 100000}
          syncing={syncing}
          symbolAppend={trade.inputAmount.currency.symbol}
        />
        
        <RowBetween>
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
export function ReduceBorrowDetails({
  position,
}: {
  position?: LimitlessPositionDetails
}) {
  const currency0 = useCurrency(position?.token0Address)
  const currency1 = useCurrency(position?.token1Address)
  return (
    <StyledCard marginTop="10px">
      <AutoColumn gap="md">
        <ValueLabel
          description="Existing collateral amount for this position."
          value={position?.initialCollateral}
          label={"Current Collateral Amount"}
          syncing={false}
          symbolAppend={position?.isToken0 ? currency0?.symbol : currency1?.symbol}
        />
        <ValueLabel
          description="Existing borrowed amount for this position."
          value={position?.totalDebtInput}
          label={"Current Borrowed Amount"}
          syncing={false}
          symbolAppend={position?.isToken0 ? currency1?.symbol : currency0?.symbol}
        />
      </AutoColumn>
    </StyledCard>
  )
}


export const DefaultBorrowDetails: BorrowCreationDetails = {
  collateralAmount: undefined,
  borrowedAmount: undefined,
  quotedPremium: undefined,
  unusedPremium: undefined,
  priceImpact: undefined,
  ltv: undefined,
  state: TradeState.INVALID,
  existingPosition: false,
  existingTotalDebtInput: undefined,
  existingCollateral: undefined,
}

// collateralAmount: number | undefined// CurrencyAmount<Currency> | undefined
// borrowedAmount: number | undefined // totalDebtInput
// quotedPremium: number | undefined
// unusedPremium: number | undefined
// priceImpact: Percent | undefined
// ltv: number | undefined
// state: TradeState
// existingPosition: boolean | undefined
// existingTotalDebtInput: number | undefined
// existingCollateral: number | undefined

export function AdvancedBorrowSwapDetails({
  borrowTrade=DefaultBorrowDetails,
  syncing = false,
}: {
  borrowTrade?: BorrowCreationDetails,
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

  const displayValues = useMemo(() => {
    let additionalCollateral = 0
    let totalExistingCollateral = 0
    let totalExistingBorrowed = 0
    let additionalBorrowed = 0
    if (borrowTrade) {
      const { collateralAmount, borrowedAmount, existingCollateral, existingTotalDebtInput } = borrowTrade
      if (
        collateralAmount &&
        borrowedAmount
      ) {
        totalExistingCollateral = existingCollateral ?? 0
        totalExistingBorrowed = existingTotalDebtInput ?? 0
        additionalCollateral = collateralAmount
        additionalBorrowed = existingTotalDebtInput ? (
          borrowedAmount - existingTotalDebtInput
        ) : borrowedAmount
      }
    }
    return {
      additionalCollateral,
      totalExistingCollateral,
      totalExistingBorrowed,
      additionalBorrowed,
    }
  }, [borrowTrade])
  return (
    <StyledCard>
      <AutoColumn gap="sm">
        {borrowTrade?.existingPosition &&
        <ValueLabel 
          description="The existing collateral in your position"
          label="Existing Collateral"
          value={displayValues.totalExistingCollateral}
          syncing={syncing}
          symbolAppend={inputCurrency?.symbol}
        />}
        {borrowTrade?.existingPosition &&
          <ValueLabel
            description="The existing borrowed amount in your position"
            label="Existing Borrowed"
            value={displayValues.totalExistingBorrowed}
            syncing={syncing}
            symbolAppend={outputCurrency?.symbol}
          />
        }
        <ValueLabel
          description={borrowTrade?.existingPosition ? "Collateral Added to Borrow Position" : "Net collateral for the transaction"}
          label={borrowTrade?.existingPosition ? "Additonal Collateral" : "Total Collateral"}
          value={displayValues.additionalCollateral}
          syncing={syncing}
          symbolAppend={inputCurrency?.symbol}
          width={"100px"}
        />
        <ValueLabel
          description={borrowTrade?.existingPosition ? "Additional borrowed amount" : "The borrowed amount you expect to receive at the current market price."}
          label={"Amount to Borrow"}
          value={displayValues.additionalBorrowed}
          syncing={syncing}
          symbolAppend={outputCurrency?.symbol}
          width={"100px"}
        />
        <Separator />
        <ValueLabel 
          description="The quoted premium you are expected to pay within 24hrs."
          label="Quoted Premium"
          value={borrowTrade?.quotedPremium}
          syncing={syncing}
          symbolAppend={outputCurrency?.symbol}
          width={"100px"}
        />
      </AutoColumn>
    </StyledCard>
  )
}
