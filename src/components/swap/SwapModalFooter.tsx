import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import {
  formatPercentInBasisPointsNumber,
  formatPercentNumber,
  formatToDecimal,
  getDurationFromDateMilliseconds,
  getDurationUntilTimestampSeconds,
  getTokenAddress,
} from 'lib/utils/analytics'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import { useClientSideRouter, useUserSlippageTolerance } from 'state/user/hooks'
import { computeRealizedPriceImpact } from 'utils/prices'

import { ButtonError, ButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { ResponsiveTooltipContainer, SwapCallbackError } from './styleds'
import { getTokenPath, RoutingDiagramEntry } from './SwapRoute'
import { ModalInputPanel } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import Card, { LightCard, OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { HideSmall, Separator, ThemedText } from 'theme'
import { ResponsiveHeaderText, SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'
import styled, { keyframes, useTheme } from 'styled-components'

import { ChevronDown, Info } from 'react-feather'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import AnimatedDropdown from 'components/AnimatedDropdown'
import useDebounce from 'hooks/useDebounce'
import { useLeverageManagerContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { BigNumber as BN } from "bignumber.js"
import { LoadingOpacityContainer } from 'components/Loader/styled'
import TradePrice from './TradePrice'
import { useCurrency, useToken } from 'hooks/Tokens'
import { formatNumber, formatNumberOrString } from '@uniswap/conedison/format'
import { NumberType } from '@uniswap/conedison/format'
import { useLeveragePosition } from 'hooks/useV3Positions'
import { LoadingRows } from 'components/Loader/styled'
import { Flash_OrderBy } from 'graphql/thegraph/__generated__/types-and-hooks'
import { truncateSync } from 'fs'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import Loader from 'components/Icons/LoadingSpinner'


interface AnalyticsEventProps {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  transactionDeadlineSecondsSinceEpoch: number | undefined
  isAutoSlippage: boolean
  isAutoRouterApi: boolean
  swapQuoteReceivedDate: Date | undefined
  routes: RoutingDiagramEntry[]
  fiatValueInput?: number
  fiatValueOutput?: number
}

const formatRoutesEventProperties = (routes: RoutingDiagramEntry[]) => {
  const routesEventProperties: Record<string, any[]> = {
    routes_percentages: [],
    routes_protocols: [],
  }

  routes.forEach((route, index) => {
    routesEventProperties['routes_percentages'].push(formatPercentNumber(route.percent))
    routesEventProperties['routes_protocols'].push(route.protocol)
    routesEventProperties[`route_${index}_input_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[0].symbol ?? ''
    )
    routesEventProperties[`route_${index}_output_currency_symbols`] = route.path.map(
      (pathStep) => pathStep[1].symbol ?? ''
    )
    routesEventProperties[`route_${index}_input_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[0])
    )
    routesEventProperties[`route_${index}_output_currency_addresses`] = route.path.map((pathStep) =>
      getTokenAddress(pathStep[1])
    )
    routesEventProperties[`route_${index}_fee_amounts_hundredths_of_bps`] = route.path.map((pathStep) => pathStep[2])
  })

  return routesEventProperties
}

const formatAnalyticsEventProperties = ({
  trade,
  hash,
  allowedSlippage,
  transactionDeadlineSecondsSinceEpoch,
  isAutoSlippage,
  isAutoRouterApi,
  swapQuoteReceivedDate,
  routes,
  fiatValueInput,
  fiatValueOutput,
}: AnalyticsEventProps) => ({
  estimated_network_fee_usd: trade.gasUseEstimateUSD ? formatToDecimal(trade.gasUseEstimateUSD, 2) : undefined,
  transaction_hash: hash,
  transaction_deadline_seconds: getDurationUntilTimestampSeconds(transactionDeadlineSecondsSinceEpoch),
  token_in_address: getTokenAddress(trade.inputAmount.currency),
  token_out_address: getTokenAddress(trade.outputAmount.currency),
  token_in_symbol: trade.inputAmount.currency.symbol,
  token_out_symbol: trade.outputAmount.currency.symbol,
  token_in_amount: formatToDecimal(trade.inputAmount, trade.inputAmount.currency.decimals),
  token_out_amount: formatToDecimal(trade.outputAmount, trade.outputAmount.currency.decimals),
  token_in_amount_usd: fiatValueInput,
  token_out_amount_usd: fiatValueOutput,
  price_impact_basis_points: formatPercentInBasisPointsNumber(computeRealizedPriceImpact(trade)),
  allowed_slippage_basis_points: formatPercentInBasisPointsNumber(allowedSlippage),
  is_auto_router_api: isAutoRouterApi,
  is_auto_slippage: isAutoSlippage,
  chain_id:
    trade.inputAmount.currency.chainId === trade.outputAmount.currency.chainId
      ? trade.inputAmount.currency.chainId
      : undefined,
  duration_from_first_quote_to_swap_submission_milliseconds: swapQuoteReceivedDate
    ? getDurationFromDateMilliseconds(swapQuoteReceivedDate)
    : undefined,
  swap_quote_block_number: trade.blockNumber,
  ...formatRoutesEventProperties(routes),
})

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  hash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [clientSideRouter] = useClientSideRouter()
  const routes = getTokenPath(trade)

  return (
    <>
      <AutoRow>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
          name={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
          properties={formatAnalyticsEventProperties({
            trade,
            hash,
            allowedSlippage,
            transactionDeadlineSecondsSinceEpoch,
            isAutoSlippage,
            isAutoRouterApi: !clientSideRouter,
            swapQuoteReceivedDate,
            routes,
            fiatValueInput: fiatValueInput.data,
            fiatValueOutput: fiatValueOutput.data,
          })}
        >
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{ margin: '10px 0 0 0' }}
            id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
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

const TransactionDetails = styled.div`
  position: relative;
  width: 100%;

`
const Wrapper = styled(Row)`
  width: 100%;
  justify-content: center;
  border-radius: inherit;
  padding: 8px 12px;
  margin-top: 0;
  min-height: 32px;
`

const StyledInfoIcon = styled(Info)`
  height: 16px;
  width: 16px;
  margin-right: 4px;
  color: ${({ theme }) => theme.textTertiary};
`

const StyledCard = styled(OutlineCard)`
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const StyledHeaderRow = styled(RowBetween) <{ disabled: boolean; open: boolean }>`
  padding: 0;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'initial' : 'pointer')};
`

const RotatingArrow = styled(ChevronDown) <{ open?: boolean }>`
  transform: ${({ open }) => (open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.1s linear;
`

const StyledPolling = styled.div`
  display: flex;
  height: 16px;
  width: 16px;
  margin-right: 2px;
  margin-left: 10px;
  align-items: center;
  color: ${({ theme }) => theme.textPrimary};
  transition: 250ms ease color;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: none;
  `}
`

const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.backgroundInteractive};
  transition: 250ms ease background-color;
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);
  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.textPrimary};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;
  transition: 250ms ease border-color;
  left: -3px;
  top: -3px;
`


const StyledPriceContainer = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
  grid-template-columns: 1fr auto;
  grid-gap: 0.25rem;
  display: flex;
  flex-direction: row;
  text-align: left;
  flex-wrap: wrap;
  padding: 8px 0;
  user-select: text;
`

enum DerivedInfoState {
  LOADING,
  VALID,
  INVALID
}
// (vars.amount0, vars.amount1)
function useDerivedLeverageCloseInfo(
  leverageManager: string | undefined,
  trader: string | undefined,
  tokenId: string | undefined,
  allowedSlippage: string,
  setState: (state: DerivedInfoState) => void,
): {
  token0: string | undefined
  token1: string | undefined
  token0Amount: string | undefined
  token1Amount: string | undefined
} {
  const leverageManagerContract = useLeverageManagerContract(leverageManager)
  const [contractResult, setContractResult] = useState<{
    closePositionResult: any,
    token0: any,
    token1: any
  }>()

  useEffect(() => {
    const laggedfxn = async () => {
      if (!leverageManagerContract || !tokenId || !trader || parseFloat(allowedSlippage) <= 0) {
        setState(DerivedInfoState.INVALID)
        return
      }

      const formattedSlippage = new BN(allowedSlippage).plus(100).shiftedBy(16).toFixed(0)
      setState(DerivedInfoState.LOADING)

      try {

        const closePositionResult = await leverageManagerContract.callStatic.closePosition(tokenId, trader, formattedSlippage)
        // const position = await leverageManagerContract.callStatic.getPosition(trader, tokenId)
        const token0 = await leverageManagerContract.callStatic.token0()
        const token1 = await leverageManagerContract.callStatic.token1()
        console.log('closeresult', closePositionResult, tokenId, formattedSlippage);
        setContractResult({
          closePositionResult,
          token0,
          token1
        })
        setState(DerivedInfoState.VALID)

      } catch (error) {
        console.error('Failed to get close info', error)
        setState(DerivedInfoState.INVALID)
      }
    }

    laggedfxn()
  }, [leverageManager, trader, tokenId, allowedSlippage])

  const info = useMemo(() => {
    if (contractResult) {
      const { closePositionResult, token0, token1 } = contractResult
      let token0Amount = new BN(closePositionResult[0].toString()).shiftedBy(-18).toFixed(6)
      let token1Amount = new BN(closePositionResult[1].toString()).shiftedBy(-18).toFixed(6)
      return {
        token0Amount,
        token1Amount,
        token0,
        token1
      }
    } else {
      return {
        token0Amount: undefined,
        token1Amount: undefined,
        token0: undefined,
        token1: undefined
      }
    }
  }, [
    contractResult
  ])

  return info
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

function useDerivedAddPremiumInfo(
  leverageManager: string | undefined,
  trader: string | undefined,
  tokenId: string | undefined,
  setState: (state: DerivedInfoState) => void,
): {
  rate: string | undefined
} {
  const leverageManagerContract = useLeverageManagerContract(leverageManager)
  const [contractResult, setContractResult] = useState<{
    addPremiumResult: any
  }>()

  useEffect(() => {
    const laggedfxn = async () => {
      if (!leverageManagerContract || !tokenId || !trader) {
        setState(DerivedInfoState.INVALID)
        return
      }
      setState(DerivedInfoState.LOADING)

      try {
        const position = await leverageManagerContract.callStatic.getPosition(trader, tokenId)

        const addPremiumResult = await leverageManagerContract.callStatic.payPremium(trader, tokenId)
        setContractResult({
          addPremiumResult
        })
        console.log("addPosition:", position)
        setState(DerivedInfoState.VALID)

      } catch (error) {
        console.error('Failed to get addPremium info', error)
        setState(DerivedInfoState.INVALID)
      }
    }

    laggedfxn()
  }, [leverageManager, trader, tokenId])

  const info = useMemo(() => {
    if (contractResult) {
      return {
        rate: new BN(contractResult.toString()).shiftedBy(-18).toFixed(12)
      }
    } else {
      return {
        rate: undefined
      }
    }
  }, [
    contractResult
  ])

  return info
}

export function CloseLeverageModalFooter({
  leverageManagerAddress,
  tokenId,
  trader,
  slippage,
  setSlippage,
  handleClosePosition
}: {
  leverageManagerAddress: string | undefined
  tokenId: string | undefined
  trader: string | undefined,
  slippage: string,
  setSlippage: (slippage: string) => void
  handleClosePosition: () => void | undefined
}) {

  // const [slippage, setSlippage] = useState("0.01")
  const [derivedState, setDerivedState] = useState<DerivedInfoState>(DerivedInfoState.INVALID)
  const [showDetails, setShowDetails] = useState(false)
  const theme = useTheme()

  const [state, position] = useLeveragePosition(leverageManagerAddress, trader, tokenId)

  // what do we need for the simulation
  const debouncedSlippage = useDebounce(slippage, 200)

  const {
    token0Amount,
    token1Amount,
    token0: token0Address,
    token1: token1Address
  } = useDerivedLeverageCloseInfo(leverageManagerAddress, trader, tokenId, debouncedSlippage, setDerivedState)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const loading = derivedState === DerivedInfoState.LOADING
  const valid = derivedState === DerivedInfoState.VALID

  const inputIsToken0 = !position?.isToken0

  return (
    <AutoRow>
      <LightCard marginTop="10px">
        <AutoColumn gap="md">
          <RowBetween>
            <ThemedText.DeprecatedMain fontWeight={400}>
              <Trans>Allowed Slippage</Trans>
            </ThemedText.DeprecatedMain>
          </RowBetween>
          <>
            <RowBetween>
              <ResponsiveHeaderText>
                <Trans>{slippage}%</Trans>
              </ResponsiveHeaderText>
              <AutoRow gap="4px" justify="flex-end">
                <SmallMaxButton onClick={() => setSlippage("0.5")} width="20%">
                  <Trans>0.5</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("1")} width="20%">
                  <Trans>1</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("3")} width="20%">
                  <Trans>3</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("5")} width="20%">
                  <Trans>Max</Trans>
                </SmallMaxButton>
              </AutoRow>
            </RowBetween>
            <Slider
              value={parseFloat(slippage)}
              onChange={(val) => setSlippage(val.toString())}
              min={0.01}
              max={5.0}
              step={0.01}
              float={true}
              size={20}
            />
          </>
        </AutoColumn>
      </LightCard>
      <TransactionDetails>
        <Wrapper style={{ marginTop: '0' }}>
          <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
            <StyledHeaderRow onClick={() => setShowDetails(!showDetails)} disabled={!token0Address} open={showDetails}>
              <RowFixed style={{ position: 'relative' }}>
                {(loading ? (
                  <StyledPolling>
                    <StyledPollingDot>
                      <Spinner />
                    </StyledPollingDot>
                  </StyledPolling>
                ) : (
                  <HideSmall>

                    <StyledInfoIcon color={leverageManagerAddress ? theme.textTertiary : theme.deprecated_bg3} />

                  </HideSmall>
                ))}
                {leverageManagerAddress ? (
                  loading ? (
                    <ThemedText.DeprecatedMain fontSize={14}>
                      <Trans>Fetching returns...</Trans>
                    </ThemedText.DeprecatedMain>
                  ) : (
                    <LoadingOpacityContainer $loading={loading}>
                      Trade Details
                    </LoadingOpacityContainer>
                  )
                ) : null}
              </RowFixed>
              <RowFixed>
                <RotatingArrow
                  stroke={token0Address ? theme.textTertiary : theme.deprecated_bg3}
                  open={Boolean(token0Address && showDetails)}
                />
              </RowFixed>

            </StyledHeaderRow>
            <AnimatedDropdown open={showDetails}>
              <AutoColumn gap="sm" style={{ padding: '0', paddingBottom: '8px' }}>
                {token0Amount && token1Amount ? (
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
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Position to close</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${inputIsToken0 ? new BN(token0Amount).abs().toString() : new BN(token1Amount).abs().toString()}  ${!inputIsToken0 ? token0?.symbol : token1?.symbol}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount you expect to receive at the current market price. You may receive less or more if the
                                market price changes while your transaction is pending.
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Debt to repay</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${inputIsToken0 ? new BN(token0Amount).abs().toString() : new BN(token1Amount).abs().toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <Separator />
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount you expect to receive at the current market price. You may receive less or more if the
                                market price changes while your transaction is pending.
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Expected Output</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${inputIsToken0 ? new BN(token0Amount).abs().toString() : new BN(token1Amount).abs().toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount you expect to receive at the current market price. You may receive less or more if the
                                market price changes while your transaction is pending.
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Price Impact</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${inputIsToken0 ? new BN(token1Amount).abs().toString() : new BN(token0Amount).abs().toString()}  ${inputIsToken0 ? token1?.symbol : token0?.symbol}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount you expect to receive at the current market price. You may receive less or more if the
                                market price changes while your transaction is pending.
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Expected Received</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${inputIsToken0 ? new BN(token0Amount).abs().toString() : new BN(token1Amount).abs().toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                    </AutoColumn>
                    <RowBetween>
                      <RowFixed>
                        <MouseoverTooltip
                          text={
                            <Trans>
                              The amount you expect to receive at the current market price. You may receive less or more if the
                              market price changes while your transaction is pending.
                            </Trans>
                          }
                        >
                          <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                            <Trans>Expected PnL</Trans>
                          </ThemedText.DeprecatedSubHeader>
                        </MouseoverTooltip>
                      </RowFixed>
                      <TextWithLoadingPlaceholder syncing={loading} width={65}>
                        <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                          {
                            `${inputIsToken0 ? new BN(token0Amount).abs().toString() : new BN(token1Amount).abs().toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                          }
                        </ThemedText.DeprecatedBlack>
                      </TextWithLoadingPlaceholder>
                    </RowBetween>
                  </StyledCard>
                )
                  : null}
              </AutoColumn>
            </AnimatedDropdown>
          </AutoColumn>
        </Wrapper>
      </TransactionDetails>
      <ButtonError
        onClick={handleClosePosition}
        disabled={false}
        style={{ margin: '10px 0 0 0' }}
        id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
      >
        <Text fontSize={20} fontWeight={500}>
          <Trans>Close Position</Trans>
        </Text>
      </ButtonError>
    </AutoRow>
  )
}

export function AddPremiumModalFooter({
  leverageManagerAddress,
  tokenId,
  trader,
  handleAddPremium
}: {
  leverageManagerAddress: string | undefined
  tokenId: string | undefined
  trader: string | undefined
  handleAddPremium: () => void
}) {


  const [derivedState, setDerivedState] = useState<DerivedInfoState>(DerivedInfoState.INVALID)
  const [showDetails, setShowDetails] = useState(false)
  const theme = useTheme()

  const [state, position] = useLeveragePosition(leverageManagerAddress, trader, tokenId)
  const { rate } = useDerivedAddPremiumInfo(leverageManagerAddress, trader, tokenId, setDerivedState)
  const inputIsToken0 = !position?.isToken0
  console.log("rate: ", rate)

  const payment = position?.totalDebtInput && rate ? new BN(position.totalDebtInput).multipliedBy(new BN(rate)).toString() : "0"
  const inputCurrency = useCurrency(position?.isToken0 ? position?.token0?.address : position?.token1?.address)
  const [leverageApprovalState, approveLeverageManager] = useApproveCallback(
    inputCurrency ?
    CurrencyAmount.fromRawAmount(inputCurrency, "1000") : undefined, 
    leverageManagerAddress ?? undefined)
  console.log("payment", leverageApprovalState)

  const updateLeverageAllowance = useCallback(async () => {
    try {
      await approveLeverageManager()
    } catch (err) {
      console.log("approveLeverageManager err: ", err)
    }
  }, [leverageManagerAddress, approveLeverageManager]) // add input to deps.

  const loading = derivedState === DerivedInfoState.LOADING
  const valid = derivedState === DerivedInfoState.VALID


  return (
    <AutoRow>
      <TransactionDetails>
        <Wrapper style={{ marginTop: '0' }}>
          <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
            <StyledHeaderRow onClick={() => setShowDetails(!showDetails)} disabled={true} open={showDetails}>
              <RowFixed style={{ position: 'relative' }}>
                {(loading ? (
                  <StyledPolling>
                    <StyledPollingDot>
                      <Spinner />
                    </StyledPollingDot>
                  </StyledPolling>
                ) : (
                  <HideSmall>

                    <StyledInfoIcon color={leverageManagerAddress ? theme.textTertiary : theme.deprecated_bg3} />

                  </HideSmall>
                ))}
                {leverageManagerAddress ? (
                  loading ? (
                    <ThemedText.DeprecatedMain fontSize={14}>
                      <Trans>Fetching expected payment...</Trans>
                    </ThemedText.DeprecatedMain>
                  ) : (
                    <LoadingOpacityContainer $loading={loading}>
                      Premium Payment Details
                    </LoadingOpacityContainer>
                  )
                ) : null}
              </RowFixed>
              <RowFixed>
                <RotatingArrow
                  stroke={true ? theme.textTertiary : theme.deprecated_bg3}
                  open={Boolean(true && showDetails)}
                />
              </RowFixed>

            </StyledHeaderRow>
            <AnimatedDropdown open={showDetails}>
              <AutoColumn gap="sm" style={{ padding: '0', paddingBottom: '8px' }}>
                {!loading ? (
                  <StyledCard>
                    <AutoColumn gap="sm">
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Premium Payment Rate
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Premium Payment Rate</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${rate ? new BN(rate).toString() : "-"}%`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Expected Payment
                              </Trans>
                            }
                          >
                            <ThemedText.DeprecatedSubHeader color={theme.textPrimary}>
                              <Trans>Expected Payment</Trans>
                            </ThemedText.DeprecatedSubHeader>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            {
                              `${new BN(payment).toString()}`
                            }
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                    </AutoColumn>
                  </StyledCard>
                )
                  : null}
              </AutoColumn>
            </AnimatedDropdown>
          </AutoColumn>
        </Wrapper>
      </TransactionDetails>
      { leverageApprovalState !== ApprovalState.APPROVED ? ( 
              <ButtonPrimary
              onClick={updateLeverageAllowance}
              disabled={leverageApprovalState === ApprovalState.PENDING}
              style={{ gap: 14 }}
            >
              {leverageApprovalState === ApprovalState.PENDING ? (
                <>
                  <Loader size="20px" />
                  <Trans>Approve pending</Trans>
                </>
              ) : (
                <>
                  <div style={{ height: 20 }}>
                    <MouseoverTooltip
                      text={
                        <Trans>
                          Permission is required.
                        </Trans>
                      }
                    >
                      <Info size={20} />
                    </MouseoverTooltip>
                  </div>
                  <Trans>Approve use of {inputIsToken0 ? position?.token0?.symbol : position?.token1?.symbol}</Trans>
                </>
              )}
            </ButtonPrimary>
      ) : (
        <ButtonError
        onClick={handleAddPremium}
        disabled={false}
        style={{ margin: '10px 0 0 0' }}
        id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
      >
        <Text fontSize={20} fontWeight={500}>
          <Trans>Add Premium</Trans>
        </Text>
      </ButtonError>
      )
      }
    </AutoRow>
  )
}


export function LeverageModalFooter({
  trade,
  allowedSlippage,
  hash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  hash: string | undefined
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
  swapQuoteReceivedDate: Date | undefined
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [clientSideRouter] = useClientSideRouter()
  const routes = getTokenPath(trade)
  // console.log("disabledConfirm", disabledConfirm)
  return (
    <>
      <AutoRow>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
          name={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
          properties={formatAnalyticsEventProperties({
            trade,
            hash,
            allowedSlippage,
            transactionDeadlineSecondsSinceEpoch,
            isAutoSlippage,
            isAutoRouterApi: !clientSideRouter,
            swapQuoteReceivedDate,
            routes,
            fiatValueInput: fiatValueInput.data,
            fiatValueOutput: fiatValueOutput.data,
          })}
        >
          <ButtonError
            onClick={onConfirm}
            disabled={disabledConfirm}
            style={{ margin: '10px 0 0 0' }}
            id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
          >
            <Text fontSize={20} fontWeight={500}>
              <Trans>Confirm Position</Trans>
            </Text>
          </ButtonError>
        </TraceEvent>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
